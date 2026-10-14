import { ZodError } from 'zod'

/** Stable error codes shared with clients (docs/API_DOCUMENTATION.md §3). Clients switch on `code`. */
export const ERROR_STATUS = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  SESSION_EXPIRED: 401,
  FORBIDDEN: 403,
  LEVEL_NOT_DETERMINED: 403,
  EMAIL_NOT_VERIFIED: 403,
  NOT_ENTITLED: 403,
  LEVEL_NOT_AVAILABLE: 403,
  NOT_FOUND: 404,
  STALE_SESSION: 409,
  ATTEMPT_ALREADY_ACTIVE: 409,
  ATTEMPT_LIMIT_REACHED: 409,
  ALREADY_FINALIZED: 409,
  STAGE_OUT_OF_ORDER: 409,
  ORDER_STATE_CONFLICT: 409,
  ATTEMPT_CLOSED: 410,
  PAYMENT_VERIFICATION_FAILED: 422,
  AMOUNT_MISMATCH: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,
} as const

export type ErrorCode = keyof typeof ERROR_STATUS

/**
 * Default English messages. Phase 8 routes these through the UI-label catalogue
 * so the CMS can override and translate them (D-030).
 */
const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_FAILED: 'Some fields are invalid. Check them and try again.',
  UNAUTHENTICATED: 'Log in to continue.',
  SESSION_EXPIRED: 'Your session has expired. Log in again.',
  FORBIDDEN: 'You do not have permission to do this.',
  LEVEL_NOT_DETERMINED: 'Finish the level check to unlock this.',
  EMAIL_NOT_VERIFIED: 'Verify your email address to continue.',
  NOT_ENTITLED: 'You do not have access to this test yet.',
  LEVEL_NOT_AVAILABLE: 'This level is not available.',
  NOT_FOUND: 'We could not find what you were looking for.',
  STALE_SESSION: 'This test continues in another tab or device.',
  ATTEMPT_ALREADY_ACTIVE: 'You already have this test in progress.',
  ATTEMPT_LIMIT_REACHED: 'You have used all attempts for this test.',
  ALREADY_FINALIZED: 'This test has already been submitted.',
  STAGE_OUT_OF_ORDER: 'Complete the current stage first.',
  ORDER_STATE_CONFLICT: 'This order can no longer be changed.',
  ATTEMPT_CLOSED: 'This test has ended. Your answers were submitted.',
  PAYMENT_VERIFICATION_FAILED: 'We could not verify this payment.',
  AMOUNT_MISMATCH: 'The payment amount does not match the order.',
  RATE_LIMITED: 'Too many requests. Wait a moment and try again.',
  INTERNAL: 'Something went wrong on our side. Try again in a moment.',
}

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message?: string,
    readonly details?: unknown,
  ) {
    super(message ?? DEFAULT_MESSAGES[code])
    this.name = 'AppError'
  }

  get status(): number {
    return ERROR_STATUS[this.code]
  }
}

export type ErrorBody = {
  error: { code: ErrorCode; message: string; details: unknown; requestId: string }
}

export type FieldIssue = { path: string; message: string }

/**
 * Converts any thrown value into the public error shape.
 * Unknown errors become INTERNAL with no internal detail exposed.
 */
export function toErrorBody(err: unknown, requestId: string): { status: number; body: ErrorBody } {
  if (err instanceof AppError) {
    return {
      status: err.status,
      body: {
        error: { code: err.code, message: err.message, details: err.details ?? null, requestId },
      },
    }
  }
  if (err instanceof ZodError) {
    const details: FieldIssue[] = err.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }))
    return {
      status: 400,
      body: {
        error: {
          code: 'VALIDATION_FAILED',
          message: DEFAULT_MESSAGES.VALIDATION_FAILED,
          details,
          requestId,
        },
      },
    }
  }
  return {
    status: 500,
    body: {
      error: { code: 'INTERNAL', message: DEFAULT_MESSAGES.INTERNAL, details: null, requestId },
    },
  }
}
