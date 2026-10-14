import { describe, expect, it } from 'vitest'

import { classifyLoginError } from '@/server/services/student-auth'

/** Errors as they arrive from another bundle copy of Payload: plain objects with a status. */
const foreign = (status: number, message = 'x') => Object.assign(new Error(message), { status })

describe('classifyLoginError (works without instanceof, D-065)', () => {
  it('401 on an unlocked account → INVALID_CREDENTIALS (also for the attempt that triggers the lock)', () => {
    expect(classifyLoginError(foreign(401), false)?.code).toBe('INVALID_CREDENTIALS')
  })

  it('401 on an account that was already locked → RATE_LIMITED', () => {
    expect(classifyLoginError(foreign(401), true)?.code).toBe('RATE_LIMITED')
  })

  it('403 → EMAIL_NOT_VERIFIED, or ACCOUNT_DISABLED from our suspension hook', () => {
    expect(classifyLoginError(foreign(403, 'Please verify your email'), false)?.code).toBe(
      'EMAIL_NOT_VERIFIED',
    )
    expect(classifyLoginError(foreign(403, 'ACCOUNT_DISABLED'), false)?.code).toBe(
      'ACCOUNT_DISABLED',
    )
  })

  it('anything else is not classified (becomes INTERNAL upstream)', () => {
    expect(classifyLoginError(new TypeError('boom'), false)).toBeNull()
    expect(classifyLoginError(foreign(500), false)).toBeNull()
  })
})
