import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { PUT as saveRoute } from '@/app/api/v1/attempts/[id]/answers/[questionKey]/route'
import { POST as resumeRoute } from '@/app/api/v1/attempts/[id]/resume/route'
import { GET as attemptRoute } from '@/app/api/v1/attempts/[id]/route'
import { POST as submitRoute } from '@/app/api/v1/attempts/[id]/submit/route'
import { POST as loginRoute } from '@/app/api/v1/auth/login/route'
import { GET as stateRoute } from '@/app/api/v1/determination/route'
import { POST as stageRoute } from '@/app/api/v1/determination/stages/current/attempt/route'
import { POST as startRoute } from '@/app/api/v1/determination/start/route'
import { GET as summaryRoute } from '@/app/api/v1/determination/summary/route'
import { GET as resultsRoute } from '@/app/api/v1/results/route'
import { GET as materialsRoute } from '@/app/api/v1/study/materials/route'
import { levelAdminEndpoints } from '@/server/level-check/admin'

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
 * Phase 11: the N5-first level check end to end (PB §16.2, LD-R03..R13, D-008..D-013), through the
 * real routes, services, database constraints and the published snapshot.
 */
let payload: Payload
let superAdmin: Awaited<ReturnType<typeof asUser>>
let editor: Awaited<ReturnType<typeof asUser>>
let support: Awaited<ReturnType<typeof asUser>>
const levelIds = new Map<string, number>()
const created: { questions: number[] } = { questions: [] }

/** Questions per level: the correct answer is always "A". */
const questionIds = new Map<string, number[]>()

async function makeQuestion(levelCode: string, n: number, publish = true) {
  const jlpt = (
    await payload.find({ collection: 'exam-types', where: { code: { equals: 'JLPT' } } })
  ).docs[0]!
  const q = await payload.create({
    collection: 'questions',
    draft: !publish,
    data: {
      examType: jlpt.id,
      level: levelIds.get(levelCode)!,
      stem: `${levelCode} test question ${n}: {日本|にほん}`,
      options: [
        { key: 'A', text: 'right' },
        { key: 'B', text: 'wrong 1' },
        { key: 'C', text: 'wrong 2' },
      ],
      correctOptionKey: 'A',
      explanation: `Explanation ${levelCode}-${n}`,
      marks: 1,
      rightsConfirmed: true,
      _status: publish ? 'published' : 'draft',
    },
  })
  created.questions.push(q.id)
  return q.id
}

type StageSpec = { code: string; threshold?: number; minutes?: number; questions?: number[] }

async function publish(stages: StageSpec[], user?: unknown) {
  return payload.updateGlobal({
    slug: 'level-check-settings',
    data: {
      _status: 'published',
      stages: stages.map((s) => ({
        level: levelIds.get(s.code)!,
        thresholdPercent: s.threshold ?? 60,
        durationMinutes: s.minutes ?? 20,
        questions: s.questions ?? questionIds.get(s.code)!,
      })),
    },
    // Payload checks relationship filters with the caller's access, so publish as a real admin.
    user: user ?? superAdmin,
    overrideAccess: false,
  })
}

const STANDARD: StageSpec[] = [{ code: 'N5' }, { code: 'N4' }, { code: 'N3' }]

async function signedInStudent() {
  const { student, email, password } = await createStudent()
  const res = await call(loginRoute, '/api/v1/auth/login', {
    body: { email, password },
    ip: uniqueIp(),
  })
  return { student, cookie: cookieFrom(res) }
}

const ctx = (params: Record<string, string>) => ({ params: Promise.resolve(params) })
const json = async <T>(res: Response) => (await res.json()) as T

/** Calls a route with `[id]`-style params. */
async function callWith(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- route handlers differ in param shape
  handler: (req: Request, c: any) => Promise<Response>,
  path: string,
  params: Record<string, string>,
  opts: { cookie: string; body?: unknown; method?: string },
) {
  const headers = new Headers({
    'content-type': 'application/json',
    cookie: opts.cookie,
    'sec-fetch-site': 'same-origin',
  })
  return handler(
    new Request(`http://localhost:3000${path}`, {
      method: opts.method ?? (opts.body === undefined ? 'GET' : 'POST'),
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    }),
    ctx(params),
  )
}

/** Starts (if needed) and opens the current stage: returns the attempt ID and this tab's session. */
async function openStage(cookie: string) {
  await call(startRoute, '/api/v1/determination/start', { cookie, body: {} })
  const stage = await json<{ attemptId: number }>(
    await call(stageRoute, '/api/v1/determination/stages/current/attempt', { cookie, body: {} }),
  )
  const id = String(stage.attemptId)
  const { sessionId } = await json<{ sessionId: string }>(
    await callWith(resumeRoute, `/api/v1/attempts/${id}/resume`, { id }, { cookie, body: {} }),
  )
  const attempt = await json<{ questions: { key: string }[] }>(
    await callWith(attemptRoute, `/api/v1/attempts/${id}`, { id }, { cookie }),
  )
  return { id, sessionId, keys: attempt.questions.map((q) => q.key) }
}

let seq = 1
async function answer(
  cookie: string,
  id: string,
  sessionId: string,
  key: string,
  optionKey: string | null,
) {
  return callWith(
    saveRoute,
    `/api/v1/attempts/${id}/answers/${key}`,
    { id, questionKey: key },
    { cookie, method: 'PUT', body: { optionKey, flagged: false, seq: seq++, sessionId } },
  )
}

/** Takes the current stage answering `right` questions correctly and the rest wrong, then submits. */
async function takeStage(cookie: string, right: number) {
  const { id, sessionId, keys } = await openStage(cookie)
  for (const [i, key] of keys.entries()) {
    const res = await answer(cookie, id, sessionId, key, i < right ? 'A' : 'B')
    expect(res.status).toBe(200)
  }
  const submit = await callWith(
    submitRoute,
    `/api/v1/attempts/${id}/submit`,
    { id },
    { cookie, body: {} },
  )
  expect(submit.status).toBe(200)
  return json<{ resultId: number; passed: boolean; next: unknown }>(submit)
}

async function studentRow(id: number) {
  return payload.findByID({ collection: 'students', id, depth: 1 })
}

beforeAll(async () => {
  payload = await client()
  superAdmin = await asUser((await createAdmin('Super Admin')).admin)
  editor = await asUser((await createAdmin('Content Editor')).admin)
  support = await asUser((await createAdmin('Support')).admin)
  const levels = await payload.find({
    collection: 'levels',
    where: { 'examType.code': { equals: 'JLPT' } },
    pagination: false,
    depth: 0,
  })
  for (const l of levels.docs) levelIds.set(l.code, l.id)
  for (const code of ['N5', 'N4', 'N3']) {
    questionIds.set(code, [
      await makeQuestion(code, 1),
      await makeQuestion(code, 2),
      await makeQuestion(code, 3),
    ])
  }
  await publish(STANDARD)
})

beforeEach(async () => {
  await resetRateLimits()
})

afterAll(async () => {
  // Leave the test database with a valid published configuration and no extra questions in use.
  await publish(STANDARD)
})

describe('publishing the level check (LD-R03, CMS-R05)', () => {
  it('freezes a numbered version with every question, answer and explanation', async () => {
    const before = await payload.find({
      collection: 'level-check-versions',
      sort: '-versionNo',
      limit: 1,
    })
    await publish([{ code: 'N5', threshold: 70 }, { code: 'N4' }, { code: 'N3' }])
    const after = await payload.find({
      collection: 'level-check-versions',
      sort: '-versionNo',
      limit: 1,
    })
    const v = after.docs[0]!
    expect(v.versionNo).toBe((before.docs[0]?.versionNo ?? 0) + 1)
    const snapshot = v.snapshot as {
      stages: {
        levelCode: string
        thresholdPercent: number
        questions: { correct: string; explanation: { en: string } }[]
      }[]
    }
    expect(snapshot.stages.map((s) => s.levelCode)).toEqual(['N5', 'N4', 'N3'])
    expect(snapshot.stages[0]!.thresholdPercent).toBe(70)
    expect(snapshot.stages[0]!.questions[0]).toMatchObject({
      correct: 'A',
      explanation: { en: 'Explanation N5-1' },
    })
    await publish(STANDARD)
  })

  it('publishing identical content creates no new version', async () => {
    await publish(STANDARD)
    const count = (await payload.count({ collection: 'level-check-versions' })).totalDocs
    await publish(STANDARD)
    expect((await payload.count({ collection: 'level-check-versions' })).totalDocs).toBe(count)
  })

  it.each([
    ['a stage missing (N5 → N3)', [{ code: 'N5' }, { code: 'N3' }]],
    ['not starting at N5', [{ code: 'N4' }, { code: 'N5' }, { code: 'N3' }]],
    [
      'a level not switched on (N2)',
      [{ code: 'N5' }, { code: 'N4' }, { code: 'N3' }, { code: 'N2', questions: [] }],
    ],
    ['a stage without questions', [{ code: 'N5', questions: [] }, { code: 'N4' }, { code: 'N3' }]],
  ])('refuses %s', async (_label, stages) => {
    await expect(publish(stages as StageSpec[])).rejects.toMatchObject({ status: 400 })
  })

  it('refuses draft questions and questions of another level', async () => {
    const draft = await makeQuestion('N5', 99, false)
    await expect(
      publish([{ code: 'N5', questions: [draft] }, { code: 'N4' }, { code: 'N3' }]),
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      publish([{ code: 'N5', questions: questionIds.get('N4') }, { code: 'N4' }, { code: 'N3' }]),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('a Content Editor can save drafts but only a role with determination.publish can publish', async () => {
    await expect(publish(STANDARD, editor)).rejects.toMatchObject({ status: 403 })
    await payload.updateGlobal({
      slug: 'level-check-settings',
      draft: true,
      data: { stages: [] },
      user: editor,
      overrideAccess: false,
    })
    await expect(publish(STANDARD, superAdmin)).resolves.toBeTruthy()
  })
})

describe('starting (PB §16.2 #1, #4)', () => {
  it('a new student starts at N5 and cannot choose a level', async () => {
    const { cookie } = await signedInStudent()
    const forged = await call(startRoute, '/api/v1/determination/start', {
      cookie,
      body: { level: 'N4' },
    })
    expect(forged.status).toBe(400)
    const res = await call(startRoute, '/api/v1/determination/start', { cookie, body: {} })
    const state = await json<{
      status: string
      currentStageIndex: number
      stages: { levelCode: string }[]
    }>(res)
    expect(state).toMatchObject({ status: 'in_progress', currentStageIndex: 0 })
    expect(state.stages.map((s) => s.levelCode)).toEqual(['N5', 'N4', 'N3'])
  })

  it('starting twice, or at the same moment, gives one session', async () => {
    const { student, cookie } = await signedInStudent()
    await Promise.all(
      Array.from({ length: 4 }, () =>
        call(startRoute, '/api/v1/determination/start', { cookie, body: {} }),
      ),
    )
    const sessions = await payload.count({
      collection: 'level-check-sessions',
      where: { student: { equals: student.id } },
    })
    expect(sessions.totalDocs).toBe(1)
  })

  it('the stage attempt is always the current stage, and asking again returns the same attempt', async () => {
    const { cookie } = await signedInStudent()
    const a = await openStage(cookie)
    const b = await openStage(cookie)
    expect(b.id).toBe(a.id)
    const view = await json<{ levelCode: string; stageIndex: number }>(
      await callWith(attemptRoute, `/api/v1/attempts/${a.id}`, { id: a.id }, { cookie }),
    )
    expect(view).toMatchObject({ levelCode: 'N5', stageIndex: 0 })
  })

  it('never sends correct answers or explanations during an attempt', async () => {
    const { cookie } = await signedInStudent()
    const { id } = await openStage(cookie)
    const text = await (
      await callWith(attemptRoute, `/api/v1/attempts/${id}`, { id }, { cookie })
    ).text()
    expect(text).not.toMatch(/"correct"|Explanation N5|explanation/)
  })
})

describe('every branch of the level check (LD-R04, LD-R05; PB §16.2 #5–7)', () => {
  it.each([
    ['fail N5 → N5 (Beginner)', [0], 'N5'],
    ['pass N5, fail N4 → N5', [3, 1], 'N5'],
    ['pass N5 and N4, fail N3 → N4', [3, 2, 0], 'N4'],
    ['pass N5, N4 and N3 → N3', [3, 3, 2], 'N3'],
  ])('%s', async (_label, rightAnswers, expected) => {
    const { student, cookie } = await signedInStudent()
    for (const [i, right] of rightAnswers.entries()) {
      const r = await takeStage(cookie, right)
      const last = i === rightAnswers.length - 1
      expect(r.next).toEqual(
        last ? { kind: 'done', levelCode: expected } : { kind: 'next', stageIndex: i + 1 },
      )
    }
    const row = await studentRow(student.id)
    expect(row.determinationStatus).toBe('completed')
    expect((row.assignedLevel as { code: string }).code).toBe(expected)
    const assignments = await payload.find({
      collection: 'level-assignments',
      where: { student: { equals: student.id } },
      depth: 1,
    })
    expect(assignments.docs.map((a) => [a.source, (a.level as { code: string }).code])).toEqual([
      ['determination', expected],
    ])
    const summary = await json<{ assignedLevel: { code: string }; stages: unknown[] }>(
      await call(summaryRoute, '/api/v1/determination/summary', { cookie }),
    )
    expect(summary.assignedLevel.code).toBe(expected)
    expect(summary.stages).toHaveLength(rightAnswers.length)
    // The level gate opens (LD-R02), and results list every stage.
    expect((await call(materialsRoute, '/api/v1/study/materials', { cookie })).status).toBe(200)
    const results = await json<{ totalDocs: number }>(
      await call(resultsRoute, '/api/v1/results', { cookie }),
    )
    expect(results.totalDocs).toBe(rightAnswers.length)
  })

  it('unanswered questions count as wrong', async () => {
    const { cookie } = await signedInStudent()
    const { id, sessionId, keys } = await openStage(cookie)
    await answer(cookie, id, sessionId, keys[0]!, 'A')
    const submit = await json<{ passed: boolean; percent: number }>(
      await callWith(submitRoute, `/api/v1/attempts/${id}/submit`, { id }, { cookie, body: {} }),
    )
    expect(submit).toMatchObject({ passed: false, percent: 33.33 })
  })

  it('compares with the pass mark exactly (2/3 = 66.666…% fails at 66.67%, passes at 66.66%)', async () => {
    await publish([{ code: 'N5', threshold: 66.67 }, { code: 'N4' }, { code: 'N3' }])
    const first = await signedInStudent()
    expect((await takeStage(first.cookie, 2)).passed).toBe(false)
    await publish([{ code: 'N5', threshold: 66.66 }, { code: 'N4' }, { code: 'N3' }])
    const second = await signedInStudent()
    expect((await takeStage(second.cookie, 2)).passed).toBe(true)
    await publish(STANDARD)
  })

  it('after completion the student goes home and cannot run it again (PB §16.2 #8)', async () => {
    const { cookie } = await signedInStudent()
    await takeStage(cookie, 0)
    const again = await call(startRoute, '/api/v1/determination/start', { cookie, body: {} })
    expect(again.status).toBe(409)
    const state = await json<{ status: string }>(
      await call(stateRoute, '/api/v1/determination', { cookie }),
    )
    expect(state.status).toBe('completed')
    expect(
      (await call(stageRoute, '/api/v1/determination/stages/current/attempt', { cookie, body: {} }))
        .status,
    ).toBe(409)
  })
})

describe('submitting is idempotent and race-safe (PB §16.2 #9)', () => {
  it('submitting twice returns the same result', async () => {
    const { cookie } = await signedInStudent()
    const { id } = await openStage(cookie)
    const a = await json<{ resultId: number }>(
      await callWith(submitRoute, `/x`, { id }, { cookie, body: {} }),
    )
    const b = await json<{ resultId: number }>(
      await callWith(submitRoute, `/x`, { id }, { cookie, body: {} }),
    )
    expect(b.resultId).toBe(a.resultId)
  })

  it('five submits at the same moment create one result and one level assignment', async () => {
    const { student, cookie } = await signedInStudent()
    const { id } = await openStage(cookie)
    const all = await Promise.all(
      Array.from({ length: 5 }, () =>
        callWith(submitRoute, `/x`, { id }, { cookie, body: {} }).then((r) =>
          json<{ resultId: number }>(r),
        ),
      ),
    )
    expect(new Set(all.map((r) => r.resultId)).size).toBe(1)
    expect(
      (await payload.count({ collection: 'results', where: { student: { equals: student.id } } }))
        .totalDocs,
    ).toBe(1)
    expect(
      (
        await payload.count({
          collection: 'level-assignments',
          where: { student: { equals: student.id } },
        })
      ).totalDocs,
    ).toBe(1)
  })
})

describe('saving answers', () => {
  it('saves, ignores late older saves, and refuses another tab after a takeover (D-027)', async () => {
    const { cookie } = await signedInStudent()
    const { id, sessionId, keys } = await openStage(cookie)
    expect(await json(await answer(cookie, id, sessionId, keys[0]!, 'B'))).toEqual({ saved: true })
    // A late save with a lower sequence number does not overwrite the newer one.
    const late = await callWith(
      saveRoute,
      '/x',
      { id, questionKey: keys[0]! },
      { cookie, method: 'PUT', body: { optionKey: 'C', flagged: false, seq: 1, sessionId } },
    )
    expect(await json(late)).toEqual({ saved: false })
    const view = await json<{ answers: Record<string, { o: string }> }>(
      await callWith(attemptRoute, '/x', { id }, { cookie }),
    )
    expect(view.answers[keys[0]!]!.o).toBe('B')
    // Another tab takes over; the old tab is told so.
    await callWith(resumeRoute, '/x', { id }, { cookie, body: {} })
    const stale = await answer(cookie, id, sessionId, keys[1]!, 'A')
    expect(stale.status).toBe(409)
    expect((await json<{ error: { code: string } }>(stale)).error.code).toBe('STALE_SESSION')
  })

  it('refuses unknown options, other students and a submitted attempt', async () => {
    const { cookie } = await signedInStudent()
    const { id, sessionId, keys } = await openStage(cookie)
    expect((await answer(cookie, id, sessionId, keys[0]!, 'F')).status).toBe(400)
    const other = await signedInStudent()
    expect((await callWith(attemptRoute, '/x', { id }, { cookie: other.cookie })).status).toBe(404)
    expect((await answer(other.cookie, id, sessionId, keys[0]!, 'A')).status).toBe(404)
    await callWith(submitRoute, '/x', { id }, { cookie, body: {} })
    expect((await answer(cookie, id, sessionId, keys[0]!, 'A')).status).toBe(410)
  })
})

describe('time limits (D-010)', () => {
  it('reopening a stage keeps the original deadline', async () => {
    const { cookie } = await signedInStudent()
    await call(startRoute, '/api/v1/determination/start', { cookie, body: {} })
    const a = await json<{ deadlineAt: string }>(await call(stageRoute, '/x', { cookie, body: {} }))
    await new Promise((r) => setTimeout(r, 50))
    const b = await json<{ deadlineAt: string }>(await call(stageRoute, '/x', { cookie, body: {} }))
    expect(b.deadlineAt).toBe(a.deadlineAt)
  })

  it('an expired stage is submitted automatically; answers saved in time still count', async () => {
    const { cookie } = await signedInStudent()
    const { id, sessionId, keys } = await openStage(cookie)
    for (const key of keys) await answer(cookie, id, sessionId, key, 'A')
    await payload.db.drizzle.execute(
      sql`UPDATE attempts SET deadline_at = now() - interval '1 minute' WHERE id = ${Number(id)}`,
    )
    expect((await answer(cookie, id, sessionId, keys[0]!, 'B')).status).toBe(410)
    const view = await json<{ status: string; submitReason: string }>(
      await callWith(attemptRoute, '/x', { id }, { cookie }),
    )
    expect(view).toMatchObject({ status: 'submitted', submitReason: 'timeout' })
    const state = await json<{ currentStageIndex: number; outcomes: { passed: boolean }[] }>(
      await call(stateRoute, '/x', { cookie }),
    )
    expect(state.outcomes[0]!.passed).toBe(true)
    expect(state.currentStageIndex).toBe(1)
  })
})

describe('history never changes (TSR-05)', () => {
  it('editing a question after publishing does not change a running attempt', async () => {
    const { cookie } = await signedInStudent()
    const { id } = await openStage(cookie)
    const firstId = questionIds.get('N5')![0]!
    await payload.update({ collection: 'questions', id: firstId, data: { stem: 'EDITED STEM' } })
    const text = await (await callWith(attemptRoute, '/x', { id }, { cookie })).text()
    expect(text).not.toContain('EDITED STEM')
    await payload.update({
      collection: 'questions',
      id: firstId,
      data: { stem: 'N5 test question 1: {日本|にほん}' },
    })
  })
})

describe('admin reset and override (D-013, LD-R11)', () => {
  const [resetEndpoint, overrideEndpoint] = levelAdminEndpoints
  const adminCall = (
    endpoint: (typeof levelAdminEndpoints)[number],
    user: unknown,
    studentId: number,
    body: unknown,
  ) =>
    endpoint.handler({
      payload,
      user,
      routeParams: { id: String(studentId) },
      json: async () => body,
    } as never)

  it('reset sends the student back to the start, with a reason and an audit entry', async () => {
    const { student, cookie } = await signedInStudent()
    await takeStage(cookie, 0)
    expect((await adminCall(resetEndpoint!, superAdmin, student.id, { reason: 'no' })).status).toBe(
      400,
    )
    const res = await adminCall(resetEndpoint!, superAdmin, student.id, {
      reason: 'Student asked to retake',
    })
    expect(res.status).toBe(200)
    const row = await studentRow(student.id)
    expect([row.determinationStatus, row.assignedLevel ?? null]).toEqual(['not_started', null])
    expect((await call(materialsRoute, '/x', { cookie })).status).toBe(403)
    const audit = await payload.find({
      collection: 'audit-events',
      where: {
        and: [
          { action: { equals: 'level_check.reset' } },
          { entityId: { equals: String(student.id) } },
        ],
      },
    })
    expect(audit.docs[0]?.summary).toBe('Student asked to retake')
    // They can take it again from N5.
    const state = await json<{ currentStageIndex: number }>(
      await call(startRoute, '/x', { cookie, body: {} }),
    )
    expect(state.currentStageIndex).toBe(0)
  })

  it('override sets the level directly; only roles with the permission may do it', async () => {
    const { student } = await signedInStudent()
    const body = { levelId: levelIds.get('N2'), reason: 'Holds a JLPT N2 certificate' }
    expect((await adminCall(overrideEndpoint!, editor, student.id, body)).status).toBe(403)
    expect((await adminCall(overrideEndpoint!, support, student.id, body)).status).toBe(403)
    expect(
      (await adminCall(resetEndpoint!, support, student.id, { reason: 'trying' })).status,
    ).toBe(403)
    expect((await adminCall(overrideEndpoint!, superAdmin, student.id, body)).status).toBe(200)
    const row = await studentRow(student.id)
    expect(row.determinationStatus).toBe('completed')
    expect((row.assignedLevel as { code: string }).code).toBe('N2')
    const history = await payload.find({
      collection: 'level-assignments',
      where: { student: { equals: student.id } },
      depth: 1,
    })
    expect(history.docs[0]).toMatchObject({
      source: 'override',
      reason: 'Holds a JLPT N2 certificate',
    })
  })
})
