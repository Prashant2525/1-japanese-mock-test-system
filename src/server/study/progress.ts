import { sql } from '@payloadcms/db-postgres'

import { studySummary, type StudySummary, type Tally } from '@/domain/study-progress'
import type { Level, MaterialCategory } from '@/payload-types'

import { payloadClient, type SessionStudent } from '../auth/session'
import { AppError } from '../http/errors'
import {
  categoryOption,
  eligibility,
  levelOption,
  visibleWhere,
  type StudyCategoryOption,
  type StudyLevelOption,
} from './service'

/**
 * Study progress (RV-12, D-107): "last opened" is recorded when the student opens a material page;
 * "studied" only when they press the button. Every query is for the signed-in student's own rows;
 * nothing here accepts a student id from the browser.
 */
type Locale = 'en' | 'ja'
type Student = Pick<SessionStudent, 'id' | 'assignedLevel'>

const idOf = (v: unknown): number | null =>
  v && typeof v === 'object' && 'id' in v
    ? Number((v as { id: unknown }).id)
    : v == null
      ? null
      : Number(v)

async function db() {
  return (await payloadClient()).db.drizzle
}

/** Upserts the row and stamps "last opened" (and "first opened" the first time). */
export async function recordOpen(studentId: number, materialId: number): Promise<void> {
  await (
    await db()
  ).execute(sql`
    INSERT INTO study_progress (student_id, material_id, first_opened_at, last_opened_at, updated_at, created_at)
    VALUES (${studentId}, ${materialId}, now(), now(), now(), now())
    ON CONFLICT (student_id, material_id)
    DO UPDATE SET last_opened_at = now(), updated_at = now()`)
}

/** When the student marked this material as studied, or null. */
export async function studiedAtFor(studentId: number, materialId: number): Promise<string | null> {
  const res = await (
    await db()
  ).execute(sql`
    SELECT studied_at FROM study_progress WHERE student_id = ${studentId} AND material_id = ${materialId}`)
  const at = (res.rows[0] as { studied_at?: Date | string | null } | undefined)?.studied_at
  return at ? new Date(at).toISOString() : null
}

/**
 * Marks (or unmarks) a material the student may see right now as studied. Anything else answers
 * NOT_FOUND, exactly like the material page.
 */
export async function setStudied(
  student: Student,
  slug: string,
  studied: boolean,
): Promise<{ studiedAt: string | null }> {
  const payload = await payloadClient()
  const { levels, categories } = await eligibility(payload, student, 'en')
  const found = await payload.find({
    collection: 'study-materials',
    where: {
      and: [
        { slug: { equals: slug } },
        ...visibleWhere(
          levels.map((l) => l.id),
          categories.map((c) => c.id),
        ),
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const material = found.docs[0]
  if (!material) throw new AppError('NOT_FOUND')
  const res = await (
    await db()
  ).execute(sql`
    INSERT INTO study_progress (student_id, material_id, first_opened_at, last_opened_at, studied_at, updated_at, created_at)
    VALUES (${student.id}, ${material.id}, now(), now(), ${studied ? sql`now()` : sql`NULL`}, now(), now())
    ON CONFLICT (student_id, material_id)
    DO UPDATE SET studied_at = ${studied ? sql`COALESCE(study_progress.studied_at, now())` : sql`NULL`},
      updated_at = now()
    RETURNING studied_at`)
  const at = (res.rows[0] as { studied_at?: Date | string | null } | undefined)?.studied_at
  return { studiedAt: at ? new Date(at).toISOString() : null }
}

export type DashboardMaterial = {
  slug: string
  title: string
  summary: string | null
  level: StudyLevelOption
  category: StudyCategoryOption
}

export type StudyDashboard = {
  total: Tally
  categories: (StudyCategoryOption & Tally)[]
  continue: DashboardMaterial | null
  recommended: DashboardMaterial[]
  lastStudiedAt: string | null
}

/** Everything the dashboard shows about studying, from the student's own records. */
export async function studyDashboardFor(student: Student, locale: Locale): Promise<StudyDashboard> {
  const payload = await payloadClient()
  const { levels, categories } = await eligibility(payload, student, locale)
  const found = await payload.find({
    collection: 'study-materials',
    where: {
      and: visibleWhere(
        levels.map((l) => l.id),
        categories.map((c) => c.id),
      ),
    },
    pagination: false,
    depth: 1,
    locale,
    overrideAccess: true,
    select: { slug: true, title: true, summary: true, level: true, category: true, order: true },
  })
  const rows = await (
    await db()
  ).execute(sql`
    SELECT material_id, last_opened_at, studied_at FROM study_progress WHERE student_id = ${student.id}`)
  const progress = (
    rows.rows as {
      material_id: number
      last_opened_at: Date | string
      studied_at: Date | string | null
    }[]
  ).map((r) => ({
    materialId: Number(r.material_id),
    lastOpenedAt: new Date(r.last_opened_at).toISOString(),
    studiedAt: r.studied_at ? new Date(r.studied_at).toISOString() : null,
  }))

  const ownLevelId = idOf(student.assignedLevel)
  const ownOrder = levels.find((l) => l.id === ownLevelId)?.order ?? levels.at(-1)?.order ?? 1
  const summary: StudySummary = studySummary(
    found.docs.map((m) => ({
      id: m.id,
      categoryKey: (m.category as MaterialCategory).key,
      categoryOrder: (m.category as MaterialCategory).order,
      levelOrder: (m.level as Level).order,
      order: m.order,
    })),
    progress,
    ownOrder,
  )
  const view = (id: number): DashboardMaterial | null => {
    const m = found.docs.find((d) => d.id === id)
    return m
      ? {
          slug: m.slug,
          title: m.title,
          summary: m.summary ?? null,
          level: levelOption(m.level as Level),
          category: categoryOption(m.category as MaterialCategory),
        }
      : null
  }
  return {
    total: summary.total,
    categories: categories
      .map((c) => ({
        ...categoryOption(c),
        ...(summary.byCategory[c.key] ?? { available: 0, studied: 0, percent: 0 }),
      }))
      .filter((c) => c.available > 0),
    continue: summary.continueId ? view(summary.continueId) : null,
    recommended: summary.recommendedIds.map(view).filter((m): m is DashboardMaterial => m !== null),
    lastStudiedAt: summary.lastStudiedAt,
  }
}
