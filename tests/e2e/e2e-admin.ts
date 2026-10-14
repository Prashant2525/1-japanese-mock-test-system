/**
 * Creates or deletes the throwaway E2E accounts in their own process (so no database
 * connection stays open in the Playwright runner).
 *   pnpm exec tsx tests/e2e/e2e-admin.ts create   → prints KEY=value lines with random passwords
 *   pnpm exec tsx tests/e2e/e2e-admin.ts delete
 */
import { randomBytes } from 'node:crypto'

import 'dotenv/config'

import { E2E_ADMIN_EMAIL, E2E_EDITOR_EMAIL, E2E_STUDENT_EMAIL } from './admin-account'

async function main(action: string | undefined): Promise<void> {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../../src/payload.config')
  const payload = await getPayload({ config })

  // Admins cannot be deleted through the API (by design); the fixture removes them directly.
  await payload.db.deleteMany({
    collection: 'admins',
    where: { email: { in: [E2E_ADMIN_EMAIL, E2E_EDITOR_EMAIL] } },
  })
  await payload.db.deleteMany({
    collection: 'students',
    where: { email: { equals: E2E_STUDENT_EMAIL } },
  })
  if (action === 'delete') return
  if (action !== 'create') throw new Error('usage: e2e-admin.ts create|delete')

  const roleId = async (name: string) =>
    (await payload.find({ collection: 'roles', where: { name: { equals: name } }, limit: 1 }))
      .docs[0]!.id
  const pw = () => randomBytes(18).toString('base64url')

  const adminPassword = pw()
  await payload.create({
    collection: 'admins',
    data: {
      name: 'E2E Admin',
      email: E2E_ADMIN_EMAIL,
      password: adminPassword,
      roles: [await roleId('Super Admin')],
      preferredLocale: 'en',
      status: 'active',
    },
  })
  const editorPassword = pw()
  await payload.create({
    collection: 'admins',
    data: {
      name: 'E2E Editor',
      email: E2E_EDITOR_EMAIL,
      password: editorPassword,
      roles: [await roleId('Content Editor')],
      preferredLocale: 'en',
      status: 'active',
    },
  })
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

  console.log(`E2E_ADMIN_PASSWORD=${adminPassword}`)
  console.log(`E2E_EDITOR_PASSWORD=${editorPassword}`)
  console.log(`E2E_STUDENT_PASSWORD=${studentPassword}`)
}

main(process.argv[2]).then(
  () => process.exit(0),
  (err) => {
    console.error(err)
    process.exit(1)
  },
)
