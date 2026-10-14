import type { Access, FieldAccess } from 'payload'

import { can, isActiveAdmin, type Permission } from '@/server/auth/permissions'

/** Any active admin. */
export const activeAdmin: Access = ({ req }) => isActiveAdmin(req.user)

/** Admin-panel entry check (must return a boolean). */
export const canEnterAdminPanel = ({ req }: { req: { user?: unknown } }): boolean =>
  isActiveAdmin(req.user)

/** Admin holding the permission. */
export const hasPermission =
  (permission: Permission): Access =>
  ({ req }) =>
    can(req.user, permission)

/** Admin holding the permission, or the signed-in user acting on their own document. */
export const permissionOrSelf =
  (permission: Permission, collection: 'admins' | 'students'): Access =>
  ({ req }) => {
    if (can(req.user, permission)) return true
    if (req.user && req.user.collection === collection) return { id: { equals: req.user.id } }
    return false
  }

export const fieldPermission =
  (permission: Permission): FieldAccess =>
  ({ req }) =>
    can(req.user, permission)

export const never = () => false
