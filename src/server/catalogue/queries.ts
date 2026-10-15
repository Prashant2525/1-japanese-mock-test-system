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
