import type { Payload } from 'payload'

import type { Level } from '@/payload-types'

import { JLPT_CODE } from './rules'

export type LevelStop = {
  id: number
  code: string
  name: string
  lineColor: string
  badgeColor: string
}

const stop = (l: Level): LevelStop => ({
  id: l.id,
  code: l.code,
  name: l.name,
  lineColor: l.lineColor,
  badgeColor: l.badgeColor,
})

/** The level-check stages in order (JLPT levels switched on for it in the CMS, D-008). */
export async function levelCheckStages(
  payload: Payload,
  locale: 'en' | 'ja',
): Promise<LevelStop[]> {
  const found = await payload.find({
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
    locale,
    overrideAccess: true,
  })
  return found.docs.map(stop)
}

export async function levelById(
  payload: Payload,
  id: number,
  locale: 'en' | 'ja',
): Promise<LevelStop | null> {
  const level = await payload
    .findByID({ collection: 'levels', id, depth: 0, locale, overrideAccess: true })
    .catch(() => null)
  return level ? stop(level) : null
}

export type CatalogueSection = { key: string; name: string }
export type CatalogueLevel = LevelStop & { sections: CatalogueSection[] }
export type CatalogueExam = {
  code: string
  name: string
  description: string | null
  nonAffiliationNotice: string | null
  levels: CatalogueLevel[]
}

const idOf = (v: unknown): number | undefined =>
  typeof v === 'number'
    ? v
    : typeof v === 'object' && v !== null
      ? (v as { id?: number }).id
      : undefined

/**
 * The exam catalogue students and visitors see (Phase 13, MT-R02): enabled exam types in order,
 * their levels switched on for mock tests, and each level's enabled sections in order. All data
 * comes from the CMS; nothing here is hard-coded.
 */
export async function examCatalogue(
  payload: Payload,
  locale: 'en' | 'ja',
): Promise<CatalogueExam[]> {
  const [exams, levels, sections] = await Promise.all([
    payload.find({
      collection: 'exam-types',
      where: { enabled: { equals: true } },
      sort: 'order',
      pagination: false,
      depth: 0,
      locale,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'levels',
      where: { enabledForMockTests: { equals: true } },
      sort: 'order',
      pagination: false,
      depth: 0,
      locale,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'exam-sections',
      where: { enabled: { equals: true } },
      sort: 'order',
      pagination: false,
      depth: 0,
      locale,
      overrideAccess: true,
    }),
  ])
  return exams.docs.map((exam) => ({
    code: exam.code,
    name: exam.name,
    description: exam.description ?? null,
    nonAffiliationNotice: exam.nonAffiliationNotice ?? null,
    levels: levels.docs
      .filter((l) => idOf(l.examType) === exam.id)
      .map((l) => ({
        ...stop(l),
        sections: sections.docs
          .filter((s) => idOf(s.examType) === exam.id)
          .filter((s) => {
            const only = (s.levels ?? []).map(idOf)
            return only.length === 0 || only.includes(l.id)
          })
          .map((s) => ({ key: s.key, name: s.name })),
      })),
  }))
}
