import type { Permission } from '@/server/auth/permissions'

/** Dashboard widgets and who sees them by default (components in ./widgets.tsx). */
export const DASHBOARD_WIDGETS: {
  slug: 'nm-setup' | 'nm-students' | 'nm-catalogue' | 'nm-activity'
  Component: string
  label: { en: string; ja: string }
  permission: Permission
  width: 'medium' | 'large'
  minWidth: 'small' | 'medium'
}[] = [
  {
    slug: 'nm-setup',
    Component: '/payload/admin/widgets#SetupWidget',
    label: { en: 'Setup checklist', ja: 'セットアップ確認' },
    permission: 'settings.manage',
    width: 'medium',
    minWidth: 'small',
  },
  {
    slug: 'nm-students',
    Component: '/payload/admin/widgets#StudentsWidget',
    label: { en: 'Students', ja: '受講者' },
    permission: 'students.read',
    width: 'medium',
    minWidth: 'small',
  },
  {
    slug: 'nm-catalogue',
    Component: '/payload/admin/widgets#CatalogueWidget',
    label: { en: 'Exam catalogue', ja: '試験カタログ' },
    permission: 'catalogue.manage',
    width: 'medium',
    minWidth: 'small',
  },
  {
    slug: 'nm-activity',
    Component: '/payload/admin/widgets#ActivityWidget',
    label: { en: 'Recent activity', ja: '最近の操作' },
    permission: 'audit.read',
    width: 'medium',
    minWidth: 'small',
  },
]
