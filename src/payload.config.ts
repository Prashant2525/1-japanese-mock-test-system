import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { ja } from '@payloadcms/translations/languages/ja'
import path from 'path'
import { buildConfig } from 'payload'
import { payloadTotp } from 'payload-totp'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Admins } from './payload/collections/Admins'
import { AuditEvents } from './payload/collections/AuditEvents'
import { DASHBOARD_WIDGETS } from './payload/admin/dashboard'
import { EmailTemplates } from './payload/collections/EmailTemplates'
import { ExamTypes } from './payload/collections/ExamTypes'
import { Levels } from './payload/collections/Levels'
import { Roles } from './payload/collections/Roles'
import { Students } from './payload/collections/Students'
import { can } from './server/auth/permissions'
import { SignInSettings } from './payload/globals/SignInSettings'
import { UiLabelGlobals } from './payload/globals/UiLabels'
import { emailAdapter } from './server/email/adapter'
import { getEnv } from './server/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const env = getEnv()

export default buildConfig({
  serverURL: env.APP_URL,
  secret: env.PAYLOAD_SECRET,
  admin: {
    user: Admins.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' · Nihongo Mock Admin',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/brand/nihongo-mock-icon.svg' }],
    },
    components: {
      graphics: {
        Logo: '/payload/admin/graphics#Logo',
        Icon: '/payload/admin/graphics#Icon',
      },
    },
    // Dashboard widgets (Phase 9): real numbers, shown only to admins with the matching permission.
    // Admins can rearrange or add widgets; each widget also checks the permission itself.
    dashboard: {
      widgets: DASHBOARD_WIDGETS.map(({ permission: _permission, ...widget }) => widget),
      defaultLayout: ({ req }) => [
        ...DASHBOARD_WIDGETS.filter((w) => can(req.user, w.permission)).map((w) => ({
          widgetSlug: w.slug,
          width: w.width,
        })),
        { widgetSlug: 'collections', width: 'full' as const },
      ],
    },
  },
  // Payload REST lives under /api/cms so /api/v1 stays free for the domain API (ARCHITECTURE §3).
  routes: { admin: '/admin', api: '/api/cms' },
  graphQL: { disable: true },
  collections: [Admins, Roles, Students, ExamTypes, Levels, EmailTemplates, AuditEvents],
  globals: [...UiLabelGlobals, SignInSettings],
  email: emailAdapter(),
  // Content locales (D-004, D-028): English default, Japanese with fallback to English.
  localization: {
    locales: [
      { code: 'en', label: 'English' },
      { code: 'ja', label: '日本語' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  // Admin panel interface languages.
  i18n: {
    supportedLanguages: { en, ja },
    fallbackLanguage: 'en',
  },
  editor: lexicalEditor(),
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: env.DATABASE_URL, max: env.DATABASE_POOL_MAX },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Schema changes only through reviewed migrations, never automatic pushes (D-034).
    push: false,
  }),
  sharp,
  plugins: [
    // Admin two-factor login (D-058). Must stay the LAST plugin: it wraps the access rules of every
    // collection so admins can do nothing until they have entered an authenticator code.
    payloadTotp({
      collection: 'admins',
      forceSetup: true,
      totp: { issuer: 'Nihongo Mock', digits: 6, period: 30, algorithm: 'SHA1' },
    }),
  ],
  telemetry: false,
})
