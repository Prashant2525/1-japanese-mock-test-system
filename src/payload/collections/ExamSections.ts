import type { CollectionConfig, PayloadRequest } from 'payload'

import { activeAdmin, hasPermission, never } from '@/payload/access'
import { ADMIN_GROUPS } from '@/payload/admin/groups'
import { auditTrail } from '@/payload/hooks/auditTrail'
import { say } from '@/payload/say'

const audit = auditTrail({
  entityType: 'exam-sections',
  action: 'exam_section',
  summary: (doc) => String(doc.key ?? ''),
})

const idOf = (v: unknown): number | undefined =>
  typeof v === 'number'
    ? v
    : typeof v === 'object' && v !== null
      ? (v as { id?: number }).id
      : undefined

/**
 * Exam sections (Phase 13, D-018, D-103): the default sections of each exam type, optionally
 * limited to some of its levels (JLPT N1–N2 and N3–N5 differ). Mock tests start from these and
 * may override them (Phase 15). Never deleted — tests, questions and results refer to them;
 * switch "Enabled" off instead. Results keep their own copy of section names (snapshots).
 */
export const ExamSections: CollectionConfig = {
  slug: 'exam-sections',
  labels: {
    singular: { en: 'Exam section', ja: '試験科目' },
    plural: { en: 'Exam sections', ja: '試験科目' },
  },
  admin: {
    group: ADMIN_GROUPS.catalogue,
    useAsTitle: 'name',
    defaultColumns: ['name', 'examType', 'levels', 'order', 'enabled', 'updatedAt'],
    listSearchableFields: ['key', 'name'],
    pagination: { defaultLimit: 25, limits: [10, 25, 50] },
    description: {
      en: 'The sections of each exam, in order (for example Vocabulary, Grammar・Reading, Listening). Leave “Levels” empty when a section applies to every level of the exam (the list then shows “<No Levels>”). Sections are never deleted: switch “Enabled” off instead.',
      ja: '各試験の科目と順番です（例：文字・語彙、文法・読解、聴解）。すべてのレベルに共通の科目は「レベル」を空欄にします（一覧では「<No Levels>」と表示されます）。科目は削除できません。「有効」をオフにしてください。',
    },
  },
  defaultSort: ['examType', 'order'],
  indexes: [{ fields: ['examType', 'key'], unique: true }],
  access: {
    read: activeAdmin,
    create: hasPermission('catalogue.manage'),
    update: hasPermission('catalogue.manage'),
    delete: never,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'examType',
          type: 'relationship',
          relationTo: 'exam-types',
          required: true,
          label: { en: 'Exam type', ja: '試験種別' },
          access: { update: never },
          admin: { width: '50%' },
        },
        {
          name: 'key',
          type: 'text',
          required: true,
          index: true,
          label: { en: 'Key', ja: 'キー' },
          access: { update: never },
          admin: {
            width: '50%',
            description: {
              en: 'Short ID, e.g. listening. Unique within the exam; cannot be changed later.',
              ja: '短いID（例：listening）。試験内で一意で、後から変更できません。',
            },
          },
          validate: (value: string | null | undefined, { req }: { req: PayloadRequest }) =>
            typeof value === 'string' && /^[a-z][a-z0-9-]{1,39}$/.test(value)
              ? true
              : say(
                  req,
                  'Use 2–40 lowercase letters, digits or hyphens, starting with a letter.',
                  '英小文字で始まる2〜40文字（英小文字・数字・ハイフン）で入力してください。',
                ),
        },
      ],
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
      maxLength: 500,
      label: { en: 'Description', ja: '説明' },
    },
    {
      name: 'levels',
      type: 'relationship',
      relationTo: 'levels',
      hasMany: true,
      label: { en: 'Levels', ja: 'レベル' },
      admin: {
        description: {
          en: 'Only these levels have this section. Empty = every level of the exam.',
          ja: 'この科目があるレベルです。空欄＝この試験のすべてのレベル。',
        },
      },
      filterOptions: ({ data }) => {
        const exam = idOf((data as { examType?: unknown } | undefined)?.examType)
        return exam ? { examType: { equals: exam } } : true
      },
      // Also enforced on the server: a level of another exam is refused (Phase 13 integrity).
      validate: async (value: unknown, { data, req }: { data: unknown; req: PayloadRequest }) => {
        const ids = (Array.isArray(value) ? value : []).map(idOf).filter((id) => id !== undefined)
        if (ids.length === 0) return true
        const exam = idOf((data as { examType?: unknown }).examType)
        const found = await req.payload.find({
          collection: 'levels',
          where: { id: { in: ids } },
          depth: 0,
          limit: ids.length,
          overrideAccess: true,
          req,
        })
        const wrong = found.docs.filter((l) => idOf(l.examType) !== exam)
        return wrong.length === 0 && found.docs.length === ids.length
          ? true
          : say(
              req,
              `These levels belong to another exam: ${wrong.map((l) => l.code).join(', ') || '?'}.`,
              `別の試験のレベルが含まれています：${wrong.map((l) => l.code).join('、') || '?'}。`,
            )
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
          max: 99,
          defaultValue: 1,
          label: { en: 'Order in the exam', ja: '試験内の順番' },
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
    afterChange: [audit.afterChange],
    afterDelete: [audit.afterDelete],
  },
}
