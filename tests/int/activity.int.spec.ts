import { randomUUID } from 'node:crypto'

import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { POST as loginRoute } from '@/app/api/v1/auth/login/route'
import { PUT as goalRoute } from '@/app/api/v1/me/goal/route'
import {
  DELETE as deletePlanRoute,
  PATCH as patchPlanRoute,
} from '@/app/api/v1/me/plans/[id]/route'
import { POST as createPlanRoute } from '@/app/api/v1/me/plans/route'
import { PUT as progressRoute } from '@/app/api/v1/study/materials/[slug]/progress/route'
import { addDays, nepalDate } from '@/domain/study-days'
import { activityFor } from '@/server/student/activity'
import { plansFor } from '@/server/student/plans'

import { asUser, call, client, cookieFrom, createAdmin, createStudent, uniqueIp } from './helpers'

/**
 * Phase 13c: streaks, the daily goal, milestones and the study calendar (D-110, D-111) — counted
 * only from real study actions, only for the signed-in student; plans are private and validated.
 */
let payload: Payload
const run = randomUUID().slice(0, 6)
const today = nepalDate(new Date())
let materialSlug = ''

const req = (url: string, method: string, cookie: string, body?: unknown) =>
  new Request(`http://localhost:3000${url}`, {
    method,
    headers: { cookie, 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

async function student(level: string | null = 'N5') {
  const { student: s, email, password } = await createStudent()
  if (level) {
    const lvl = await payload.find({
      collection: 'levels',
      where: { and: [{ code: { equals: level } }, { 'examType.code': { equals: 'JLPT' } }] },
    })
    await payload.db.updateOne({
      collection: 'students',
      id: s.id,
      data: { determinationStatus: 'completed', assignedLevel: lvl.docs[0]!.id },
      returning: false,
    })
  }
  const res = await call(loginRoute, '/api/v1/auth/login', {
    body: { email, password },
    ip: uniqueIp(),
  })
  return { id: s.id, cookie: cookieFrom(res) }
}

const createPlan = (cookie: string, body: unknown) =>
  createPlanRoute(req('/api/v1/me/plans', 'POST', cookie, body))
const plan = (cookie: string, id: number, method: 'PATCH' | 'DELETE', body?: unknown) =>
  (method === 'PATCH' ? patchPlanRoute : deletePlanRoute)(
    req(`/api/v1/me/plans/${id}`, method, cookie, body),
    {
      params: Promise.resolve({ id: String(id) }),
    },
  )

beforeAll(async () => {
  payload = await client()
  const editor = await asUser((await createAdmin('Content Editor')).admin)
  const n5 = await payload.find({
    collection: 'levels',
    where: { and: [{ code: { equals: 'N5' } }, { 'examType.code': { equals: 'JLPT' } }] },
  })
  const grammar = await payload.find({
    collection: 'material-categories',
    where: { key: { equals: 'grammar' } },
  })
  materialSlug = `a${run}-goal`
  await payload.create({
    collection: 'study-materials',
    data: {
      title: 'Activity material',
      slug: materialSlug,
      level: n5.docs[0]!.id,
      category: grammar.docs[0]!.id,
      order: 1,
      _status: 'published',
    },
    user: editor,
    overrideAccess: false,
  })
})

describe('daily goal', () => {
  it('the student sets 1–5; anything else is refused; no level → 403', async () => {
    const s = await student()
    const ok = await goalRoute(req('/api/v1/me/goal', 'PUT', s.cookie, { dailyGoal: 3 }))
    expect(ok.status).toBe(200)
    expect((await activityFor(s.id)).goal).toBe(3)
    for (const bad of [0, 6, 2.5, '3']) {
      expect(
        (await goalRoute(req('/api/v1/me/goal', 'PUT', s.cookie, { dailyGoal: bad }))).status,
      ).toBe(400)
    }
    const none = await student(null)
    expect(
      (await goalRoute(req('/api/v1/me/goal', 'PUT', none.cookie, { dailyGoal: 2 }))).status,
    ).toBe(403)
  })
})

describe('study actions, streaks and milestones', () => {
  it('a material counts once — unmarking and re-marking never adds another action', async () => {
    const s = await student()
    const mark = (studied: boolean) =>
      progressRoute(
        req(`/api/v1/study/materials/${materialSlug}/progress`, 'PUT', s.cookie, { studied }),
        {
          params: Promise.resolve({ slug: materialSlug }),
        },
      )
    await mark(true)
    let a = await activityFor(s.id)
    expect(a.todayMaterials).toBe(1)
    expect(a.streak).toEqual({ current: 1, longest: 1, studiedToday: true })
    expect(a.milestones.find((m) => m.key === 'first-material')?.earnedOn).toBe(today)
    await mark(false)
    await mark(true)
    a = await activityFor(s.id)
    expect(a.todayMaterials).toBe(1)
    expect(a.actionsPerDay[today]).toBe(1)
  })

  it('consecutive Nepal days make a streak that stays alive until today ends; a gap resets it', async () => {
    const s = await student()
    const days = [-3, -2, -1].map((n) => addDays(today, n))
    // Three earlier study days, written as the service would have (first-studied times at Nepal noon).
    const materials = await payload.find({ collection: 'study-materials', limit: 3, depth: 0 })
    for (const [i, d] of days.entries()) {
      await payload.db.drizzle.execute(sql`
        INSERT INTO study_progress (student_id, material_id, first_opened_at, last_opened_at, studied_at, first_studied_at, updated_at, created_at)
        VALUES (${s.id}, ${materials.docs[i]!.id}, now(), now(), ${`${d}T06:15:00Z`}, ${`${d}T06:15:00Z`}, now(), now())`)
    }
    let a = await activityFor(s.id)
    expect(a.streak).toEqual({ current: 3, longest: 3, studiedToday: false }) // alive until today ends
    expect(a.week.slice(-4).map((d) => d.count)).toEqual([1, 1, 1, 0])
    // Two days later without studying, the streak is gone but the longest is kept.
    a = await activityFor(s.id, new Date(Date.parse(`${addDays(today, 2)}T06:00:00Z`)))
    expect(a.streak.current).toBe(0)
    expect(a.streak.longest).toBe(3)
    expect(a.milestones.find((m) => m.key === 'streak-3')?.earnedOn).toBe(days[2])
  })

  it('one student never sees another’s activity', async () => {
    const a = await student()
    const b = await student()
    await progressRoute(
      req(`/api/v1/study/materials/${materialSlug}/progress`, 'PUT', a.cookie, { studied: true }),
      {
        params: Promise.resolve({ slug: materialSlug }),
      },
    )
    const forB = await activityFor(b.id)
    expect(forB.todayMaterials).toBe(0)
    expect(forB.streak.current).toBe(0)
  })
})

describe('study plans', () => {
  it('create, tick, remove — only the owner; dates and sizes are validated', async () => {
    const s = await student()
    const other = await student()
    const created = await createPlan(s.cookie, {
      date: addDays(today, 3),
      note: '  Grammar: は and が  ',
    })
    expect(created.status).toBe(201)
    const p = (await created.json()) as { id: number; note: string; done: boolean }
    expect(p.note).toBe('Grammar: は and が')
    expect(p.done).toBe(false)

    // Another student cannot see, tick or remove it.
    expect(await plansFor(other.id, today, addDays(today, 10))).toEqual([])
    expect((await plan(other.cookie, p.id, 'PATCH', { done: true })).status).toBe(404)
    expect((await plan(other.cookie, p.id, 'DELETE')).status).toBe(404)

    expect((await plan(s.cookie, p.id, 'PATCH', { done: true })).status).toBe(200)
    expect((await plansFor(s.id, today, addDays(today, 10)))[0]?.done).toBe(true)
    expect((await plan(s.cookie, p.id, 'DELETE')).status).toBe(204)
    expect(await plansFor(s.id, today, addDays(today, 10))).toEqual([])

    for (const bad of [
      { date: '2026-02-30', note: 'x' }, // not a real date
      { date: addDays(today, 400), note: 'x' }, // too far ahead
      { date: addDays(today, -40), note: 'x' }, // too far back
      { date: today, note: '' },
      { date: today, note: 'x'.repeat(81) },
      { date: today, note: 'x', student: 1 },
    ]) {
      expect((await createPlan(s.cookie, bad)).status, JSON.stringify(bad)).toBe(400)
    }
    for (let i = 0; i < 5; i++)
      expect((await createPlan(s.cookie, { date: today, note: `p${i}` })).status).toBe(201)
    expect((await createPlan(s.cookie, { date: today, note: 'sixth' })).status).toBe(400)
    const none = await student(null)
    expect((await createPlan(none.cookie, { date: today, note: 'x' })).status).toBe(403)
  })

  it('plans are closed to every CMS request, even for a Super Admin', async () => {
    const s = await student()
    await createPlan(s.cookie, { date: today, note: 'private' })
    const superAdmin = await asUser((await createAdmin('Super Admin')).admin)
    let status = 0
    try {
      await payload.find({ collection: 'study-plans', user: superAdmin, overrideAccess: false })
    } catch (err) {
      status = (err as { status?: number }).status ?? 500
    }
    expect(status).toBe(403)
  })
})
