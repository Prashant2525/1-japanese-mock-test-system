import { sql } from '@payloadcms/db-postgres'
import type { Access, CollectionConfig, PayloadRequest } from 'payload'

import { activeAdmin, never } from '@/payload/access'
import { ADMIN_GROUPS } from '@/payload/admin/groups'
import { auditTrail } from '@/payload/hooks/auditTrail'
import { say } from '@/payload/say'
import { can } from '@/server/auth/permissions'

const audit = auditTrail({
  entityType: 'questions',
  action: 'question',
  summary: (doc) => String(doc.key ?? ''),
})

export const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'] as const

/** Saving a draft needs `questions.manage`; publishing also needs `questions.publish`. */
const canSave: Access = ({ req, data }) =>
  (data as { _status?: string } | undefined)?._status === 'published'
    ? can(req.user, 'questions.publish')
    : can(req.user, 'questions.manage')

type QuestionData = {
  options?: { key?: string | null; text?: string | null }[] | null
  correctOptionKey?: string | null
  rightsConfirmed?: boolean | null
  _status?: string | null
}

/**
 * Single-answer multiple-choice questions (D-018, D-024). The core of the question bank, built in
 * Phase 11 for the level check; Phase 14 adds media, sections, import/export and version screens.
 * Students never read this collection: tests and the level check use frozen snapshots taken when
 * they are published, so editing a question never changes past results (TSR-05).
 */
export const Questions: CollectionConfig = {
  slug: 'questions',
  labels: {
    singular: { en: 'Question', ja: '問題' },
    plural: { en: 'Questions', ja: '問題' },
  },
  admin: {
    group: ADMIN_GROUPS.questions,
    useAsTitle: 'key',
    defaultColumns: ['key', 'stem', 'level', 'correctOptionKey', '_status', 'updatedAt'],
    listSearchableFields: ['key', 'stem'],
    pagination: { defaultLimit: 25, limits: [25, 50, 100] },
    description: {
      en: 'Single-answer multiple-choice questions. Publish a question before it can be used in the level check or a mock test. Questions are archived, never deleted.',
      ja: '単一選択式の問題です。レベルチェックや模擬試験で使うには公開が必要です。削除ではなくアーカイブします。',
    },
  },
  defaultSort: '-updatedAt',
  versions: { drafts: true, maxPerDoc: 50 },
  access: {
    read: activeAdmin,
    create: canSave,
    update: canSave,
    delete: never,
    readVersions: activeAdmin,
  },
  fields: [
    {
      name: 'key',
      type: 'text',
      unique: true,
      index: true,
      label: { en: 'Question ID', ja: '問題ID' },
      access: { create: never, update: never },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: {
          en: 'Assigned automatically (e.g. Q-000123). Results and imports refer to it.',
          ja: '自動で付与されます（例：Q-000123）。結果やインポートで参照されます。',
        },
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'examType',
          type: 'relationship',
          relationTo: 'exam-types',
          required: true,
          label: { en: 'Exam type', ja: '試験種別' },
          admin: { width: '50%', allowCreate: false },
        },
        {
          name: 'level',
          type: 'relationship',
          relationTo: 'levels',
          required: true,
          index: true,
          label: { en: 'Level', ja: 'レベル' },
          filterOptions: ({ siblingData }) => {
            const examType = (siblingData as { examType?: unknown }).examType
            return examType ? { examType: { equals: examType } } : true
          },
          admin: { width: '50%', allowCreate: false },
        },
      ],
    },
    {
      name: 'stem',
      type: 'textarea',
      required: true,
      maxLength: 2000,
      label: { en: 'Question', ja: '問題文' },
      admin: {
        rows: 4,
        description: {
          en: 'Furigana (optional): write {漢字|かんじ} to show かんじ above 漢字.',
          ja: 'ふりがな（任意）：{漢字|かんじ} と書くと、漢字の上に かんじ が表示されます。',
        },
      },
    },
    {
      name: 'options',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 6,
      label: { en: 'Answer options', ja: '選択肢' },
      labels: {
        singular: { en: 'Option', ja: '選択肢' },
        plural: { en: 'Options', ja: '選択肢' },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'key',
              type: 'select',
              required: true,
              options: OPTION_KEYS.map((k) => ({ label: k, value: k })),
              label: { en: 'Letter', ja: '記号' },
              admin: { width: '20%' },
            },
            {
              name: 'text',
              type: 'text',
              required: true,
              maxLength: 500,
              label: { en: 'Answer text', ja: '選択肢の文' },
              admin: { width: '80%' },
            },
          ],
        },
      ],
      validate: (value: unknown, { req }: { req: PayloadRequest }) => {
        const keys = ((value as { key?: string }[] | null) ?? []).map((o) => o.key)
        return new Set(keys).size === keys.length
          ? true
          : say(
              req,
              'Each option needs a different letter.',
              '選択肢ごとに異なる記号を付けてください。',
            )
      },
    },
    {
      name: 'correctOptionKey',
      type: 'select',
      required: true,
      options: OPTION_KEYS.map((k) => ({ label: k, value: k })),
      label: { en: 'Correct answer', ja: '正解' },
      validate: (value: unknown, { data, req }: { data: QuestionData; req: PayloadRequest }) => {
        if (typeof value !== 'string' || !value)
          return say(req, 'Choose the correct answer.', '正解を選んでください。')
        return (data.options ?? []).some((o) => o.key === value)
          ? true
          : say(
              req,
              `There is no option ${value}. Choose one of the options above.`,
              `選択肢 ${value} がありません。上の選択肢から選んでください。`,
            )
      },
    },
    {
      name: 'explanation',
      type: 'textarea',
      localized: true,
      maxLength: 3000,
      label: { en: 'Explanation', ja: '解説' },
      admin: {
        rows: 4,
        description: {
          en: 'Shown in answer review after the test, never during it. Switch the locale at the top to write the Japanese version.',
          ja: '試験後の解答確認で表示され、試験中には表示されません。上部の言語切り替えで日本語版を入力してください。',
        },
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'marks',
          type: 'number',
          required: true,
          defaultValue: 1,
          min: 1,
          max: 100,
          label: { en: 'Marks', ja: '配点' },
          admin: { width: '50%' },
        },
        {
          name: 'rightsConfirmed',
          type: 'checkbox',
          defaultValue: false,
          label: {
            en: 'I confirm we have the rights to use this question',
            ja: 'この問題を使用する権利があることを確認しました',
          },
          admin: { width: '50%' },
          validate: (value: unknown, { data, req }: { data: QuestionData; req: PayloadRequest }) =>
            data._status !== 'published' || value === true
              ? true
              : say(
                  req,
                  'Confirm the rights before publishing (CON-2).',
                  '公開する前に、使用権を確認してください（CON-2）。',
                ),
        },
      ],
    },
    {
      name: 'archived',
      type: 'checkbox',
      defaultValue: false,
      label: { en: 'Archived', ja: 'アーカイブ済み' },
      admin: {
        position: 'sidebar',
        description: {
          en: 'Archived questions cannot be added to new tests. Past results keep their own copy.',
          ja: 'アーカイブした問題は新しい試験に追加できません。過去の結果には影響しません。',
        },
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // A stable public ID from a database sequence (created by migration).
        if (operation === 'create' && !data.key) {
          const result = await req.payload.db.drizzle.execute(
            sql`SELECT nextval('question_key_seq') AS n`,
          )
          const n = Number((result.rows[0] as { n: string | number }).n)
          data.key = `Q-${String(n).padStart(6, '0')}`
        }
        return data
      },
    ],
    afterChange: [audit.afterChange],
    afterDelete: [audit.afterDelete],
  },
}
