/**
 * Permission catalogue (ARCHITECTURE §4, D-022). Roles bundle these keys; a Super Admin
 * edits roles in the CMS. Labels are bilingual for the admin panel.
 * Adding a key here is a code change (it must be enforced somewhere); assigning keys is CMS work.
 * Delete keys (D-092) are not in any default role except Super Admin (least privilege).
 */
export const PERMISSIONS = {
  'admins.read': { en: 'View admin accounts', ja: '管理者アカウントの閲覧' },
  'admins.manage': {
    en: 'Create, edit and disable admin accounts',
    ja: '管理者アカウントの作成・編集・無効化',
  },
  'roles.manage': { en: 'Create and edit roles', ja: 'ロールの作成・編集' },
  'students.read': { en: 'View students', ja: '受講者の閲覧' },
  'students.update': { en: 'Edit student profiles and status', ja: '受講者情報・状態の編集' },
  'students.reset_determination': {
    en: "Reset a student's level check",
    ja: '受講者のレベルチェックのリセット',
  },
  'students.override_level': { en: "Override a student's level", ja: '受講者レベルの変更' },
  'audit.read': { en: 'View the audit log', ja: '監査ログの閲覧' },
  'settings.manage': {
    en: 'Edit site settings, email templates and system settings',
    ja: 'サイト設定・メールテンプレート・システム設定の編集',
  },
  'content.manage': {
    en: 'Edit pages, navigation and labels',
    ja: 'ページ・ナビゲーション・ラベルの編集',
  },
  'content.publish': { en: 'Publish pages', ja: 'ページの公開' },
  'catalogue.manage': {
    en: 'Edit exam types, levels and sections',
    ja: '試験種別・レベル・セクションの編集',
  },
  'materials.manage': { en: 'Edit study materials', ja: '学習教材の編集' },
  'materials.publish': {
    en: 'Publish, unpublish and archive study materials',
    ja: '学習教材の公開・非公開・アーカイブ',
  },
  'materials.delete': {
    en: 'Delete study materials and unused study categories',
    ja: '学習教材と未使用の教材カテゴリの削除',
  },
  'media.manage': { en: 'Upload and manage media', ja: 'メディアのアップロード・管理' },
  'media.delete': {
    en: 'Delete unused media files',
    ja: '未使用のメディアファイルの削除',
  },
  'media.upload_svg': { en: 'Upload SVG files', ja: 'SVGファイルのアップロード' },
  'questions.manage': { en: 'Edit questions', ja: '問題の編集' },
  'questions.publish': {
    en: 'Publish, unpublish and archive questions',
    ja: '問題の公開・非公開・アーカイブ',
  },
  'questions.delete': {
    en: 'Delete questions that were never published',
    ja: '一度も公開されていない問題の削除',
  },
  'questions.import': {
    en: 'Import questions from spreadsheets',
    ja: 'スプレッドシートからの問題インポート',
  },
  'tests.manage': { en: 'Edit mock tests', ja: '模擬試験の編集' },
  'tests.publish': { en: 'Publish mock tests', ja: '模擬試験の公開' },
  'determination.manage': { en: 'Edit the level check', ja: 'レベルチェックの編集' },
  'determination.publish': { en: 'Publish the level check', ja: 'レベルチェックの公開' },
  'results.read': { en: 'View results and attempts', ja: '結果・受験記録の閲覧' },
  'products.manage': { en: 'Edit products and prices', ja: '商品・価格の編集' },
  'orders.read': { en: 'View orders', ja: '注文の閲覧' },
  'payments.read': { en: 'View payment records', ja: '支払い記録の閲覧' },
  'support.read': { en: 'View contact messages', ja: 'お問い合わせの閲覧' },
} as const

export type Permission = keyof typeof PERMISSIONS

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[]

export const SUPER_ADMIN_ROLE = 'Super Admin'

/** System roles seeded by migration (D-022). Super Admin always holds every permission. */
export const SYSTEM_ROLES: { name: string; description: string; permissions: Permission[] }[] = [
  {
    name: SUPER_ADMIN_ROLE,
    description: 'Full access, including admins, roles and system settings.',
    permissions: ALL_PERMISSIONS,
  },
  {
    name: 'Content Editor',
    description: 'Creates and publishes content, questions, tests and study materials.',
    permissions: [
      'students.read',
      'content.manage',
      'content.publish',
      'catalogue.manage',
      'materials.manage',
      'materials.publish',
      'media.manage',
      'questions.manage',
      'questions.publish',
      'questions.import',
      'tests.manage',
      'tests.publish',
      'determination.manage',
      'results.read',
    ],
  },
  {
    name: 'Support',
    description: 'Read-only access to students, results, orders and contact messages.',
    permissions: ['students.read', 'results.read', 'orders.read', 'support.read'],
  },
]

type RoleLike = { name?: unknown; isSystem?: unknown; permissions?: unknown }
type UserLike = { collection?: unknown; status?: unknown; roles?: unknown }

function isRole(value: unknown): value is RoleLike {
  return typeof value === 'object' && value !== null
}

/**
 * Effective permissions of an admin. Fails closed: students, disabled admins and
 * admins whose roles are not populated get nothing.
 */
export function permissionsOf(user: unknown): Set<Permission> {
  const result = new Set<Permission>()
  if (typeof user !== 'object' || user === null) return result
  const u = user as UserLike
  if (u.collection !== 'admins' || u.status === 'disabled' || !Array.isArray(u.roles)) return result
  for (const role of u.roles) {
    if (!isRole(role)) continue
    if (role.isSystem === true && role.name === SUPER_ADMIN_ROLE) return new Set(ALL_PERMISSIONS)
    if (Array.isArray(role.permissions)) {
      for (const p of role.permissions) if (p in PERMISSIONS) result.add(p as Permission)
    }
  }
  return result
}

export function can(user: unknown, permission: Permission): boolean {
  return permissionsOf(user).has(permission)
}

export function isActiveAdmin(user: unknown): boolean {
  if (typeof user !== 'object' || user === null) return false
  const u = user as UserLike
  return u.collection === 'admins' && u.status !== 'disabled'
}

export function isSuperAdmin(user: unknown): boolean {
  if (!isActiveAdmin(user)) return false
  const roles = (user as UserLike).roles
  return (
    Array.isArray(roles) &&
    roles.some((r) => isRole(r) && r.isSystem === true && r.name === SUPER_ADMIN_ROLE)
  )
}
