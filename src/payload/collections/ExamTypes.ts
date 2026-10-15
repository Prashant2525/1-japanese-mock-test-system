import type { CollectionConfig, PayloadRequest } from 'payload'

import { activeAdmin, hasPermission, never } from '@/payload/access'
import { ADMIN_GROUPS } from '@/payload/admin/groups'
import { auditTrail } from '@/payload/hooks/auditTrail'
import { say } from '@/payload/say'

const audit = auditTrail({
  entityType: 'exam-types',
  action: 'exam_type',
  summary: (doc) => String(doc.code ?? ''),
})

/**
 * Exam types: JLPT, NAT, JFT (D-014). The first full Phase 9 module: list with search, sort,
 * pagination and bulk edit; validated EN/JA forms; permission-checked writes; audit trail.
 * Never deleted (levels, tests and results point here): switch "Enabled" off instead.
 */
export const ExamTypes: CollectionConfig = {
  slug: 'exam-types',
  labels: {
    singular: { en: 'Exam type', ja: '試験種別' },
    plural: { en: 'Exam types', ja: '試験種別' },
  },
  admin: {
    group: ADMIN_GROUPS.catalogue,
    useAsTitle: 'name',
    defaultColumns: ['name', 'code', 'order', 'enabled', 'updatedAt'],
    listSearchableFields: ['code', 'name'],
    pagination: { defaultLimit: 25, limits: [10, 25, 50] },
    description: {
      en: 'The exams students can practise for. Turn “Enabled” off to hide an exam everywhere; exam types are never deleted because tests and results refer to them.',
      ja: '受講者が練習できる試験です。「有効」をオフにするとすべての画面で非表示になります。模擬試験や結果が参照するため、削除はできません。',
    },
  },
  defaultSort: 'order',
  access: {
    read: activeAdmin,
    create: hasPermission('catalogue.manage'),
    update: hasPermission('catalogue.manage'),
    delete: never,
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: { en: 'Code', ja: 'コード' },
      admin: {
        description: {
          en: 'Short ID in capitals, e.g. JLPT. Cannot be changed after creation.',
          ja: '大文字の短いID（例：JLPT）。作成後は変更できません。',
        },
      },
      access: { update: never },
      validate: (value: string | null | undefined, { req }: { req: PayloadRequest }) =>
        typeof value === 'string' && /^[A-Z][A-Z0-9-]{1,15}$/.test(value)
          ? true
          : say(
              req,
              'Use 2–16 capital letters, digits or hyphens, starting with a letter.',
              '英大文字で始まる2〜16文字（英大文字・数字・ハイフン）で入力してください。',
            ),
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      maxLength: 120,
      label: { en: 'Name', ja: '名称' },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      maxLength: 1000,
      label: { en: 'Description', ja: '説明' },
    },
    {
      name: 'nonAffiliationNotice',
      type: 'textarea',
      localized: true,
      maxLength: 500,
      label: { en: 'Non-affiliation notice', ja: '非提携の表示' },
      admin: {
        description: {
          en: 'Shown wherever this exam is named, so nobody thinks Nihongo Mock is the official test (TSR-14).',
          ja: 'この試験名を表示する箇所に表示し、公式試験と誤解されないようにします（TSR-14）。',
        },
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'order',
          type: 'number',
          required: true,
          min: 1,
          max: 999,
          defaultValue: 1,
          label: { en: 'Display order', ja: '表示順' },
          admin: { width: '50%' },
        },
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          label: { en: 'Enabled', ja: '有効' },
          admin: { width: '50%' },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [audit.afterChange],
    afterDelete: [audit.afterDelete],
  },
}
