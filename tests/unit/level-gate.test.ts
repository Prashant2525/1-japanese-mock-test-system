import { describe, expect, it } from 'vitest'

import { isAppError } from '@/server/http/errors'
import { hasDeterminedLevel, nextStepFor, requireDeterminedLevel } from '@/server/student/gate'

type Status = 'not_started' | 'in_progress' | 'completed'
const student = (determinationStatus: Status, assignedLevel: number | null) => ({
  determinationStatus,
  assignedLevel,
})

describe('level gate (LD-R01, LD-R02)', () => {
  it('opens only when the level check is complete AND a level is assigned', () => {
    expect(hasDeterminedLevel(student('completed', 3))).toBe(true)
    expect(nextStepFor(student('completed', 3))).toBe('home')
  })

  it.each([
    ['not started', student('not_started', null)],
    ['in progress', student('in_progress', null)],
    ['in progress with a stale level', student('in_progress', 3)],
    ['completed without a level (fails closed)', student('completed', null)],
  ])('stays closed when %s', (_label, s) => {
    expect(hasDeterminedLevel(s)).toBe(false)
    expect(nextStepFor(s)).toBe('level_check')
  })

  it('refuses with LEVEL_NOT_DETERMINED and tells the client where to go', () => {
    try {
      requireDeterminedLevel(student('not_started', null))
      expect.unreachable()
    } catch (err) {
      expect(isAppError(err)).toBe(true)
      expect(err).toMatchObject({
        code: 'LEVEL_NOT_DETERMINED',
        details: { nextStep: 'level_check' },
      })
    }
    expect(() => requireDeterminedLevel(student('completed', 1))).not.toThrow()
  })
})

describe('student session headers (KI-29, KI-32)', () => {
  const STUDENT = 'nm_student_session=student.jwt.token'
  const ADMIN = 'payload-token=admin.jwt.token'
  const req = (fields: Record<string, string>) => new Headers(fields)
  const nav = (site: string, mode = 'navigate', dest = 'document') => ({
    'sec-fetch-site': site,
    'sec-fetch-mode': mode,
    'sec-fetch-dest': dest,
  })

  it('uses only the student cookie, handed to Payload as a JWT header', async () => {
    const { studentAuthHeaders } = await import('@/server/auth/session')
    const h = studentAuthHeaders(req({ cookie: `${ADMIN}; ${STUDENT}`, ...nav('same-origin') }))
    expect(h?.get('authorization')).toBe('JWT student.jwt.token')
    expect(h?.get('cookie')).toBeNull()
  })

  it("never treats an admin's cookie as a student session", async () => {
    const { studentAuthHeaders } = await import('@/server/auth/session')
    expect(studentAuthHeaders(req({ cookie: ADMIN, ...nav('same-origin') }))).toBeNull()
  })

  it('accepts a mobile client token in the Authorization header', async () => {
    const { studentAuthHeaders } = await import('@/server/auth/session')
    expect(
      studentAuthHeaders(req({ authorization: 'JWT mobile.token' }))?.get('authorization'),
    ).toBe('JWT mobile.token')
  })

  it('a page load from another site may read the session; the API may not', async () => {
    const { studentAuthHeaders } = await import('@/server/auth/session')
    const fromGoogle = req({ cookie: STUDENT, ...nav('cross-site') })
    expect(studentAuthHeaders(fromGoogle, { page: true })).not.toBeNull()
    expect(studentAuthHeaders(fromGoogle)).toBeNull()
  })

  it.each([
    ['a cross-site fetch', { cookie: STUDENT, ...nav('cross-site', 'cors', 'empty') }],
    ['a cross-site iframe', { cookie: STUDENT, ...nav('cross-site', 'navigate', 'iframe') }],
    ['another origin', { cookie: STUDENT, origin: 'https://evil.example', ...nav('cross-site') }],
  ])('refuses %s, even for pages', async (_label, fields) => {
    const { studentAuthHeaders } = await import('@/server/auth/session')
    expect(studentAuthHeaders(req(fields), { page: true })).toBeNull()
  })
})

describe('leftover student token detection (KI-32)', () => {
  it('reads the collection claim of a session token without verifying it', async () => {
    const { tokenCollection } = await import('@/shared/session-cookies')
    const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url')
    expect(tokenCollection(`${b64({ alg: 'HS256' })}.${b64({ collection: 'students' })}.sig`)).toBe(
      'students',
    )
    expect(tokenCollection(`${b64({})}.${b64({ collection: 'admins' })}.sig`)).toBe('admins')
    expect(tokenCollection('garbage')).toBeNull()
    expect(tokenCollection(undefined)).toBeNull()
  })
})
