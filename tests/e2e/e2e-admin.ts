/**
 * Creates or deletes the throwaway E2E accounts in their own process (so no database
 * connection stays open in the Playwright runner).
 *   pnpm exec tsx tests/e2e/e2e-admin.ts create   → prints one E2E_FIXTURE=<json> line (random credentials)
 *   pnpm exec tsx tests/e2e/e2e-admin.ts delete
 *   pnpm exec tsx tests/e2e/e2e-admin.ts google on|off   → the CMS switch for Google sign-in
 */
import { randomBytes } from 'node:crypto'

import { Secret } from 'otpauth'

import 'dotenv/config'

import {
  E2E_ADMIN_EMAIL,
  E2E_EDITOR_EMAIL,
  E2E_NEW_ADMIN_EMAIL,
  E2E_STUDENT_EMAIL,
  E2E_SUPPORT_EMAIL,
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

  // `google on|off`: the CMS switch for "Continue with Google" (Settings → Sign-in options).
  if (action === 'google') {
    const state = process.argv[3]
    if (state !== 'on' && state !== 'off') throw new Error('usage: e2e-admin.ts google on|off')
    await payload.updateGlobal({
      slug: 'sign-in-settings',
      data: { googleEnabled: state === 'on' },
    })
    return
  }

  // `student <email> <password>`: a confirmed UI-test student (skips the email round trip).
  // `level <email> <code|none>`: set that student's level-check state, standing in for the
  // level-check service of Phase 11 (`none` = not started).
  if (action === 'student' || action === 'level') {
    const [email, arg] = process.argv.slice(3)
    if (!email?.endsWith(E2E_UI_DOMAIN) || !arg)
      throw new Error('student/level actions are limited to UI-test students')
    if (action === 'student') {
      const student = await payload.create({
        collection: 'students',
        disableVerificationEmail: true,
        data: {
          name: 'UI Student',
          email,
          password: arg,
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
      return
    }
    const found = await payload.find({
      collection: 'students',
      where: { email: { equals: email } },
      limit: 1,
    })
    const level =
      arg === 'none'
        ? undefined
        : (
            await payload.find({
              collection: 'levels',
              where: {
                and: [{ code: { equals: arg } }, { 'examType.code': { equals: 'JLPT' } }],
              },
              limit: 1,
            })
          ).docs[0]
    await payload.db.updateOne({
      collection: 'students',
      id: found.docs[0]!.id,
      data: {
        determinationStatus: level ? 'completed' : 'not_started',
        assignedLevel: level?.id ?? null,
        assignedAt: level ? new Date().toISOString() : null,
      },
      returning: false,
    })
    return
  }

  // Level-check records of test students go first: the database protects these links.
  const { sql } = await import('@payloadcms/db-postgres')
  const testStudents = sql`SELECT id FROM students WHERE email LIKE ${'%' + E2E_UI_DOMAIN} OR email = ${E2E_STUDENT_EMAIL}`
  await payload.db.drizzle.execute(sql`
    DELETE FROM result_items WHERE result_id IN (SELECT id FROM results WHERE student_id IN (${testStudents}));
  `)
  for (const table of ['results', 'attempts', 'level_assignments', 'level_check_sessions']) {
    await payload.db.drizzle.execute(
      sql`DELETE FROM ${sql.identifier(table)} WHERE student_id IN (${testStudents})`,
    )
  }

  // Students created through the UI by tests (unique address per run).
  await payload.db.deleteMany({
    collection: 'students',
    where: { email: { contains: E2E_UI_DOMAIN } },
  })

  // Repeated local runs would otherwise hit the per-account login limits (10 per 15 minutes).
  const { clearRateLimits } = await import('../../src/server/rate-limit')
  const adminEmails = [E2E_ADMIN_EMAIL, E2E_EDITOR_EMAIL, E2E_NEW_ADMIN_EMAIL, E2E_SUPPORT_EMAIL]
  await clearRateLimits(payload, [
    ...adminEmails.flatMap((e) => [`admins:login:acct:${e}`, `admins:forgotPassword:acct:${e}`]),
    `login:acct:${E2E_STUDENT_EMAIL}`,
    `email:acct:${E2E_STUDENT_EMAIL}`,
  ])

  // Admins cannot be deleted through the API (by design); the fixture removes them directly.
  await payload.db.deleteMany({
    collection: 'admins',
    where: { email: { in: adminEmails } },
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
  const support = await createAdmin('E2E Support', E2E_SUPPORT_EMAIL, 'Support', true)

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
    support: { pw: support.password, totp: support.secret },
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
