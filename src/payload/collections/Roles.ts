import { APIError, type CollectionConfig } from 'payload'

import { activeAdmin, hasPermission, never } from '@/payload/access'
import { recordAudit } from '@/server/audit/record'
import { ALL_PERMISSIONS, PERMISSIONS, SUPER_ADMIN_ROLE } from '@/server/auth/permissions'
import { ADMIN_GROUPS } from '@/payload/admin/groups'

/** Roles bundle permission keys (D-022). System roles are seeded by migration and cannot be deleted. */
export const Roles: CollectionConfig = {
  slug: 'roles',
  labels: {
    singular: { en: 'Role', ja: 'ロール' },
    plural: { en: 'Roles', ja: 'ロール' },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'description', 'isSystem'],
    group: ADMIN_GROUPS.people,
  },
  access: {
    read: activeAdmin,
    create: hasPermission('roles.manage'),
    update: hasPermission('roles.manage'),
    delete: hasPermission('roles.manage'),
  },
  fields: [
    { name: 'name', type: 'text', required: true, unique: true, maxLength: 60 },
    { name: 'description', type: 'textarea', maxLength: 300 },
    {
      name: 'permissions',
      type: 'select',
      hasMany: true,
      options: ALL_PERMISSIONS.map((value) => ({ value, label: PERMISSIONS[value] })),
    },
    {
      name: 'isSystem',
      type: 'checkbox',
      defaultValue: false,
      access: { create: never, update: never },
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'System roles are created by the platform and cannot be deleted.',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        if (originalDoc?.isSystem) {
          // System roles keep their name; Super Admin always keeps every permission.
          data.name = originalDoc.name
          if (originalDoc.name === SUPER_ADMIN_ROLE) data.permissions = [...ALL_PERMISSIONS]
        }
        return data
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const role = await req.payload.findByID({
          collection: 'roles',
          id,
          depth: 0,
          req,
          overrideAccess: true,
        })
        if (role?.isSystem) throw new APIError('System roles cannot be deleted.', 400, null, true)
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        await recordAudit(
          req.payload,
          {
            actorType: req.user ? 'admin' : 'system',
            actorId: req.user?.id,
            action: operation === 'create' ? 'role.created' : 'role.updated',
            entityType: 'roles',
            entityId: doc.id,
            summary: doc.name,
            before:
              operation === 'update'
                ? { name: previousDoc?.name, permissions: previousDoc?.permissions }
                : undefined,
            after: { name: doc.name, permissions: doc.permissions },
          },
          req,
        )
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        await recordAudit(
          req.payload,
          {
            actorType: 'admin',
            actorId: req.user?.id,
            action: 'role.deleted',
            entityType: 'roles',
            entityId: doc.id,
            summary: doc.name,
            before: { name: doc.name, permissions: doc.permissions },
          },
          req,
        )
      },
    ],
  },
}
