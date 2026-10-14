import { describe, expect, it } from 'vitest'

import {
  ALL_PERMISSIONS,
  can,
  isActiveAdmin,
  isSuperAdmin,
  permissionsOf,
  SYSTEM_ROLES,
} from '@/server/auth/permissions'

const superRole = { name: 'Super Admin', isSystem: true, permissions: [] }
const editorRole = {
  name: 'Content Editor',
  isSystem: true,
  permissions: ['questions.manage', 'tests.publish'],
}
const admin = (roles: unknown[], status = 'active') => ({ collection: 'admins', status, roles })

describe('permissionsOf / can', () => {
  it('grants Super Admin every permission even if its stored list is empty', () => {
    expect(permissionsOf(admin([superRole])).size).toBe(ALL_PERMISSIONS.length)
    expect(isSuperAdmin(admin([superRole]))).toBe(true)
  })

  it('a custom role named "Super Admin" without isSystem gets only its listed permissions', () => {
    const fake = { name: 'Super Admin', isSystem: false, permissions: ['results.read'] }
    expect([...permissionsOf(admin([fake]))]).toEqual(['results.read'])
    expect(isSuperAdmin(admin([fake]))).toBe(false)
  })

  it('unions permissions across roles and ignores unknown keys', () => {
    const extra = { name: 'X', permissions: ['results.read', 'made.up'] }
    const perms = permissionsOf(admin([editorRole, extra]))
    expect([...perms].sort()).toEqual(['questions.manage', 'results.read', 'tests.publish'])
  })

  it('fails closed: disabled admins, students, anonymous and unpopulated roles get nothing', () => {
    expect(can(admin([superRole], 'disabled'), 'audit.read')).toBe(false)
    expect(isActiveAdmin(admin([superRole], 'disabled'))).toBe(false)
    expect(can({ collection: 'students', roles: [superRole] }, 'students.read')).toBe(false)
    expect(can(null, 'students.read')).toBe(false)
    expect(can(admin([1, 2]), 'students.read')).toBe(false)
  })

  it('system role definitions only use real permission keys', () => {
    for (const role of SYSTEM_ROLES) {
      for (const p of role.permissions) expect(ALL_PERMISSIONS).toContain(p)
    }
  })
})
