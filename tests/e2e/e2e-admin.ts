/**
 * Creates or deletes the throwaway E2E accounts in their own process (so no database
 * connection stays open in the Playwright runner).
 *   pnpm exec tsx tests/e2e/e2e-admin.ts create   → prints one E2E_FIXTURE=<json> line (random credentials)
 *   pnpm exec tsx tests/e2e/e2e-admin.ts delete
 */
import { randomBytes } from 'node:crypto'

import { Secret } from 'otpauth'

import 'dotenv/config'

import {
  E2E_ADMIN_EMAIL,
  E2E_EDITOR_EMAIL,
  E2E_NEW_ADMIN_EMAIL,
  E2E_STUDENT_EMAIL,
  E2E_UI_DOMAIN,
} from './admin-account'

async function main(action: string | undefined): Promise<void> {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../../src/payload.config')
  const payload = await getPayload({ config })

  // `token verify|reset <email>`: print the current emailed token for a UI-test student (the E2E
  // server uses the console email transport, so tests read the token from the database instead).
  if (action === 'token') {
    const [kind, email] = process.argv.slice(3)
    if (!email?.endsWith(E2E_UI_DOMAIN))
      throw new Error('token lookup is limited to UI-test students')
    const found = await payload.find({
      collection: 'students',
      where: { email: { equals: email } },
      showHiddenFields: true,
      limit: 1,
    })
    const doc = found.docs[0] as
      { _verificationToken?: string; resetPasswordToken?: string } | undefined
    const token = kind === 'reset' ? doc?.resetPasswordToken : doc?._verificationToken
    if (!token) throw new Error(`no ${kind} token for ${email}`)
    console.log(`TOKEN=${token}`)
    return
  }

  // Students created through the UI by tests (unique address per run).
  await payload.db.deleteMany({
    collection: 'students',
    where: { email: { contains: E2E_UI_DOMAIN } },
  })

  // Repeated local runs would otherwise hit the per-account login limits (10 per 15 minutes).
  const { clearRateLimits } = await import('../../src/server/rate-limit')
  const adminEmails = [E2E_ADMIN_EMAIL, E2E_EDITOR_EMAIL, E2E_NEW_ADMIN_EMAIL]
  await clearRateLimits(payload, [
    ...adminEmails.flatMap((e) => [`admins:login:acct:${e}`, `admins:forgotPassword:acct:${e}`]),
    `login:acct:${E2E_STUDENT_EMAIL}`,
    `email:acct:${E2E_STUDENT_EMAIL}`,
  ])

  // Admins cannot be deleted through the API (by design); the fixture removes them directly.
  await payload.db.deleteMany({
    collection: 'admins',
    where: { email: { in: [E2E_ADMIN_EMAIL, E2E_EDITOR_EMAIL, E2E_NEW_ADMIN_EMAIL] } },
  })
  await payload.db.deleteMany({
    collection: 'students',
    where: { email: { equals: E2E_STUDENT_EMAIL } },
  })
  if (action === 'delete') return
  if (action !== 'create') throw new Error('usage: e2e-admin.ts create|delete|token')

  const roleId = async (name: string) =>
    (await payload.find({ collection: 'roles', where: { name: { equals: name } }, limit: 1 }))
      .docs[0]!.id
  const pw = () => randomBytes(18).toString('base64url')

  async function createAdmin(name: string, email: string, role: string, enrolTotp: boolean) {
    const password = pw()
    const admin = await payload.create({
      collection: 'admins',
      data: {
        name,
        email,
        password,
        roles: [await roleId(role)],
        preferredLocale: 'en',
        status: 'active',
      },
    })
    let secret = ''
    if (enrolTotp) {
      secret = new Secret().base32
      await payload.db.updateOne({
        collection: 'admins',
        id: admin.id,
        data: { totpSecret: secret },
        returning: false,
      })
    }
    return { password, secret }
  }

  const superAdmin = await createAdmin('E2E Admin', E2E_ADMIN_EMAIL, 'Super Admin', true)
  const editor = await createAdmin('E2E Editor', E2E_EDITOR_EMAIL, 'Content Editor', true)
  const newcomer = await createAdmin('E2E New Admin', E2E_NEW_ADMIN_EMAIL, 'Support', false)

  const studentPassword = pw()
  const student = await payload.create({
    collection: 'students',
    disableVerificationEmail: true,
    data: {
      name: 'E2E Student',
      email: E2E_STUDENT_EMAIL,
      password: studentPassword,
      preferredLocale: 'en',
      status: 'active',
      determinationStatus: 'not_started',
    },
  })
  await payload.db.updateOne({
    collection: 'students',
    id: student.id,
    data: { _verified: true },
    returning: false,
  })

  const fixture = {
    admin: { pw: superAdmin.password, totp: superAdmin.secret },
    editor: { pw: editor.password, totp: editor.secret },
    newAdmin: { pw: newcomer.password },
    student: { pw: studentPassword },
  }
  console.log(`E2E_FIXTURE=${JSON.stringify(fixture)}`)
}

main(process.argv[2]).then(
  () => process.exit(0),
  (err) => {
    console.error(err)
    process.exit(1)
  },
)
