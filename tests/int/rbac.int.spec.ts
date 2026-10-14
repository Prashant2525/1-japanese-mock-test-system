import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { ALL_PERMISSIONS, can } from '@/server/auth/permissions'

import {
  asUser,
  client,
  createAdmin,
  createStudent,
  roleId,
  strongPassword,
  uniqueEmail,
} from './helpers'

let payload: Payload

beforeAll(async () => {
  payload = await client()
})

describe('system roles', () => {
  it('are seeded with the agreed permission sets', async () => {
    const roles = await payload.find({
      collection: 'roles',
      where: { isSystem: { equals: true } },
      depth: 0,
    })
    const byName = Object.fromEntries(roles.docs.map((r) => [r.name, r.permissions ?? []]))
    expect(Object.keys(byName).sort()).toEqual(['Content Editor', 'Super Admin', 'Support'])
    expect([...byName['Super Admin']].sort()).toEqual([...ALL_PERMISSIONS].sort())
    expect(byName['Support']).toEqual(
      expect.arrayContaining(['students.read', 'results.read', 'orders.read', 'support.read']),
    )
    expect(byName['Support']).toHaveLength(4)
    expect(byName['Content Editor']).not.toContain('roles.manage')
    expect(byName['Content Editor']).not.toContain('admins.manage')
  })

  it('cannot be deleted, even by a Super Admin', async () => {
    const { admin } = await createAdmin('Super Admin')
    await expect(
      payload.delete({
        collection: 'roles',
        id: await roleId('Support'),
        overrideAccess: false,
        user: await asUser(admin),
      }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('Super Admin always keeps every permission and its name', async () => {
    const { admin } = await createAdmin('Super Admin')
    const id = await roleId('Super Admin')
    const updated = await payload.update({
      collection: 'roles',
      id,
      overrideAccess: false,
      user: await asUser(admin),
      data: { name: 'Renamed', permissions: ['audit.read'] },
    })
    expect(updated.name).toBe('Super Admin')
    expect([...(updated.permissions ?? [])].sort()).toEqual([...ALL_PERMISSIONS].sort())
  })

  it('isSystem cannot be set through the API', async () => {
    const { admin } = await createAdmin('Super Admin')
    const role = await payload.create({
      collection: 'roles',
      overrideAccess: false,
      user: await asUser(admin),
      data: { name: `Custom ${Date.now()}`, permissions: ['results.read'], isSystem: true },
    })
    expect(role.isSystem).toBe(false)
  })
})

describe('privilege escalation is blocked', () => {
  it('a Content Editor cannot create admins', async () => {
    const { admin } = await createAdmin('Content Editor')
    await expect(
      payload.create({
        collection: 'admins',
        overrideAccess: false,
        user: await asUser(admin),
        data: {
          name: 'x',
          email: uniqueEmail('x'),
          password: strongPassword(),
          roles: [await roleId('Super Admin')],
          preferredLocale: 'en',
          status: 'active',
        },
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('a Content Editor cannot give themselves more roles, but can edit their own name', async () => {
    const { admin } = await createAdmin('Content Editor')
    const updated = await payload.update({
      collection: 'admins',
      id: admin.id,
      overrideAccess: false,
      user: await asUser(admin),
      depth: 0,
      data: { name: 'Renamed Editor', roles: [await roleId('Super Admin')], status: 'active' },
    })
    expect(updated.name).toBe('Renamed Editor')
    expect(updated.roles).toEqual([await roleId('Content Editor')])
  })

  it('a Content Editor cannot edit another admin', async () => {
    const { admin: editor } = await createAdmin('Content Editor')
    const { admin: other } = await createAdmin('Support')
    await expect(
      payload.update({
        collection: 'admins',
        id: other.id,
        overrideAccess: false,
        user: await asUser(editor),
        data: { name: 'hijacked' },
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('a Content Editor cannot create or edit roles', async () => {
    const { admin } = await createAdmin('Content Editor')
    await expect(
      payload.update({
        collection: 'roles',
        id: await roleId('Content Editor'),
        overrideAccess: false,
        user: await asUser(admin),
        data: { permissions: [...ALL_PERMISSIONS] },
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('Support can read students but cannot change them', async () => {
    const { admin } = await createAdmin('Support')
    const { student } = await createStudent()
    const user = await asUser(admin)
    const read = await payload.findByID({
      collection: 'students',
      id: student.id,
      overrideAccess: false,
      user,
    })
    expect(read.id).toBe(student.id)
    await expect(
      payload.update({
        collection: 'students',
        id: student.id,
        overrideAccess: false,
        user,
        data: { status: 'suspended' },
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('only admins with audit.read can see the audit log', async () => {
    const { admin: editor } = await createAdmin('Content Editor')
    const { admin: superAdmin } = await createAdmin('Super Admin')
    await expect(
      payload.find({
        collection: 'audit-events',
        overrideAccess: false,
        user: await asUser(editor),
      }),
    ).rejects.toMatchObject({ status: 403 })
    const log = await payload.find({
      collection: 'audit-events',
      overrideAccess: false,
      user: await asUser(superAdmin),
    })
    expect(log.totalDocs).toBeGreaterThan(0)
  })

  it('nobody can edit or delete audit events', async () => {
    const { admin } = await createAdmin('Super Admin')
    const user = await asUser(admin)
    const event = (await payload.find({ collection: 'audit-events', limit: 1 })).docs[0]!
    await expect(
      payload.update({
        collection: 'audit-events',
        id: event.id,
        overrideAccess: false,
        user,
        data: { action: 'x' },
      }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      payload.delete({ collection: 'audit-events', id: event.id, overrideAccess: false, user }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('students never get admin permissions', async () => {
    const { student } = await createStudent()
    expect(can({ ...student, collection: 'students' }, 'students.read')).toBe(false)
  })
})

describe('disabling admins', () => {
  it('a disabled admin cannot log in and loses existing sessions immediately', async () => {
    const { admin, password } = await createAdmin('Content Editor')
    const { admin: manager } = await createAdmin('Super Admin')
    const login = await payload.login({
      collection: 'admins',
      data: { email: admin.email, password },
    })
    const headers = new Headers({ Authorization: `JWT ${login.token}` })
    expect((await payload.auth({ headers })).user?.id).toBe(admin.id)

    await payload.update({
      collection: 'admins',
      id: admin.id,
      overrideAccess: false,
      user: await asUser(manager),
      data: { status: 'disabled' },
    })

    expect((await payload.auth({ headers })).user).toBeNull()
    await expect(
      payload.login({ collection: 'admins', data: { email: admin.email, password } }),
    ).rejects.toMatchObject({
      status: 403,
    })
    const events = await payload.find({
      collection: 'audit-events',
      where: {
        and: [
          { action: { equals: 'admin.status_changed' } },
          { entityId: { equals: String(admin.id) } },
        ],
      },
    })
    expect(events.docs[0]?.actorId).toBe(String(manager.id))
  })

  it('the last active Super Admin cannot be disabled or demoted', async () => {
    const { admin: last } = await createAdmin('Super Admin')
    const superId = await roleId('Super Admin')
    // Make `last` the only active Super Admin in the test database.
    await payload.db.drizzle.execute(sql`
      update admins set status = 'disabled'
      where id <> ${last.id} and id in (select parent_id from admins_rels where roles_id = ${superId})
    `)
    const user = await asUser(last)
    await expect(
      payload.update({
        collection: 'admins',
        id: last.id,
        overrideAccess: false,
        user,
        data: { status: 'disabled' },
      }),
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      payload.update({
        collection: 'admins',
        id: last.id,
        overrideAccess: false,
        user,
        data: { roles: [await roleId('Support')] },
      }),
    ).rejects.toMatchObject({ status: 400 })
  })
})
