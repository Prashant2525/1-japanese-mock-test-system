/**
 * Creates a Super Admin and emails them a link to set their password (no default passwords).
 *
 *   pnpm admin:create --email you@example.com --name "Your Name"
 *
 * Without an email provider (EMAIL_TRANSPORT=console) the link is printed to the console.
 */
import { randomBytes } from 'node:crypto'
import { parseArgs } from 'node:util'

import 'dotenv/config'

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: { email: { type: 'string' }, name: { type: 'string' } },
  })
  const email = values.email?.trim().toLowerCase()
  const name = values.name?.trim()
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !name) {
    throw new Error('Usage: pnpm admin:create --email you@example.com --name "Your Name"')
  }

  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const { SUPER_ADMIN_ROLE } = await import('../src/server/auth/permissions')
  const payload = await getPayload({ config })

  const role = await payload.find({
    collection: 'roles',
    where: { and: [{ name: { equals: SUPER_ADMIN_ROLE } }, { isSystem: { equals: true } }] },
    limit: 1,
  })
  const roleId = role.docs[0]?.id
  if (roleId === undefined) throw new Error('Super Admin role missing. Run `pnpm migrate` first.')

  const existing = await payload.find({
    collection: 'admins',
    where: { email: { equals: email } },
    limit: 1,
  })
  if (existing.docs[0]) throw new Error(`An admin with ${email} already exists.`)

  // Random password nobody knows; the admin sets their own through the emailed link.
  await payload.create({
    collection: 'admins',
    data: {
      email,
      name,
      password: randomBytes(32).toString('base64url'),
      roles: [roleId],
      status: 'active',
      preferredLocale: 'en',
    },
  })
  await payload.forgotPassword({ collection: 'admins', data: { email }, disableEmail: false })
  console.log(
    `Super Admin ${email} created. A link to set the password has been sent (valid 60 minutes).`,
  )
}

main().then(
  () => process.exit(0),
  (err: unknown) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  },
)
