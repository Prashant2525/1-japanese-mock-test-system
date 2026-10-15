import type { CollectionConfig, PayloadRequest } from 'payload'

import { activeAdmin, hasPermission, never } from '@/payload/access'
import { ADMIN_GROUPS } from '@/payload/admin/groups'
import { auditTrail } from '@/payload/hooks/auditTrail'
import { say } from '@/payload/say'
import { colourProblem, JLPT_CODE, ladderProblem } from '@/server/catalogue/rules'

const audit = auditTrail({
  entityType: 'levels',
  action: 'level',
  summary: (doc) => String(doc.code ?? ''),
})

const idOf = (value: unknown): number | undefined => {
  if (value && typeof value === 'object' && 'id' in value)
    return Number((value as { id: unknown }).id)
  return value === null || value === undefined || value === '' ? undefined : Number(value)
}

function colourValidator(kind: 'line' | 'badge') {
  return (value: unknown, { req }: { req: PayloadRequest }) => {
    const problem = colourProblem(kind, value)
    if (!problem) return true
    if (problem.reason === 'format')
      return say(req, 'Use a colour like #2B6BD8.', '#2B6BD8 のような形式で入力してください。')
    return kind === 'badge'
      ? say(
          req,
          `White text on this colour is too hard to read (${problem.ratio}:1, needs ${problem.minimum}:1). Choose a darker colour.`,
          `この色の上の白い文字は読みにくすぎます（${problem.ratio}:1、必要 ${problem.minimum}:1）。より濃い色を選んでください。`,
        )
      : say(
          req,
          `This line is too hard to see on the night background (${problem.ratio}:1, needs ${problem.minimum}:1). Choose a lighter colour.`,
          `夜の背景ではこの線が見えにくすぎます（${problem.ratio}:1、必要 ${problem.minimum}:1）。より明るい色を選んでください。`,
        )
  }
}

type LevelRow = {
  id: number
  code: string
  order: number
  enabledForDetermination?: boolean | null
}

/**
 * Rules that involve other records (D-008, D-014, D-020). They run as field validators, so they
 * apply to every create, update, bulk edit and API call, and Payload shows each message under its
 * field. (A ValidationError thrown from a hook loses its messages: the class comes from another
 * bundle copy and Payload no longer recognises it, see D-065 / KI-23.)
 * Computed once per save and shared by the field validators. Returns a message per field path.
 */
function catalogueProblems(
  req: PayloadRequest,
  merged: Record<string, unknown>,
  ownId: number | string | undefined,
): Promise<Record<string, string>> {
  const key = `levels:${JSON.stringify([
    ownId,
    idOf(merged.examType),
    merged.code,
    merged.order,
    idOf(merged.equivalentJlpt),
    merged.enabledForDetermination,
    merged.enabledForStudy,
  ])}`
  const cache = (req.context ??= {}) as Record<string, unknown>
  cache[key] ??= computeProblems(req, merged, ownId)
  return cache[key] as Promise<Record<string, string>>
}

type ValidateArgs = { req: PayloadRequest; data: Record<string, unknown>; id?: number | string }

/** Field validator reporting the cross-record problem for `path`, if any. */
const crossRecord =
  (path: string) =>
  async (_value: unknown, { req, data, id }: ValidateArgs): Promise<string | true> =>
    (await catalogueProblems(req, data, id))[path] ?? true

async function computeProblems(
  req: PayloadRequest,
  merged: Record<string, unknown>,
  ownId: number | string | undefined,
): Promise<Record<string, string>> {
  const examTypeId = idOf(merged.examType)
  const errors: Record<string, string> = {}
  if (examTypeId === undefined) return errors
  const examType = await req.payload.findByID({
    collection: 'exam-types',
    id: examTypeId,
    depth: 0,
    req,
    overrideAccess: true,
  })
  const isJlpt = examType.code === JLPT_CODE

  // One code per exam type (the database index is the backstop; this gives a clear message).
  const clash = await req.payload.find({
    collection: 'levels',
    where: {
      and: [
        { examType: { equals: examTypeId } },
        { code: { equals: merged.code } },
        ...(ownId !== undefined ? [{ id: { not_equals: ownId } }] : []),
      ],
    },
    limit: 1,
    depth: 0,
    req,
    overrideAccess: true,
  })
  if (clash.docs.length)
    errors.code = say(
      req,
      `${examType.code} already has a level with the code ${String(merged.code)}.`,
      `${examType.code} にはコード ${String(merged.code)} のレベルがすでにあります。`,
    )

  if (isJlpt) {
    if (idOf(merged.equivalentJlpt) !== undefined)
      errors.equivalentJlpt = say(
        req,
        'JLPT levels are the reference; leave this empty.',
        'JLPT のレベルは基準なので空欄にしてください。',
      )
  } else {
    if (merged.enabledForDetermination)
      errors.enabledForDetermination = say(
        req,
        'The level check uses JLPT levels only.',
        'レベルチェックは JLPT のレベルのみを使用します。',
      )
    if (merged.enabledForStudy)
      errors.enabledForStudy = say(
        req,
        'The study library is organised by JLPT level only.',
        '学習教材は JLPT のレベルのみで構成されます。',
      )
    const equivalentId = idOf(merged.equivalentJlpt)
    if (equivalentId !== undefined) {
      const equivalent = await req.payload.findByID({
        collection: 'levels',
        id: equivalentId,
        depth: 1,
        req,
        overrideAccess: true,
      })
      const equivalentType = equivalent.examType as { code?: string } | number
      if (typeof equivalentType !== 'object' || equivalentType.code !== JLPT_CODE)
        errors.equivalentJlpt = say(req, 'Choose a JLPT level.', 'JLPT のレベルを選んでください。')
    }
  }

  // The level check starts at the easiest JLPT level and climbs without gaps.
  if (isJlpt && !errors.code) {
    const siblings = await req.payload.find({
      collection: 'levels',
      where: { examType: { equals: examTypeId } },
      pagination: false,
      depth: 0,
      req,
      overrideAccess: true,
    })
    const rows = (siblings.docs as LevelRow[]).filter((l) => String(l.id) !== String(ownId))
    const ladder = [
      ...rows.map((l) => ({
        id: l.id,
        code: l.code,
        order: l.order,
        enabled: Boolean(l.enabledForDetermination),
      })),
      {
        id: ownId ?? 'new',
        code: String(merged.code),
        order: Number(merged.order),
        enabled: Boolean(merged.enabledForDetermination),
      },
    ]
    const problem = ladderProblem(ladder)
    if (problem)
      errors.enabledForDetermination =
        problem.reason === 'first_level_required'
          ? say(
              req,
              `The level check always starts at ${problem.level}, so ${problem.level} must stay on.`,
              `レベルチェックは常に ${problem.level} から始まるため、${problem.level} はオンのままにしてください。`,
            )
          : say(
              req,
              `The level check climbs one level at a time: turn on ${problem.missing} before ${problem.level}, or turn ${problem.level} off first.`,
              `レベルチェックは1段階ずつ進みます。${problem.level} の前に ${problem.missing} をオンにするか、先に ${problem.level} をオフにしてください。`,
            )
  }

  return errors
}

/**
 * Levels of each exam type (D-014) with the three switches from D-008 / SM-R02.
 * Never deleted: tests, questions and results refer to them. Turn the switches off instead.
 */
export const Levels: CollectionConfig = {
  slug: 'levels',
  labels: {
    singular: { en: 'Level', ja: 'レベル' },
    plural: { en: 'Levels', ja: 'レベル' },
  },
  admin: {
    group: ADMIN_GROUPS.catalogue,
    useAsTitle: 'name',
    defaultColumns: [
      'name',
      'code',
      'examType',
      'order',
      'enabledForMockTests',
      'enabledForDetermination',
      'enabledForStudy',
    ],
    listSearchableFields: ['code', 'name'],
    pagination: { defaultLimit: 25, limits: [10, 25, 50] },
    description: {
      en: 'Levels of each exam and where they are used. Levels are never deleted because tests and results refer to them; turn their switches off instead.',
      ja: '各試験のレベルと、その利用範囲です。模擬試験や結果が参照するため削除はできません。代わりにスイッチをオフにしてください。',
    },
  },
  defaultSort: 'order',
  indexes: [{ fields: ['examType', 'code'], unique: true }],
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
          index: true,
          label: { en: 'Exam type', ja: '試験種別' },
          admin: { width: '50%', allowCreate: false },
        },
        {
          name: 'code',
          type: 'text',
          required: true,
          label: { en: 'Code', ja: 'コード' },
          admin: {
            width: '50%',
            description: { en: 'e.g. N5, 5Q, A2.1', ja: '例：N5、5Q、A2.1' },
          },
          validate: (value: string | null | undefined, args: ValidateArgs) =>
            typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9.-]{0,9}$/.test(value)
              ? crossRecord('code')(value, args)
              : say(
                  args.req,
                  'Use up to 10 letters, digits, dots or hyphens.',
                  '英数字・ドット・ハイフンで10文字以内にしてください。',
                ),
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          localized: true,
          maxLength: 60,
          label: { en: 'Name', ja: '名称' },
          admin: { width: '50%' },
        },
        {
          name: 'order',
          type: 'number',
          required: true,
          min: 1,
          max: 99,
          label: { en: 'Order (easiest = 1)', ja: '順序（最も易しい＝1）' },
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'equivalentJlpt',
      type: 'relationship',
      relationTo: 'levels',
      label: { en: 'Equivalent JLPT level', ja: '相当する JLPT レベル' },
      filterOptions: { 'examType.code': { equals: JLPT_CODE } },
      validate: crossRecord('equivalentJlpt'),
      admin: {
        allowCreate: false,
        description: {
          en: 'For NAT and JFT levels: the JLPT level it corresponds to (e.g. 5Q ≈ N5).',
          ja: 'NAT・JFT のレベル用：相当する JLPT レベル（例：5Q ≈ N5）。',
        },
      },
    },
    {
      type: 'collapsible',
      label: { en: 'Where this level is used', ja: 'このレベルの利用範囲' },
      fields: [
        {
          name: 'enabledForMockTests',
          type: 'checkbox',
          defaultValue: false,
          label: { en: 'Mock tests', ja: '模擬試験' },
          admin: {
            description: {
              en: 'Students can take mock tests at this level (D-015).',
              ja: '受講者はこのレベルの模擬試験を受験できます（D-015）。',
            },
          },
        },
        {
          name: 'enabledForDetermination',
          type: 'checkbox',
          defaultValue: false,
          validate: crossRecord('enabledForDetermination'),
          label: { en: 'Level check', ja: 'レベルチェック' },
          admin: {
            description: {
              en: 'A stage of the level check. JLPT only; always starts at the easiest level and climbs without gaps (D-008).',
              ja: 'レベルチェックの段階です。JLPT のみ。常に最も易しいレベルから始まり、途中を飛ばさずに進みます（D-008）。',
            },
          },
        },
        {
          name: 'enabledForStudy',
          type: 'checkbox',
          defaultValue: false,
          validate: crossRecord('enabledForStudy'),
          label: { en: 'Study library', ja: '学習教材' },
          admin: {
            description: {
              en: 'Study materials are offered for this level. JLPT only.',
              ja: 'このレベルの学習教材を提供します。JLPT のみ。',
            },
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: { en: 'Colours', ja: '色' },
      admin: { initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'lineColor',
              type: 'text',
              required: true,
              defaultValue: '#2B6BD8',
              label: { en: 'Route line', ja: '路線の色' },
              admin: {
                width: '50%',
                description: {
                  en: 'Drawn on the night background; must be visible (≥ 3:1).',
                  ja: '夜の背景に描かれます。見やすさ 3:1 以上が必要です。',
                },
              },
              validate: colourValidator('line'),
            },
            {
              name: 'badgeColor',
              type: 'text',
              required: true,
              defaultValue: '#1F56B8',
              label: { en: 'Badge', ja: 'バッジの色' },
              admin: {
                width: '50%',
                description: {
                  en: 'Carries white text; must be readable (≥ 4.5:1).',
                  ja: '白い文字を載せます。読みやすさ 4.5:1 以上が必要です。',
                },
              },
              validate: colourValidator('badge'),
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [audit.afterChange],
    afterDelete: [audit.afterDelete],
  },
}
