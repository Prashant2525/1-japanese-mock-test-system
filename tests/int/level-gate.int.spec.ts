import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { POST as attemptsRoute } from '@/app/api/v1/attempts/route'
import { POST as loginRoute } from '@/app/api/v1/auth/login/route'
import { PATCH as preferencesRoute } from '@/app/api/v1/me/preferences/route'
import { GET as meRoute } from '@/app/api/v1/me/route'
import { GET as resultsRoute } from '@/app/api/v1/results/route'
import { GET as materialsRoute } from '@/app/api/v1/study/materials/route'
import type { Student } from '@/payload-types'
import { currentStudentForPage, requireStudent } from '@/server/auth/session'

import {
  asUser,
  call,
  client,
  cookieFrom,
  createAdmin,
  createStudent,
  resetRateLimits,
  uniqueIp,
} from './helpers'

/**
 * Phase 10: the level gate on the server (LD-R01, LD-R02, PB §16.2 #1–3). Every request below
 * carries a real session cookie; nothing in the URL, body or browser can open the gate.
 */
let payload: Payload
const levelIds = new Map<string, number>()

beforeAll(async () => {
  payload = await client()
  const levels = await payload.find({
    collection: 'levels',
    where: { 'examType.code': { equals: 'JLPT' } },
    pagination: false,
    depth: 0,
  })
  for (const l of levels.docs) levelIds.set(l.code, l.id)
})

beforeEach(async () => {
  await resetRateLimits()
})

type GateState = Pick<Student, 'determinationStatus'> & { level?: string | null }

/** Puts a student into a level-check state directly (Phase 11's service will do this for real). */
async function setGate(student: Student, state: GateState) {
  await payload.db.updateOne({
    collection: 'students',
    id: student.id,
    data: {
      determinationStatus: state.determinationStatus,
      assignedLevel: state.level ? levelIds.get(state.level) : null,
      assignedAt: state.level ? new Date().toISOString() : null,
    },
    returning: false,
  })
}

async function signedIn(state: GateState) {
  const { student, email, password } = await createStudent()
  await setGate(student, state)
  const res = await call(loginRoute, '/api/v1/auth/login', {
    body: { email, password },
    ip: uniqueIp(),
  })
  expect(res.status).toBe(200)
  return { student, cookie: cookieFrom(res), login: (await res.json()) as { student: unknown } }
}

const gated = (cookie?: string, body: unknown = { mockTestId: 1 }) => ({
  materials: () => call(materialsRoute, '/api/v1/study/materials', { cookie }),
  results: () => call(resultsRoute, '/api/v1/results', { cookie }),
  attempt: () => call(attemptsRoute, '/api/v1/attempts', { cookie, body }),
})

async function errorOf(res: Response) {
  return ((await res.json()) as { error: { code: string; details: unknown } }).error
}

describe('without a session', () => {
  it('every gated endpoint answers 401', async () => {
    const api = gated(undefined)
    for (const res of [await api.materials(), await api.results(), await api.attempt()]) {
      expect(res.status).toBe(401)
    }
  })
})

describe.each([
  ['not started', { determinationStatus: 'not_started' as const }],
  ['in progress', { determinationStatus: 'in_progress' as const }],
  [
    'in progress with a level left over',
    { determinationStatus: 'in_progress' as const, level: 'N4' },
  ],
  ['completed but no level (fails closed)', { determinationStatus: 'completed' as const }],
])('a student whose level check is %s', (_label, state) => {
  it('is refused study materials, results and mock-test attempts with LEVEL_NOT_DETERMINED', async () => {
    const { cookie } = await signedIn(state)
    const api = gated(cookie)
    for (const res of [await api.materials(), await api.results(), await api.attempt()]) {
      expect(res.status).toBe(403)
      expect(await errorOf(res)).toMatchObject({
        code: 'LEVEL_NOT_DETERMINED',
        details: { nextStep: 'level_check' },
      })
    }
  })
})

describe('bypass attempts', () => {
  it('a forged body claiming a level or completion changes nothing', async () => {
    const { cookie } = await signedIn({ determinationStatus: 'not_started' })
    const forged = gated(cookie, {
      mockTestId: 1,
      determinationStatus: 'completed',
      assignedLevel: levelIds.get('N1'),
      studentId: 1,
    })
    const res = await forged.attempt()
    expect(res.status).toBe(403)
    expect((await errorOf(res)).code).toBe('LEVEL_NOT_DETERMINED')
  })

  it('a student cannot mark their own level check complete through the preferences API', async () => {
    const { cookie } = await signedIn({ determinationStatus: 'not_started' })
    const res = await call(preferencesRoute, '/api/v1/me/preferences', {
      cookie,
      method: 'PATCH',
      body: { preferredLocale: 'ja', determinationStatus: 'completed' },
    })
    expect(res.status).toBe(400)
  })

  it('a student cannot change their own record through the CMS API', async () => {
    const { student } = await signedIn({ determinationStatus: 'not_started' })
    await expect(
      payload.update({
        collection: 'students',
        id: student.id,
        data: { determinationStatus: 'completed', assignedLevel: levelIds.get('N1') },
        user: { ...student, collection: 'students' },
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
    const after = await payload.findByID({ collection: 'students', id: student.id })
    expect(after.determinationStatus).toBe('not_started')
    expect(after.assignedLevel ?? null).toBeNull()
  })

  it('even an admin edit through the CMS cannot set the level fields (services only)', async () => {
    const { student } = await signedIn({ determinationStatus: 'not_started' })
    const asAdmin = await asUser((await createAdmin('Super Admin')).admin)
    await payload.update({
      collection: 'students',
      id: student.id,
      data: { determinationStatus: 'completed', assignedLevel: levelIds.get('N3'), name: 'Edited' },
      user: asAdmin,
      overrideAccess: false,
    })
    const after = await payload.findByID({ collection: 'students', id: student.id })
    expect(after.name).toBe('Edited')
    expect(after.determinationStatus).toBe('not_started')
    expect(after.assignedLevel ?? null).toBeNull()
  })
})

describe('a student with an assigned level', () => {
  it('passes the gate; the areas answer with their real state', async () => {
    const { cookie } = await signedIn({ determinationStatus: 'completed', level: 'N4' })
    const api = gated(cookie)
    const materials = await api.materials()
    expect(materials.status).toBe(200)
    // The library itself is covered in study.int.spec.ts; here only the gate and the shape.
    const body = (await materials.json()) as { docs: unknown[]; page: number; filters: unknown }
    expect(Array.isArray(body.docs)).toBe(true)
    expect(body.page).toBe(1)
    expect(body.filters).toBeDefined()
    expect((await api.results()).status).toBe(200)
    const attempt = await api.attempt()
    expect(attempt.status).toBe(404)
    expect((await gated(cookie, { mockTestId: 'x' }).attempt()).status).toBe(400)
  })

  it('loses access at once when suspended', async () => {
    const { student, cookie } = await signedIn({ determinationStatus: 'completed', level: 'N5' })
    await payload.db.updateOne({
      collection: 'students',
      id: student.id,
      data: { status: 'suspended' },
      returning: false,
    })
    const res = await gated(cookie).materials()
    expect([401, 403]).toContain(res.status)
  })

  it('loses access at once when the level check is reset (stale tabs re-check every request)', async () => {
    const { student, cookie } = await signedIn({ determinationStatus: 'completed', level: 'N4' })
    expect((await gated(cookie).results()).status).toBe(200)
    await setGate(student, { determinationStatus: 'not_started' })
    expect((await gated(cookie).results()).status).toBe(403)
  })
})

describe('where the student belongs (login and /me)', () => {
  it('a new student is sent to the level check', async () => {
    const { cookie, login } = await signedIn({ determinationStatus: 'not_started' })
    expect(login.student).toMatchObject({ nextStep: 'level_check', assignedLevel: null })
    const me = (await (await call(meRoute, '/api/v1/me', { cookie })).json()) as {
      student: unknown
    }
    expect(me.student).toMatchObject({ nextStep: 'level_check', assignedLevel: null })
  })

  it('a returning student with a level goes home, and sees the level code', async () => {
    const { cookie, login } = await signedIn({ determinationStatus: 'completed', level: 'N4' })
    expect(login.student).toMatchObject({ nextStep: 'home', assignedLevel: { code: 'N4' } })
    const me = (await (await call(meRoute, '/api/v1/me', { cookie })).json()) as {
      student: unknown
    }
    expect(me.student).toMatchObject({ nextStep: 'home', assignedLevel: { code: 'N4' } })
  })
})

describe('database integrity', () => {
  it('a level held by a student cannot be deleted', async () => {
    const { student } = await signedIn({ determinationStatus: 'completed', level: 'N2' })
    await expect(
      payload.delete({ collection: 'levels', id: levelIds.get('N2')!, overrideAccess: true }),
    ).rejects.toThrow()
    await setGate(student, { determinationStatus: 'not_started' })
  })
})

describe('arriving from another site (KI-29: the return from Google, links in emails)', () => {
  const crossSite = (cookie: string, mode: string, dest: string) =>
    new Headers({
      cookie,
      'sec-fetch-site': 'cross-site',
      'sec-fetch-mode': mode,
      'sec-fetch-dest': dest,
    })

  it('a page load from another site still knows the signed-in student', async () => {
    const { student, cookie } = await signedIn({ determinationStatus: 'not_started' })
    const found = await currentStudentForPage(crossSite(cookie, 'navigate', 'document'))
    expect(found?.id).toBe(student.id)
  })

  it('the API stays strict: a cross-site request is not signed in', async () => {
    const { cookie } = await signedIn({ determinationStatus: 'not_started' })
    await expect(requireStudent(crossSite(cookie, 'cors', 'empty'))).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    })
    await expect(requireStudent(crossSite(cookie, 'navigate', 'document'))).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    })
  })

  it('a cross-site embed or form post does not get the session either', async () => {
    const { cookie } = await signedIn({ determinationStatus: 'not_started' })
    expect(await currentStudentForPage(crossSite(cookie, 'navigate', 'iframe'))).toBeNull()
    const post = crossSite(cookie, 'navigate', 'document')
    post.set('origin', 'https://evil.example')
    expect(await currentStudentForPage(post)).toBeNull()
  })
})
