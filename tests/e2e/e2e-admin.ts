/**
 * Creates or deletes the throwaway E2E admin in its own process (so no database
 * connection stays open in the Playwright runner).
 *   pnpm exec tsx tests/e2e/e2e-admin.ts create   → prints "E2E_ADMIN_PASSWORD=<random>"
 *   pnpm exec tsx tests/e2e/e2e-admin.ts delete
 */
import { randomBytes } from 'node:crypto'

import 'dotenv/config'

import { E2E_ADMIN_EMAIL } from './admin-account'

async function main(action: string | undefined): Promise<void> {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../../src/payload.config')
  const payload = await getPayload({ config })

  await payload.delete({ collection: 'admins', where: { email: { equals: E2E_ADMIN_EMAIL } } })
  if (action === 'create') {
    const password = randomBytes(18).toString('base64url')
    await payload.create({
      collection: 'admins',
      data: { name: 'E2E Admin', email: E2E_ADMIN_EMAIL, password },
    })
    console.log(`E2E_ADMIN_PASSWORD=${password}`)
  } else if (action !== 'delete') {
    throw new Error('usage: e2e-admin.ts create|delete')
  }
}

main(process.argv[2]).then(
  () => process.exit(0),
  (err) => {
    console.error(err)
    process.exit(1)
  },
)
