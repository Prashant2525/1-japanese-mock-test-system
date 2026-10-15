import type { CollectionConfig } from 'payload'

import { hasPermission, never } from '@/payload/access'
import { ADMIN_GROUPS } from '@/payload/admin/groups'

/** Append-only audit trail (ARCHITECTURE §9, TSR-09). Written only by server code; nobody can edit or delete it. */
export const AuditEvents: CollectionConfig = {
  slug: 'audit-events',
  labels: {
    singular: { en: 'Audit event', ja: '監査ログ' },
    plural: { en: 'Audit log', ja: '監査ログ' },
  },
  admin: {
    useAsTitle: 'action',
    defaultColumns: ['createdAt', 'action', 'entityType', 'entityId', 'actorType', 'actorId'],
    group: ADMIN_GROUPS.operations,
    description: 'Read-only record of sensitive actions.',
  },
  access: {
    read: hasPermission('audit.read'),
    create: never,
    update: never,
    delete: never,
  },
  indexes: [
    { fields: ['entityType', 'entityId'] },
    { fields: ['actorId'] },
    { fields: ['action'] },
  ],
  fields: [
    {
      name: 'actorType',
      type: 'select',
      required: true,
      options: ['admin', 'student', 'system'],
    },
    { name: 'actorId', type: 'text' },
    { name: 'action', type: 'text', required: true },
    { name: 'entityType', type: 'text', required: true },
    { name: 'entityId', type: 'text' },
    { name: 'summary', type: 'text' },
    { name: 'before', type: 'json' },
    { name: 'after', type: 'json' },
    { name: 'ip', type: 'text' },
    { name: 'userAgent', type: 'text' },
    { name: 'requestId', type: 'text' },
  ],
}
