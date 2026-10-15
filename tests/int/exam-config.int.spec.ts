import { randomUUID } from 'node:crypto'

import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { GET as catalogueRoute } from '@/app/api/v1/catalogue/exams/route'
import type { CatalogueExam } from '@/server/catalogue/queries'

import { asUser, call, client, createAdmin } from './helpers'

/**
 * Phase 13: exam types, levels and sections (D-014, D-018, D-103). Sections are CMS-managed,
 * per exam and optionally per level; integrity rules stop invalid combinations; nothing in the
 * catalogue is deleted; the public catalogue shows only what is switched on.
 */
let payload: Payload
type User = Awaited<ReturnType<typeof asUser>>
let manager: User
let support: User
const run = randomUUID().slice(0, 5).toUpperCase()
let testExam: number
let testLevel: number
let testLevel2: number
const ids = new Map<string, number>()

async function catalogue(locale = 'en'): Promise<CatalogueExam[]> {
  const res = await call(catalogueRoute, `/api/v1/catalogue/exams?locale=${locale}`, {
    method: 'GET',
  })
  expect(res.status).toBe(200)
  return ((await res.json()) as { exams: CatalogueExam[] }).exams
}

const sectionKeys = (exams: CatalogueExam[], exam: string, level: string) =>
  exams
    .find((e) => e.code === exam)
    ?.levels.find((l) => l.code === level)
    ?.sections.map((s) => s.key)

async function refusal(p: Promise<unknown>): Promise<number> {
  try {
    await p
  } catch (err) {
    return (err as { status?: number }).status ?? 500
  }
  throw new Error('expected the call to be refused')
}

/**
 * Removes this file's throwaway exams (code T + 5 hex characters), from this or earlier runs:
 * sections, then levels, then the exam (the database refuses any other order). Test-only: the
 * app never deletes catalogue records.
 */
async function removeTestExams(): Promise<void> {
  const exams = await payload.find({ collection: 'exam-types', pagination: false, depth: 0 })
  for (const exam of exams.docs.filter((e) => /^T[0-9A-F]{5}$/.test(e.code))) {
    const byExam = { examType: { equals: exam.id } }
    await payload.db.deleteMany({ collection: 'exam-sections', where: byExam })
    await payload.db.deleteMany({ collection: 'levels', where: byExam })
    await payload.db.deleteOne({ collection: 'exam-types', where: { id: { equals: exam.id } } })
  }
}

afterAll(async () => {
  await removeTestExams()
})

beforeAll(async () => {
  payload = await client()
  manager = await asUser((await createAdmin('Content Editor')).admin) // has catalogue.manage
  support = await asUser((await createAdmin('Support')).admin)
  const levels = await payload.find({ collection: 'levels', pagination: false, depth: 1 })
  for (const l of levels.docs) {
    const exam = typeof l.examType === 'object' ? l.examType.code : ''
    ids.set(`${exam}:${l.code}`, l.id)
  }
  await removeTestExams()
  // A throwaway exam so switching things off never touches the real catalogue.
  testExam = (
    await payload.create({
      collection: 'exam-types',
      data: { code: `T${run}`, name: `Test exam ${run}`, order: 900, enabled: true },
    })
  ).id
  const level = (code: string, order: number) =>
    payload.create({
      collection: 'levels',
      data: {
        examType: testExam,
        code,
        name: code,
        order,
        lineColor: '#2B6BD8',
        badgeColor: '#1F56B8',
        enabledForMockTests: true,
      },
    })
  testLevel = (await level('L1', 1)).id
  testLevel2 = (await level('L2', 2)).id
})

describe('seeded sections from the official exam guides', () => {
  it('JLPT N5–N3 have three sections, N2–N1 two; JFT has four; NAT three', async () => {
    const exams = await catalogue()
    expect(sectionKeys(exams, 'JLPT', 'N5')).toEqual(['vocabulary', 'grammar-reading', 'listening'])
    expect(sectionKeys(exams, 'JLPT', 'N3')).toEqual(['vocabulary', 'grammar-reading', 'listening'])
    expect(sectionKeys(exams, 'JLPT', 'N1')).toEqual(['knowledge-reading', 'listening'])
    expect(sectionKeys(exams, 'NAT', '5Q')).toEqual(['vocabulary', 'grammar-reading', 'listening'])
    expect(sectionKeys(exams, 'JFT', 'A1')).toEqual([
      'script-vocabulary',
      'conversation-expression',
      'listening',
      'reading',
    ])
  })

  it('names come in the requested language', async () => {
    const [en, ja] = [await catalogue('en'), await catalogue('ja')]
    const name = (exams: CatalogueExam[]) =>
      exams.find((e) => e.code === 'JLPT')!.levels.find((l) => l.code === 'N5')!.sections[2]!.name
    expect(name(en)).toBe('Listening')
    expect(name(ja)).toBe('聴解')
  })
})

describe('section integrity', () => {
  it('a section may only be limited to levels of its own exam', async () => {
    const status = await refusal(
      payload.create({
        collection: 'exam-sections',
        data: {
          examType: testExam,
          key: 'mixed',
          name: 'Mixed',
          order: 1,
          levels: [ids.get('JLPT:N5')!],
        },
        user: manager,
        overrideAccess: false,
      }),
    )
    expect(status).toBe(400)
  })

  it('keys are unique within an exam (the same key may exist in another exam)', async () => {
    await payload.create({
      collection: 'exam-sections',
      data: { examType: testExam, key: 'listening', name: 'Listening', order: 2 },
      user: manager,
      overrideAccess: false,
    })
    const status = await refusal(
      payload.create({
        collection: 'exam-sections',
        data: { examType: testExam, key: 'listening', name: 'Again', order: 3 },
        user: manager,
        overrideAccess: false,
      }),
    )
    expect(status).toBeGreaterThanOrEqual(400)
  })

  it('the key and the exam cannot be changed after creation', async () => {
    const otherExam = (
      await payload.find({ collection: 'exam-types', where: { code: { equals: 'NAT' } } })
    ).docs[0]!.id
    const s = await payload.create({
      collection: 'exam-sections',
      data: { examType: testExam, key: 'fixed', name: 'Fixed', order: 4 },
      user: manager,
      overrideAccess: false,
    })
    const after = await payload.update({
      collection: 'exam-sections',
      id: s.id,
      data: { key: 'renamed', examType: otherExam, name: 'Fixed 2' },
      user: manager,
      overrideAccess: false,
    })
    expect(after.key).toBe('fixed')
    expect(typeof after.examType === 'object' ? after.examType.id : after.examType).toBe(testExam)
    expect(after.name).toBe('Fixed 2')
  })

  it('Support cannot change the catalogue; nobody can delete sections, levels or exam types', async () => {
    expect(
      await refusal(
        payload.create({
          collection: 'exam-sections',
          data: { examType: testExam, key: 'support', name: 'No', order: 5 },
          user: support,
          overrideAccess: false,
        }),
      ),
    ).toBe(403)
    const section = (
      await payload.find({
        collection: 'exam-sections',
        where: { examType: { equals: testExam } },
        limit: 1,
      })
    ).docs[0]!
    const superAdmin = await asUser((await createAdmin('Super Admin')).admin)
    for (const [collection, id] of [
      ['exam-sections', section.id],
      ['levels', testLevel],
      ['exam-types', testExam],
    ] as const) {
      expect(
        await refusal(payload.delete({ collection, id, user: superAdmin, overrideAccess: false })),
      ).toBe(403)
    }
  })
})

describe('what the public catalogue shows', () => {
  it('per-level sections, and switched-off sections, levels and exams disappear', async () => {
    const onlyL2 = await payload.create({
      collection: 'exam-sections',
      data: { examType: testExam, key: 'only-l2', name: 'Only L2', order: 1, levels: [testLevel2] },
      user: manager,
      overrideAccess: false,
    })
    let exams = await catalogue()
    expect(sectionKeys(exams, `T${run}`, 'L1')).not.toContain('only-l2')
    expect(sectionKeys(exams, `T${run}`, 'L2')).toContain('only-l2')

    await payload.update({ collection: 'exam-sections', id: onlyL2.id, data: { enabled: false } })
    exams = await catalogue()
    expect(sectionKeys(exams, `T${run}`, 'L2')).not.toContain('only-l2')

    await payload.update({
      collection: 'levels',
      id: testLevel2,
      data: { enabledForMockTests: false },
    })
    exams = await catalogue()
    expect(exams.find((e) => e.code === `T${run}`)!.levels.map((l) => l.code)).toEqual(['L1'])

    await payload.update({
      collection: 'exam-types',
      id: testExam,
      data: { enabled: false },
      user: manager,
      overrideAccess: false,
    })
    exams = await catalogue()
    expect(exams.find((e) => e.code === `T${run}`)).toBeUndefined()
  })
})

describe('switching an exam off cannot break the level check or study (D-008)', () => {
  it('JLPT cannot be switched off while its levels are used, and stays on', async () => {
    const jlpt = (
      await payload.find({ collection: 'exam-types', where: { code: { equals: 'JLPT' } } })
    ).docs[0]!
    const status = await refusal(
      payload.update({
        collection: 'exam-types',
        id: jlpt.id,
        data: { enabled: false },
        user: manager,
        overrideAccess: false,
      }),
    )
    expect(status).toBe(400)
    const still = await payload.findByID({ collection: 'exam-types', id: jlpt.id })
    expect(still.enabled).toBe(true)
  })
})

describe('historical records are independent of later catalogue changes', () => {
  it('results keep their own copies (no links to exams, levels or sections); history links are RESTRICT', async () => {
    const { sql } = await import('@payloadcms/db-postgres')
    const rows = (
      await payload.db.drizzle.execute(sql`
        SELECT tc.table_name AS "from", ccu.table_name AS "to", rc.delete_rule AS "rule"
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_name IN ('exam_types', 'levels', 'exam_sections')`)
    ).rows as { from: string; to: string; rule: string }[]
    // Results and their items copy exam/level codes and section names instead of linking to them.
    expect(rows.filter((r) => r.from === 'results' || r.from === 'result_items')).toEqual([])
    // History (level assignments, level-check sessions) and live content (questions, study
    // materials, level-check stages, students) cannot lose their exam or level to a delete.
    const guarded =
      /^(level_assignments|level_check_sessions|questions|study_materials|level_check_settings_stages|students)$/
    const links = rows.filter((r) => guarded.test(r.from))
    expect(links.length).toBeGreaterThanOrEqual(7)
    for (const r of links) expect([r.from, r.rule]).toEqual([r.from, 'RESTRICT'])
    // Sections and levels point at their exam with RESTRICT too.
    for (const r of rows.filter((r) => r.from === 'exam_sections' || r.from === 'levels')) {
      expect([r.from, r.to, r.rule]).toEqual([r.from, r.to, 'RESTRICT'])
    }
  })
})
