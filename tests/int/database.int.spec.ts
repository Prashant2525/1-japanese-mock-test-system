import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { migrations } from '@/migrations'

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config })
})

afterAll(async () => {
  await payload.delete({
    collection: 'admins',
    where: { email: { contains: '@int.nihongo-mock.test' } },
  })
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

  it('stores admin sessions server-side so they can be revoked', async () => {
    const result = await payload.db.drizzle.execute(
      sql`select to_regclass('public.admins_sessions') is not null as present`,
    )
    expect(result.rows[0].present).toBe(true)
  })
})

describe('admins collection access (closed by default)', () => {
  it('persists an admin created by a trusted server process', async () => {
    const created = await payload.create({
      collection: 'admins',
      data: {
        name: 'Integration Admin',
        email: 'persist@int.nihongo-mock.test',
        password: crypto.randomUUID(),
      },
    })
    const found = await payload.findByID({ collection: 'admins', id: created.id })
    expect(found.email).toBe('persist@int.nihongo-mock.test')
    expect(found).not.toHaveProperty('hash')
  })

  it('refuses to create an admin for an anonymous request (no public first-user signup)', async () => {
    await expect(
      payload.create({
        collection: 'admins',
        overrideAccess: false,
        data: {
          name: 'Intruder',
          email: 'intruder@int.nihongo-mock.test',
          password: crypto.randomUUID(),
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

  it('refuses deleting admins even for a logged-in admin', async () => {
    const admin = await payload.create({
      collection: 'admins',
      data: {
        name: 'Delete Guard',
        email: 'guard@int.nihongo-mock.test',
        password: crypto.randomUUID(),
      },
    })
    await expect(
      payload.delete({
        collection: 'admins',
        id: admin.id,
        overrideAccess: false,
        user: { ...admin, collection: 'admins' },
      }),
    ).rejects.toMatchObject({ status: 403 })
  })
})
