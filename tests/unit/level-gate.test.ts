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
