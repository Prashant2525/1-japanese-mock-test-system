import { APIError, type CollectionConfig } from 'payload'

import { fieldPermission, hasPermission, never, permissionOrSelf } from '@/payload/access'
import { loginRateLimit } from '@/payload/hooks/loginRateLimit'
import { recordAudit } from '@/server/audit/record'
import { revokeAllSessions } from '@/server/auth/sessions'
import { renderEmail, type Locale } from '@/server/email/templates'
import { getEnv } from '@/server/env'

export const STUDENT_RESET_EXPIRATION_MINUTES = 60

type StudentLike = { name?: string; preferredLocale?: Locale }
const localeOf = (user: unknown): Locale =>
  (user as StudentLike)?.preferredLocale === 'ja' ? 'ja' : 'en'
const nameOf = (user: unknown) => String((user as StudentLike)?.name ?? '')

/**
 * Website users (D-021). Sign-up, login and reset go through /api/v1/auth (rate limits,
 * non-enumerating responses, audit); Payload's own student auth endpoints are blocked in proxy.ts.
 * Students never access the admin panel. `determinationStatus` is changed only by server services.
 */
export const Students: CollectionConfig = {
  slug: 'students',
  labels: {
    singular: { en: 'Student', ja: '受講者' },
    plural: { en: 'Students', ja: '受講者' },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'status', 'determinationStatus', 'createdAt'],
    group: { en: 'People', ja: '利用者' },
  },
  auth: {
    depth: 0,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 7 * 24 * 60 * 60,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
    verify: {
      generateEmailSubject: async ({ req, user }) =>
        (await renderEmail(req.payload, 'verify_email', localeOf(user), { name: nameOf(user) }, ''))
          .subject,
      generateEmailHTML: async ({ req, token, user }) => {
        const locale = localeOf(user)
        const link = `${getEnv().APP_URL}/${locale}/verify-email?token=${encodeURIComponent(token)}`
        return (
          await renderEmail(req.payload, 'verify_email', locale, { name: nameOf(user) }, link)
        ).html
      },
    },
    forgotPassword: {
      expiration: STUDENT_RESET_EXPIRATION_MINUTES * 60 * 1000,
      generateEmailSubject: async (args) =>
        (
          await renderEmail(
            args!.req!.payload,
            'reset_password',
            localeOf(args?.user),
            { name: nameOf(args?.user), expiresInMinutes: STUDENT_RESET_EXPIRATION_MINUTES },
            '',
          )
        ).subject,
      generateEmailHTML: async (args) => {
        const locale = localeOf(args?.user)
        const link = `${getEnv().APP_URL}/${locale}/reset-password?token=${encodeURIComponent(String(args?.token))}`
        return (
          await renderEmail(
            args!.req!.payload,
            'reset_password',
            locale,
            { name: nameOf(args?.user), expiresInMinutes: STUDENT_RESET_EXPIRATION_MINUTES },
            link,
          )
        ).html
      },
    },
  },
  access: {
    admin: never,
    read: permissionOrSelf('students.read', 'students'),
    create: never,
    update: hasPermission('students.update'),
    delete: never,
    unlock: hasPermission('students.update'),
  },
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 120 },
    {
      name: 'preferredLocale',
      type: 'select',
      required: true,
      defaultValue: 'en',
      options: [
        { value: 'en', label: 'English' },
        { value: 'ja', label: '日本語' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { value: 'active', label: { en: 'Active', ja: '有効' } },
        { value: 'suspended', label: { en: 'Suspended', ja: '停止中' } },
      ],
      access: { update: fieldPermission('students.update') },
      admin: { position: 'sidebar' },
    },
    {
      name: 'determinationStatus',
      type: 'select',
      required: true,
      defaultValue: 'not_started',
      options: [
        { value: 'not_started', label: { en: 'Not started', ja: '未実施' } },
        { value: 'in_progress', label: { en: 'In progress', ja: '実施中' } },
        { value: 'completed', label: { en: 'Completed', ja: '完了' } },
      ],
      // Changed only by the level-check service (LD-R02, D-020); resets go through an audited action.
      access: { create: never, update: never },
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
  hooks: {
    beforeOperation: [loginRateLimit],
    beforeLogin: [
      ({ user }) => {
        if (user?.status === 'suspended') throw new APIError('ACCOUNT_DISABLED', 403, null, true)
        return user
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        if (operation !== 'update' || previousDoc?.status === doc.status) return doc
        if (doc.status === 'suspended')
          await revokeAllSessions(req.payload, 'students', doc.id, req)
        await recordAudit(
          req.payload,
          {
            actorType: req.user?.collection === 'admins' ? 'admin' : 'system',
            actorId: req.user?.id,
            action: 'student.status_changed',
            entityType: 'students',
            entityId: doc.id,
            before: { status: previousDoc?.status },
            after: { status: doc.status },
          },
          req,
        )
        return doc
      },
    ],
  },
}
