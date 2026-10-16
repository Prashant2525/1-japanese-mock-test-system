import { randomUUID } from 'node:crypto'

import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { POST as loginRoute } from '@/app/api/v1/auth/login/route'
import { PUT as progressRoute } from '@/app/api/v1/study/materials/[slug]/progress/route'
import { recordOpen, studyDashboardFor } from '@/server/study/progress'
import { profileFor } from '@/server/student/profile'

import { asUser, call, client, cookieFrom, createAdmin, createStudent, uniqueIp } from './helpers'

/**
 * Phase 13b: the dashboard's data (D-107, RV-12) and the profile (D-106) — only the student's own
 * records, only materials they may see now, "studied" only by an explicit action.
 */
let payload: Payload
let editor: Awaited<ReturnType<typeof asUser>>
const run = randomUUID().slice(0, 6)
const slug = (n: string) => `d${run}-${n}`
const levelIds = new Map<string, number>()
const categoryIds = new Map<string, number>()
const materialIds = new Map<string, number>()

async function material(name: string, level: string, category = 'grammar') {
  const doc = await payload.create({
    collection: 'study-materials',
    data: {
      title: `Dashboard ${name}`,
      slug: slug(name),
      level: levelIds.get(level)!,
      category: categoryIds.get(category)!,
      order: 1,
      _status: 'published',
    },
    user: editor,
    overrideAccess: false,
  })
  materialIds.set(name, doc.id)
  return doc
}

async function student(level: string | null) {
  const { student: s, email, password } = await createStudent()
  if (level) {
    await payload.db.updateOne({
      collection: 'students',
      id: s.id,
      data: {
        determinationStatus: 'completed',
        assignedLevel: levelIds.get(level),
        assignedAt: new Date().toISOString(),
      },
      returning: false,
    })
  }
  const res = await call(loginRoute, '/api/v1/auth/login', {
    body: { email, password },
    ip: uniqueIp(),
  })
  const full = await payload.findByID({ collection: 'students', id: s.id, depth: 0 })
  return { id: s.id, cookie: cookieFrom(res), doc: { ...full, collection: 'students' as const } }
}

const mark = (cookie: string, name: string, body: unknown) =>
  progressRoute(
    new Request(`http://localhost:3000/api/v1/study/materials/${slug(name)}/progress`, {
      method: 'PUT',
      headers: { cookie, 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ slug: slug(name) }) },
  )

beforeAll(async () => {
  payload = await client()
  editor = await asUser((await createAdmin('Content Editor')).admin)
  const levels = await payload.find({
    collection: 'levels',
    where: { 'examType.code': { equals: 'JLPT' } },
    pagination: false,
    depth: 0,
  })
  for (const l of levels.docs) levelIds.set(l.code, l.id)
  const cats = await payload.find({ collection: 'material-categories', pagination: false })
  for (const c of cats.docs) categoryIds.set(c.key, c.id)
  // Earlier runs' materials go first so they do not change the counts.
  const old = await payload.find({ collection: 'study-materials', pagination: false, depth: 0 })
  const stale = old.docs.filter((d) => /^d[0-9a-f]{6}-/.test(d.slug)).map((d) => d.id)
  if (stale.length)
    await payload.delete({ collection: 'study-materials', where: { id: { in: stale } } })
  await material('n5-grammar', 'N5')
  await material('n4-grammar', 'N4')
  await material('n4-kanji', 'N4', 'kanji')
  await material('n3-grammar', 'N3')
})

const mine = (names: string[]) => names.filter((n) => n.startsWith(`d${run}-`))

describe('marking a material as studied', () => {
  it('only the student’s own, idempotent, and can be undone', async () => {
    const s = await student('N4')
    const first = await mark(s.cookie, 'n4-grammar', { studied: true })
    expect(first.status).toBe(200)
    const { studiedAt } = (await first.json()) as { studiedAt: string }
    expect(studiedAt).toMatch(/^\d{4}-/)
    // Pressing again keeps the first time (no double counting, safe to retry).
    const again = (await (await mark(s.cookie, 'n4-grammar', { studied: true })).json()) as {
      studiedAt: string
    }
    expect(again.studiedAt).toBe(studiedAt)
    const undone = (await (await mark(s.cookie, 'n4-grammar', { studied: false })).json()) as {
      studiedAt: string | null
    }
    expect(undone.studiedAt).toBeNull()
  })

  it('a material above the student’s level answers 404; no level → 403; extra fields → 400', async () => {
    const n4 = await student('N4')
    expect((await mark(n4.cookie, 'n3-grammar', { studied: true })).status).toBe(404)
    expect((await mark(n4.cookie, 'n4-grammar', { studied: true, studentId: 1 })).status).toBe(400)
    const none = await student(null)
    expect((await mark(none.cookie, 'n5-grammar', { studied: true })).status).toBe(403)
  })
})

describe('dashboard figures', () => {
  it('count only visible materials, only explicit "studied", and suggest the right next steps', async () => {
    const s = await student('N4')
    const before = await studyDashboardFor(s.doc, 'en')
    const visible = mine(
      [...(before.continue ? [before.continue] : []), ...before.recommended].map((m) => m.slug),
    )
    expect(visible).not.toContain(slug('n3-grammar')) // above N4
    // Opening is not studying.
    await recordOpen(s.id, materialIds.get('n5-grammar')!)
    let d = await studyDashboardFor(s.doc, 'en')
    expect(d.total.studied).toBe(before.total.studied)
    expect(d.continue?.slug).toBe(slug('n5-grammar'))

    await mark(s.cookie, 'n5-grammar', { studied: true })
    d = await studyDashboardFor(s.doc, 'en')
    expect(d.total.studied).toBe(before.total.studied + 1)
    expect(d.continue?.slug).not.toBe(slug('n5-grammar'))
    expect(d.lastStudiedAt).not.toBeNull()
    // Own level first among the suggestions.
    expect(mine(d.recommended.map((m) => m.slug))[0]).toMatch(/n4-/)

    // An archived material stops counting at once, even though it was studied.
    await payload.update({
      collection: 'study-materials',
      id: materialIds.get('n5-grammar')!,
      data: { archived: true },
    })
    d = await studyDashboardFor(s.doc, 'en')
    expect(d.total.studied).toBe(before.total.studied)
    await payload.update({
      collection: 'study-materials',
      id: materialIds.get('n5-grammar')!,
      data: { archived: false },
    })
  })

  it('one student’s progress never shows on another’s dashboard', async () => {
    const a = await student('N4')
    const b = await student('N4')
    await mark(a.cookie, 'n4-kanji', { studied: true })
    const forB = await studyDashboardFor(b.doc, 'en')
    expect(forB.lastStudiedAt).toBeNull()
    expect(forB.total.studied).toBe(0)
  })

  it('deleting a material removes its progress rows with it (D-092)', async () => {
    const s = await student('N5')
    const temp = await material('temp', 'N5')
    await mark(s.cookie, 'temp', { studied: true })
    await payload.delete({ collection: 'study-materials', id: temp.id })
    const rows = await payload.find({
      collection: 'study-progress',
      where: { material: { equals: temp.id } },
    })
    expect(rows.totalDocs).toBe(0)
  })
})

describe('profile', () => {
  it('shows how the level was set and whether Google is linked, never the Google ID', async () => {
    const s = await student('N4')
    await payload.db.updateOne({
      collection: 'students',
      id: s.id,
      data: { googleSub: `g-${run}` },
      returning: false,
    })
    const p = await profileFor(s.doc, 'en')
    expect(p.googleLinked).toBe(true)
    expect(JSON.stringify(p)).not.toContain(`g-${run}`)
    expect(p.level?.code).toBe('N4')
    expect(p.email).toBe(s.doc.email)
  })
})
