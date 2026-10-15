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

describe('page session headers (KI-29)', () => {
  const nav = (site: string, mode = 'navigate', dest = 'document') =>
    new Headers({ 'sec-fetch-site': site, 'sec-fetch-mode': mode, 'sec-fetch-dest': dest })

  it('lets a top-level page load from another site read the session', async () => {
    const { pageRequestHeaders } = await import('@/server/auth/session')
    expect(pageRequestHeaders(nav('cross-site')).get('sec-fetch-site')).toBe('same-site')
  })

  it.each([
    ['a cross-site fetch', nav('cross-site', 'cors', 'empty')],
    ['a cross-site iframe', nav('cross-site', 'navigate', 'iframe')],
    ['a same-origin request (unchanged)', nav('same-origin')],
  ])('leaves %s alone', async (_label, headers) => {
    const { pageRequestHeaders } = await import('@/server/auth/session')
    expect(pageRequestHeaders(headers).get('sec-fetch-site')).toBe(headers.get('sec-fetch-site'))
  })
})
