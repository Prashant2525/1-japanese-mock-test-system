import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { migrations } from '@/migrations'

import { asUser, client, createAdmin, roleId, strongPassword, uniqueEmail } from './helpers'

let payload: Payload

beforeAll(async () => {
  payload = await client()
})

describe('database connectivity', () => {
  it('answers a query', async () => {
    const result = await payload.db.drizzle.execute(sql`select 1 as one`)
    expect(result.rows[0]).toEqual({ one: 1 })
  })

  it('is connected to the test database, not development data', async () => {
    const result = await payload.db.drizzle.execute(sql`select current_database() as db`)
    expect(String(result.rows[0].db)).toMatch(/test/)
  })

  it('has every shipped migration applied', async () => {
    const applied = await payload.find({ collection: 'payload-migrations', pagination: false })
    const names = applied.docs.map((d) => d.name)
    for (const m of migrations) expect(names).toContain(m.name)
  })

  it('stores admin and student sessions server-side so they can be revoked', async () => {
    const result = await payload.db.drizzle.execute(
      sql`select to_regclass('public.admins_sessions') is not null as admins, to_regclass('public.students_sessions') is not null as students`,
    )
    expect(result.rows[0]).toEqual({ admins: true, students: true })
  })

  it('has the rate-limit table', async () => {
    const result = await payload.db.drizzle.execute(
      sql`select to_regclass('public.rate_limits') is not null as present`,
    )
    expect(result.rows[0].present).toBe(true)
  })
})

describe('admins collection access (closed by default)', () => {
  it('persists an admin created by a trusted server process, without exposing the hash', async () => {
    const { admin } = await createAdmin('Support')
    const found = await payload.findByID({ collection: 'admins', id: admin.id })
    expect(found.email).toBe(admin.email)
    expect(found).not.toHaveProperty('hash')
    expect(found).not.toHaveProperty('salt')
  })

  it('refuses to create an admin for an anonymous request (no public first-user signup)', async () => {
    await expect(
      payload.create({
        collection: 'admins',
        overrideAccess: false,
        data: {
          name: 'Intruder',
          email: uniqueEmail('intruder'),
          password: strongPassword(),
          roles: [await roleId('Super Admin')],
          preferredLocale: 'en',
          status: 'active',
        },
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('refuses anonymous reads of admins', async () => {
    await expect(
      payload.find({ collection: 'admins', overrideAccess: false }),
    ).rejects.toMatchObject({
      status: 403,
    })
  })

  it('refuses deleting admins even for a Super Admin', async () => {
    const { admin: target } = await createAdmin('Support')
    const { admin: actor } = await createAdmin('Super Admin')
    await expect(
      payload.delete({
        collection: 'admins',
        id: target.id,
        overrideAccess: false,
        user: await asUser(actor),
      }),
    ).rejects.toMatchObject({ status: 403 })
  })
})
