import type { Access, GlobalConfig, PayloadRequest, Where } from 'payload'

import { activeAdmin } from '@/payload/access'
import { ADMIN_GROUPS } from '@/payload/admin/groups'
import { say } from '@/payload/say'
import { can } from '@/server/auth/permissions'
import { publishLevelCheckVersion, validateLevelCheckStages } from '@/server/level-check/publish'

/** Saving a draft needs `determination.manage`; publishing needs `determination.publish`. */
const canSave: Access = ({ req, data }) =>
  (data as { _status?: string } | undefined)?._status === 'published'
    ? can(req.user, 'determination.publish')
    : can(req.user, 'determination.manage')

/**
 * Level-check settings (D-008..D-011, CMS-R05). Edit as a draft, then Publish: publishing checks
 * the rules (stages are the enabled JLPT levels from N5 in order, each with published questions)
 * and freezes everything into a new numbered version. Students always take the latest published
 * version; a running level check keeps the version it started with.
 * Page text (intro, between stages, summary) is edited under Content → UI labels.
 */
export const LevelCheckSettings: GlobalConfig = {
  slug: 'level-check-settings',
  label: { en: 'Level check settings', ja: 'レベルチェック設定' },
  admin: {
    group: ADMIN_GROUPS.levelCheck,
    description: {
      en: 'Stages, pass marks, time limits and questions of the level check. Changes reach students only when you publish; each publish creates a new version.',
      ja: 'レベルチェックの段階、合格点、制限時間、問題です。公開したときにのみ受講者に反映され、公開ごとに新しいバージョンが作成されます。',
    },
  },
  versions: { drafts: true, max: 50 },
  access: {
    read: activeAdmin,
    update: canSave,
    readVersions: activeAdmin,
  },
  fields: [
    {
      name: 'stages',
      type: 'array',
      label: { en: 'Stages', ja: '段階' },
      labels: {
        singular: { en: 'Stage', ja: '段階' },
        plural: { en: 'Stages', ja: '段階' },
      },
      admin: {
        description: {
          en: 'One stage per level switched on for the level check (Exam catalogue → Levels), in order from N5.',
          ja: 'レベルチェックで有効なレベル（試験カタログ → レベル）ごとに1段階。N5から順に並べます。',
        },
      },
      // Runs on publish only (Payload skips validation for drafts).
      validate: async (value: unknown, { req }: { req: PayloadRequest }) => {
        const problems = await validateLevelCheckStages(req, value)
        return problems.length === 0 ? true : problems.map((p) => say(req, p.en, p.ja)).join(' ')
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'level',
              type: 'relationship',
              relationTo: 'levels',
              required: true,
              label: { en: 'Level', ja: 'レベル' },
              filterOptions: {
                and: [
                  { 'examType.code': { equals: 'JLPT' } },
                  { enabledForDetermination: { equals: true } },
                ],
              },
              admin: { width: '34%', allowCreate: false },
            },
            {
              name: 'thresholdPercent',
              type: 'number',
              required: true,
              min: 1,
              max: 100,
              defaultValue: 60,
              label: { en: 'Pass mark (%)', ja: '合格点（%）' },
              admin: {
                width: '33%',
                step: 0.01,
                description: {
                  en: 'Pass if the score is at least this. No rounding.',
                  ja: 'この値以上で合格。四捨五入しません。',
                },
              },
            },
            {
              name: 'durationMinutes',
              type: 'number',
              required: true,
              min: 1,
              max: 180,
              defaultValue: 20,
              label: { en: 'Time limit (minutes)', ja: '制限時間（分）' },
              admin: { width: '33%' },
            },
          ],
        },
        {
          name: 'questions',
          type: 'relationship',
          relationTo: 'questions',
          hasMany: true,
          required: true,
          label: { en: 'Questions (in order)', ja: '問題（出題順）' },
          filterOptions: ({ siblingData }): Where => {
            const level = (siblingData as { level?: unknown }).level
            const conditions: Where[] = [
              { _status: { equals: 'published' } },
              { archived: { not_equals: true } },
            ]
            if (level) conditions.push({ level: { equals: level } })
            return { and: conditions }
          },
          admin: {
            allowCreate: false,
            isSortable: true,
            description: {
              en: 'Published questions of this level. Drag to reorder.',
              ja: 'このレベルの公開済みの問題。ドラッグで並べ替えできます。',
            },
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        if ((doc as { _status?: string })._status === 'published') {
          await publishLevelCheckVersion(req, previousDoc)
        }
        return doc
      },
    ],
  },
}
