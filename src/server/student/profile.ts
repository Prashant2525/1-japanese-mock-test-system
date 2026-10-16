import { payloadClient, type SessionStudent } from '../auth/session'
import { levelById, type LevelStop } from '../catalogue/queries'

/**
 * The student's own profile (D-106, REC-05 read-only part): account details, how their level was
 * set and its history, and sign-in methods. Only booleans and dates about sign-in methods are
 * returned — never the Google account ID. Staff notes (reasons) are not shown.
 */
type Locale = 'en' | 'ja'

export type LevelHistoryEntry = {
  at: string
  levelCode: string | null
  source: 'determination' | 'override' | 'reset'
}

export type StudentProfile = {
  name: string
  email: string
  preferredLocale: Locale
  joinedAt: string
  googleLinked: boolean
  level: LevelStop | null
  levelSetAt: string | null
  levelSource: LevelHistoryEntry['source'] | null
  history: LevelHistoryEntry[]
  resultsCount: number
}

const idOf = (v: unknown): number | null =>
  v && typeof v === 'object' && 'id' in v
    ? Number((v as { id: unknown }).id)
    : v == null
      ? null
      : Number(v)

export async function profileFor(student: SessionStudent, locale: Locale): Promise<StudentProfile> {
  const payload = await payloadClient()
  const [full, history, results] = await Promise.all([
    payload.findByID({
      collection: 'students',
      id: student.id,
      depth: 0,
      overrideAccess: true,
      select: { googleSub: true, createdAt: true, assignedAt: true },
    }),
    payload.find({
      collection: 'level-assignments',
      where: { student: { equals: student.id } },
      sort: '-createdAt',
      limit: 20,
      depth: 1,
      locale,
      overrideAccess: true,
    }),
    payload.count({
      collection: 'results',
      where: { student: { equals: student.id } },
      overrideAccess: true,
    }),
  ])
  const levelId = idOf(student.assignedLevel)
  const entries: LevelHistoryEntry[] = history.docs.map((h) => ({
    at: h.createdAt,
    levelCode: typeof h.level === 'object' && h.level ? h.level.code : null,
    source: h.source,
  }))
  const latest = entries.find((e) => e.source !== 'reset') ?? null
  return {
    name: student.name,
    email: student.email,
    preferredLocale: student.preferredLocale === 'ja' ? 'ja' : 'en',
    joinedAt: full.createdAt,
    googleLinked: Boolean(full.googleSub),
    level: levelId ? await levelById(payload, levelId, locale) : null,
    levelSetAt: full.assignedAt ?? latest?.at ?? null,
    levelSource: latest?.source ?? null,
    history: entries,
    resultsCount: results.totalDocs,
  }
}
