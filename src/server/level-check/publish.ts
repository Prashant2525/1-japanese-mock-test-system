import { createHash } from 'node:crypto'

import type { PayloadRequest } from 'payload'

import type { LevelCheckSnapshot, SnapshotStage } from '@/domain/determination'

import { recordAudit } from '../audit/record'
import { JLPT_CODE } from '../catalogue/rules'

type Problem = { en: string; ja: string }
type StageInput = {
  level?: unknown
  thresholdPercent?: unknown
  durationMinutes?: unknown
  questions?: unknown
}

const idOf = (v: unknown): number | undefined => {
  if (v && typeof v === 'object' && 'id' in v) return Number((v as { id: unknown }).id)
  return v === null || v === undefined || v === '' ? undefined : Number(v)
}

type Localized = { en?: string | null; ja?: string | null } | string | null | undefined
const both = (v: Localized): { en: string; ja: string } =>
  typeof v === 'object' && v !== null
    ? { en: v.en ?? '', ja: v.ja ?? v.en ?? '' }
    : { en: v ?? '', ja: v ?? '' }

/** The JLPT levels switched on for the level check, easiest first (the only valid stage list). */
async function levelCheckLevels(req: PayloadRequest) {
  const found = await req.payload.find({
    collection: 'levels',
    where: {
      and: [
        { 'examType.code': { equals: JLPT_CODE } },
        { enabledForDetermination: { equals: true } },
      ],
    },
    sort: 'order',
    pagination: false,
    depth: 0,
    locale: 'all',
    req,
    overrideAccess: true,
  })
  return found.docs
}

/**
 * Publish rules (LD-R03, D-008, D-011): the stages are exactly the enabled JLPT levels in order from
 * the easiest (N5), no gaps or extras, and every stage has published, rights-confirmed questions of
 * its own level. Returns every problem found (empty = publishable).
 */
export async function validateLevelCheckStages(
  req: PayloadRequest,
  value: unknown,
): Promise<Problem[]> {
  const stages = (Array.isArray(value) ? value : []) as StageInput[]
  const problems: Problem[] = []
  const levels = await levelCheckLevels(req)
  const expected = levels.map((l) => l.id)
  const actual = stages.map((s) => idOf(s.level))
  if (expected.length === 0) {
    problems.push({
      en: 'No level is switched on for the level check (Exam catalogue → Levels).',
      ja: 'レベルチェックで有効なレベルがありません（試験カタログ → レベル）。',
    })
  } else if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    const codes = levels.map((l) => l.code).join(' → ')
    problems.push({
      en: `The stages must be ${codes}, in this order (one per level switched on for the level check).`,
      ja: `段階は ${codes} の順でなければなりません（レベルチェックで有効なレベルごとに1つ）。`,
    })
  }
  for (const [i, stage] of stages.entries()) {
    const level = levels.find((l) => l.id === idOf(stage.level))
    const label = level?.code ?? `#${i + 1}`
    const questionIds = (Array.isArray(stage.questions) ? stage.questions : [])
      .map(idOf)
      .filter((id): id is number => id !== undefined)
    if (questionIds.length === 0) {
      problems.push({
        en: `Stage ${label} has no questions.`,
        ja: `段階 ${label} に問題がありません。`,
      })
      continue
    }
    const found = await req.payload.find({
      collection: 'questions',
      where: { id: { in: questionIds } },
      pagination: false,
      depth: 0,
      draft: false,
      req,
      overrideAccess: true,
    })
    const usable = found.docs.filter(
      (q) =>
        q._status === 'published' &&
        q.rightsConfirmed === true &&
        q.archived !== true &&
        idOf(q.level) === idOf(stage.level),
    )
    if (usable.length !== new Set(questionIds).size) {
      problems.push({
        en: `Stage ${label}: every question must be published, rights-confirmed, not archived and of level ${label}.`,
        ja: `段階 ${label}：すべての問題は公開済み・使用権確認済み・アーカイブなしで、レベル ${label} のものでなければなりません。`,
      })
    }
  }
  return problems
}

/** Builds the frozen copy students take: levels, rules and every question's full content. */
async function buildSnapshot(req: PayloadRequest): Promise<LevelCheckSnapshot> {
  const settings = await req.payload.findGlobal({
    slug: 'level-check-settings',
    depth: 0,
    draft: false,
    req,
    overrideAccess: true,
  })
  const stages: SnapshotStage[] = []
  for (const stage of settings.stages ?? []) {
    const levelId = idOf(stage.level)!
    const level = await req.payload.findByID({
      collection: 'levels',
      id: levelId,
      depth: 0,
      locale: 'all',
      req,
      overrideAccess: true,
    })
    const ids = (stage.questions ?? []).map(idOf).filter((id): id is number => id !== undefined)
    const found = await req.payload.find({
      collection: 'questions',
      where: { id: { in: ids } },
      pagination: false,
      depth: 0,
      draft: false,
      locale: 'all',
      req,
      overrideAccess: true,
    })
    const byId = new Map(found.docs.map((q) => [q.id, q]))
    stages.push({
      levelId,
      levelCode: level.code,
      levelName: both(level.name as unknown as Localized),
      thresholdPercent: Number(stage.thresholdPercent),
      durationMinutes: Number(stage.durationMinutes),
      questions: ids.map((id) => {
        const q = byId.get(id)!
        return {
          key: q.key!,
          stem: q.stem,
          options: (q.options ?? []).map((o) => ({ key: o.key, text: o.text })),
          correct: q.correctOptionKey,
          explanation: both(q.explanation as unknown as Localized),
          marks: q.marks,
        }
      }),
    })
  }
  return { stages }
}

const checksumOf = (snapshot: LevelCheckSnapshot) =>
  createHash('sha256').update(JSON.stringify(snapshot)).digest('hex')

/**
 * Called after the settings are published: freezes them into a new numbered version, unless the
 * content is identical to the latest version. Runs in the publish transaction.
 */
export async function publishLevelCheckVersion(
  req: PayloadRequest,
  _previous: unknown,
): Promise<void> {
  const snapshot = await buildSnapshot(req)
  const checksum = checksumOf(snapshot)
  const latest = await req.payload.find({
    collection: 'level-check-versions',
    sort: '-versionNo',
    limit: 1,
    depth: 0,
    req,
    overrideAccess: true,
  })
  if (latest.docs[0]?.checksum === checksum) return
  const versionNo = (latest.docs[0]?.versionNo ?? 0) + 1
  const created = await req.payload.create({
    collection: 'level-check-versions',
    data: {
      versionNo,
      publishedAt: new Date().toISOString(),
      publishedBy: req.user?.collection === 'admins' ? req.user.id : undefined,
      snapshot: snapshot as unknown as Record<string, unknown>,
      checksum,
    },
    req,
    overrideAccess: true,
  })
  await recordAudit(
    req.payload,
    {
      actorType: req.user ? 'admin' : 'system',
      actorId: req.user?.id,
      action: 'level_check.published',
      entityType: 'level-check-versions',
      entityId: created.id,
      summary: `version ${versionNo}: ${snapshot.stages.map((s) => `${s.levelCode} (${s.questions.length} q, ${s.thresholdPercent}%, ${s.durationMinutes} min)`).join(', ')}`,
    },
    req,
  )
}
