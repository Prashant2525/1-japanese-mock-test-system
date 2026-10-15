import type { CollectionConfig, PayloadRequest } from 'payload'

import { activeAdmin, hasPermission, never } from '@/payload/access'
import { ADMIN_GROUPS } from '@/payload/admin/groups'
import { auditTrail } from '@/payload/hooks/auditTrail'
import { categoryDeleteGuard } from '@/payload/hooks/contentLifecycle'
import { say } from '@/payload/say'

const audit = auditTrail({
  entityType: 'material-categories',
  action: 'material_category',
  summary: (doc) => String(doc.key ?? ''),
})

/**
 * Study-library categories (SM-R04): seeded Kanji, Grammar, Reading, Listening; more can be added.
 * Switch "Enabled" off to hide a category and its materials; never deleted.
 */
export const MaterialCategories: CollectionConfig = {
  slug: 'material-categories',
  labels: {
    singular: { en: 'Material category', ja: '教材カテゴリー' },
    plural: { en: 'Material categories', ja: '教材カテゴリー' },
  },
  admin: {
    group: ADMIN_GROUPS.study,
    useAsTitle: 'name',
    defaultColumns: ['name', 'key', 'symbol', 'order', 'enabled'],
    listSearchableFields: ['key', 'name'],
    description: {
      en: 'Categories of the study library. Students see enabled categories only.',
      ja: '学習教材のカテゴリーです。受講者には有効なカテゴリーだけが表示されます。',
    },
  },
  defaultSort: 'order',
  access: {
    read: activeAdmin,
    create: hasPermission('materials.manage'),
    update: hasPermission('materials.manage'),
    delete: hasPermission('materials.delete'),
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'key',
          type: 'text',
          required: true,
          unique: true,
          label: { en: 'Key', ja: 'キー' },
          access: { update: never },
          admin: {
            width: '50%',
            description: {
              en: 'Lower-case ID used in links, e.g. grammar. Cannot be changed later.',
              ja: 'リンクで使う小文字のID（例：grammar）。後から変更できません。',
            },
          },
          validate: (value: string | null | undefined, { req }: { req: PayloadRequest }) =>
            typeof value === 'string' && /^[a-z][a-z0-9-]{1,30}$/.test(value)
              ? true
              : say(
                  req,
                  'Use 2–31 lower-case letters, digits or hyphens, starting with a letter.',
                  '小文字の英字で始まる2〜31文字（英小文字・数字・ハイフン）で入力してください。',
                ),
        },
        {
          name: 'symbol',
          type: 'text',
          maxLength: 2,
          label: { en: 'Symbol', ja: '記号' },
          admin: {
            width: '50%',
            description: {
              en: 'One character shown on cards, e.g. 文',
              ja: 'カードに表示する1文字（例：文）',
            },
          },
        },
      ],
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      maxLength: 60,
      label: { en: 'Name', ja: '名称' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'order',
          type: 'number',
          required: true,
          defaultValue: 1,
          min: 1,
          max: 999,
          label: { en: 'Display order', ja: '表示順' },
          admin: { width: '50%' },
        },
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          label: { en: 'Enabled', ja: '有効' },
          admin: { width: '50%', components: { Cell: '/payload/admin/cells#YesNoCell' } },
        },
      ],
    },
  ],
  hooks: {
    beforeDelete: [categoryDeleteGuard],
    afterChange: [audit.afterChange],
    afterDelete: [audit.afterDelete],
  },
}
