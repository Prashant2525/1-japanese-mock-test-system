import { APIError, type CollectionConfig, type PayloadRequest } from 'payload'

import {
  canEnterAdminPanel,
  fieldPermission,
  hasPermission,
  never,
  permissionOrSelf,
} from '@/payload/access'
import { loginRateLimit } from '@/payload/hooks/loginRateLimit'
import { recordAudit } from '@/server/audit/record'
import { SUPER_ADMIN_ROLE } from '@/server/auth/permissions'
import { revokeAllSessions } from '@/server/auth/sessions'
import { renderEmail, type Locale } from '@/server/email/templates'
import { getEnv } from '@/server/env'
import { clientIp, userAgent } from '@/server/http/client'

const RESET_EXPIRATION_MS = 60 * 60 * 1000

type RoleRef = number | { id: number }
const roleIds = (roles: unknown): number[] =>
  Array.isArray(roles) ? (roles as RoleRef[]).map((r) => (typeof r === 'object' ? r.id : r)) : []

async function superAdminRoleId(req: PayloadRequest): Promise<number | undefined> {
  const found = await req.payload.find({
    collection: 'roles',
    where: { and: [{ name: { equals: SUPER_ADMIN_ROLE } }, { isSystem: { equals: true } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  return found.docs[0]?.id
}

/**
 * Admin-panel users (ARCHITECTURE §4, D-022). Closed by default: no public sign-up, delete disabled
 * (disable instead), roles and status editable only with `admins.manage`, so nobody can grant
 * themselves more access. The first Super Admin is created with `pnpm admin:create`.
 */
export const Admins: CollectionConfig = {
  slug: 'admins',
  labels: {
    singular: { en: 'Admin', ja: '管理者' },
    plural: { en: 'Admins', ja: '管理者' },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'roles', 'status', 'updatedAt'],
    group: { en: 'People', ja: '利用者' },
  },
  auth: {
    depth: 1,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 8 * 60 * 60,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
    forgotPassword: {
      expiration: RESET_EXPIRATION_MS,
      generateEmailSubject: async (args) => {
        const locale = ((args?.user as { preferredLocale?: Locale })?.preferredLocale ??
          'en') as Locale
        const email = await renderEmail(
          args!.req!.payload,
          'admin_reset_password',
          locale,
          { name: String((args?.user as { name?: string })?.name ?? ''), expiresInMinutes: 60 },
          '',
        )
        return email.subject
      },
      generateEmailHTML: async (args) => {
        const locale = ((args?.user as { preferredLocale?: Locale })?.preferredLocale ??
          'en') as Locale
        const link = `${getEnv().APP_URL}/admin/reset/${args?.token}`
        const email = await renderEmail(
          args!.req!.payload,
          'admin_reset_password',
          locale,
          { name: String((args?.user as { name?: string })?.name ?? ''), expiresInMinutes: 60 },
          link,
        )
        return email.html
      },
    },
  },
  access: {
    admin: canEnterAdminPanel,
    read: permissionOrSelf('admins.read', 'admins'),
    create: hasPermission('admins.manage'),
    update: permissionOrSelf('admins.manage', 'admins'),
    delete: never,
    unlock: hasPermission('admins.manage'),
  },
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 120 },
    {
      name: 'roles',
      type: 'relationship',
      relationTo: 'roles',
      hasMany: true,
      required: true,
      minRows: 1,
      saveToJWT: false,
      access: {
        create: fieldPermission('admins.manage'),
        update: fieldPermission('admins.manage'),
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { value: 'active', label: { en: 'Active', ja: '有効' } },
        { value: 'disabled', label: { en: 'Disabled', ja: '無効' } },
      ],
      access: {
        create: fieldPermission('admins.manage'),
        update: fieldPermission('admins.manage'),
      },
      admin: { position: 'sidebar' },
    },
    {
      name: 'preferredLocale',
      type: 'select',
      required: true,
      defaultValue: 'en',
      options: [
        { value: 'en', label: 'English' },
        { value: 'ja', label: '日本語' },
      ],
      admin: { position: 'sidebar', description: 'Language for account emails.' },
    },
  ],
  hooks: {
    beforeOperation: [loginRateLimit],
    beforeLogin: [
      ({ user }) => {
        if (user?.status === 'disabled')
          throw new APIError('This account is disabled.', 403, null, true)
        return user
      },
    ],
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        if (operation !== 'update' || !originalDoc) return data
        const superId = await superAdminRoleId(req)
        if (superId === undefined) return data
        const wasSuper =
          roleIds(originalDoc.roles).includes(superId) && originalDoc.status !== 'disabled'
        const nextRoles =
          data.roles === undefined ? roleIds(originalDoc.roles) : roleIds(data.roles)
        const nextStatus = data.status ?? originalDoc.status
        const staysSuper = nextRoles.includes(superId) && nextStatus !== 'disabled'
        if (wasSuper && !staysSuper) {
          const others = await req.payload.count({
            collection: 'admins',
            where: {
              and: [
                { id: { not_equals: originalDoc.id } },
                { roles: { contains: superId } },
                { status: { equals: 'active' } },
              ],
            },
            overrideAccess: true,
            req,
          })
          if (others.totalDocs === 0) {
            throw new APIError('At least one active Super Admin is required.', 400, null, true)
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        const ids = (v: unknown) => roleIds(v).sort((a, b) => a - b)
        const rolesChanged =
          operation === 'update' &&
          JSON.stringify(ids(previousDoc?.roles)) !== JSON.stringify(ids(doc.roles))
        const statusChanged = operation === 'update' && previousDoc?.status !== doc.status
        if (statusChanged && doc.status === 'disabled') {
          await revokeAllSessions(req.payload, 'admins', doc.id, req)
        }
        if (operation === 'create' || rolesChanged || statusChanged) {
          await recordAudit(
            req.payload,
            {
              actorType: req.user ? 'admin' : 'system',
              actorId: req.user?.id,
              action:
                operation === 'create'
                  ? 'admin.created'
                  : statusChanged
                    ? 'admin.status_changed'
                    : 'admin.roles_changed',
              entityType: 'admins',
              entityId: doc.id,
              summary: doc.email,
              before:
                operation === 'update'
                  ? { roles: ids(previousDoc?.roles), status: previousDoc?.status }
                  : undefined,
              after: { roles: ids(doc.roles), status: doc.status },
              ip: req.headers ? clientIp(req.headers) : null,
              userAgent: req.headers ? userAgent(req.headers) : null,
            },
            req,
          )
        }
        return doc
      },
    ],
    afterLogin: [
      async ({ user, req }) => {
        await recordAudit(req.payload, {
          actorType: 'admin',
          actorId: user.id,
          action: 'admin.login',
          entityType: 'admins',
          entityId: user.id,
          ip: clientIp(req.headers),
          userAgent: userAgent(req.headers),
        })
      },
    ],
  },
}
