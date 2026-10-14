import pino from 'pino'

/**
 * Structured JSON logger. Secrets and personal data are redacted (ARCHITECTURE §9).
 * Log user IDs, never emails.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'nihongo-mock' },
  redact: {
    paths: [
      'password',
      '*.password',
      'token',
      '*.token',
      'secret',
      '*.secret',
      'authorization',
      '*.authorization',
      'headers.cookie',
      'req.headers.cookie',
      'req.headers.authorization',
      'totpSecret',
      '*.totpSecret',
      'email',
      '*.email',
    ],
    censor: '[redacted]',
  },
})
