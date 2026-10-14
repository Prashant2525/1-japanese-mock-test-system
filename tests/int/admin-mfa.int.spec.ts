import { Secret } from 'otpauth'
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { asUser, client, createAdmin, createStudent } from './helpers'

let payload: Payload

beforeAll(async () => {
  payload = await client()
})

/**
 * Admin two-factor login (D-058). Every admin must set up an authenticator app and enter a code
 * each session before any admin operation is allowed. The interactive setup/verify flow runs in
 * the browser and is covered by tests/e2e/admin-mfa.e2e.spec.ts.
 */
describe('admin two-factor login', () => {
  it('blocks a password-only admin session that has not set up an authenticator', async () => {
    const { admin } = await createAdmin('Super Admin')
    const user = await asUser(admin, { verified: false })
    await expect(
      payload.find({ collection: 'students', overrideAccess: false, user }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      payload.find({ collection: 'roles', overrideAccess: false, user }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('blocks an enrolled admin until this session has entered a code', async () => {
    const { admin } = await createAdmin('Super Admin')
    await payload.db.updateOne({
      collection: 'admins',
      id: admin.id,
      data: { totpSecret: new Secret().base32 },
      returning: false,
    })
    const passwordOnly = await asUser(admin, { verified: false })
    expect((passwordOnly as { hasTotp?: boolean }).hasTotp).toBe(true)
    await expect(
      payload.find({ collection: 'students', overrideAccess: false, user: passwordOnly }),
    ).rejects.toMatchObject({ status: 403 })

    const verified = await asUser(admin)
    const ok = await payload.find({ collection: 'students', overrideAccess: false, user: verified })
    expect(ok.docs).toBeDefined()
  })

  it('never returns the authenticator secret through access-controlled reads, even to a Super Admin', async () => {
    const { admin } = await createAdmin('Super Admin')
    await payload.db.updateOne({
      collection: 'admins',
      id: admin.id,
      data: { totpSecret: new Secret().base32 },
      returning: false,
    })
    const viaAccess = await payload.findByID({
      collection: 'admins',
      id: admin.id,
      overrideAccess: false,
      user: await asUser(admin),
    })
    expect(viaAccess).not.toHaveProperty('totpSecret')
  })

  it('keeps the secret out of the audit log', async () => {
    const { redact } = await import('@/server/audit/record')
    expect(redact({ email: 'a@b.c', totpSecret: 'JBSWY3DPEHPK3PXP' })).toEqual({
      email: 'a@b.c',
      totpSecret: '[redacted]',
    })
  })

  it('an admin cannot write a secret for another admin through the API', async () => {
    const { admin: actor } = await createAdmin('Super Admin')
    const { admin: target } = await createAdmin('Support')
    await payload.update({
      collection: 'admins',
      id: target.id,
      overrideAccess: false,
      user: await asUser(actor),
      data: { totpSecret: 'JBSWY3DPEHPK3PXP' } as never,
    })
    const stored = await payload.findByID({
      collection: 'admins',
      id: target.id,
      showHiddenFields: true,
    })
    expect((stored as { totpSecret?: string | null }).totpSecret ?? null).toBeNull()
  })

  it('does not affect students', async () => {
    const { student } = await createStudent()
    const user = { ...student, collection: 'students' as const }
    const own = await payload.find({ collection: 'students', overrideAccess: false, user })
    expect(own.docs.map((d) => d.id)).toEqual([student.id])
  })
})
