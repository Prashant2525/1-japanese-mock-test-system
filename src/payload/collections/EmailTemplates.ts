import type { CollectionConfig } from 'payload'

import { hasPermission } from '@/payload/access'
import { EMAIL_TEMPLATE_KEYS, TEMPLATE_VARIABLES } from '@/server/email/templates'

const KEY_LABELS: Record<(typeof EMAIL_TEMPLATE_KEYS)[number], { en: string; ja: string }> = {
  verify_email: { en: 'Email verification', ja: 'メールアドレス確認' },
  reset_password: { en: 'Student password reset', ja: '受講者パスワード再設定' },
  admin_reset_password: { en: 'Admin password set/reset', ja: '管理者パスワード設定' },
  contact_notification: { en: 'Contact form notification', ja: 'お問い合わせ通知' },
  order_receipt: { en: 'Order receipt', ja: '注文確認' },
}

const variablesHelp = Object.entries(TEMPLATE_VARIABLES)
  .map(([key, vars]) => `${key}: ${vars.map((v) => `{{${v}}}`).join(' ')}`)
  .join(' · ')

/** Bilingual email copy managed in the CMS (D-030). The layout and link button are fixed in code. */
export const EmailTemplates: CollectionConfig = {
  slug: 'email-templates',
  labels: {
    singular: { en: 'Email template', ja: 'メールテンプレート' },
    plural: { en: 'Email templates', ja: 'メールテンプレート' },
  },
  admin: {
    useAsTitle: 'key',
    defaultColumns: ['key', 'subject', 'updatedAt'],
    group: { en: 'Settings', ja: '設定' },
    description: `Use only these variables. ${variablesHelp}`,
  },
  access: {
    read: hasPermission('settings.manage'),
    create: hasPermission('settings.manage'),
    update: hasPermission('settings.manage'),
    delete: hasPermission('settings.manage'),
  },
  fields: [
    {
      name: 'key',
      type: 'select',
      required: true,
      unique: true,
      options: EMAIL_TEMPLATE_KEYS.map((value) => ({ value, label: KEY_LABELS[value] })),
    },
    { name: 'subject', type: 'text', required: true, localized: true, maxLength: 150 },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      localized: true,
      maxLength: 3000,
      admin: { description: 'Plain text. A blank line starts a new paragraph.' },
    },
    { name: 'buttonLabel', type: 'text', localized: true, maxLength: 60 },
    { name: 'footer', type: 'textarea', localized: true, maxLength: 500 },
  ],
}
