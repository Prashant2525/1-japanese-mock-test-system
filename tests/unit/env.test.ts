import { describe, expect, it } from 'vitest'

import { EnvValidationError, parseEnv } from '@/server/env'

const valid = {
  APP_URL: 'http://localhost:3000',
  DATABASE_URL: 'postgres://user:pass@localhost:5433/db',
  PAYLOAD_SECRET: 'a'.repeat(64),
}

describe('parseEnv', () => {
  it('accepts a valid environment and applies defaults', () => {
    const env = parseEnv(valid)
    expect(env.NODE_ENV).toBe('development')
    expect(env.LOG_LEVEL).toBe('info')
    expect(env.DATABASE_POOL_MAX).toBe(10)
  })

  it('treats empty lines in .env as not set', () => {
    const env = parseEnv({
      ...valid,
      RESEND_API_KEY: '',
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
    })
    expect(env.RESEND_API_KEY).toBeUndefined()
    expect(env.GOOGLE_CLIENT_ID).toBeUndefined()
  })

  it('needs both Google values or neither', () => {
    const google = {
      GOOGLE_CLIENT_ID: '123-abc.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: 's',
    }
    expect(parseEnv({ ...valid, ...google }).GOOGLE_CLIENT_ID).toBe(google.GOOGLE_CLIENT_ID)
    expect(() => parseEnv({ ...valid, GOOGLE_CLIENT_ID: google.GOOGLE_CLIENT_ID })).toThrow(
      /GOOGLE_CLIENT_SECRET must be set together/,
    )
    expect(() => parseEnv({ ...valid, GOOGLE_CLIENT_SECRET: 's' })).toThrow(
      /GOOGLE_CLIENT_ID must be set together/,
    )
    expect(() => parseEnv({ ...valid, ...google, GOOGLE_CLIENT_ID: 'wrong' })).toThrow(
      /GOOGLE_CLIENT_ID must end with/,
    )
  })

  it('coerces DATABASE_POOL_MAX from a string', () => {
    expect(parseEnv({ ...valid, DATABASE_POOL_MAX: '25' }).DATABASE_POOL_MAX).toBe(25)
  })

  it('reports every missing required variable by name', () => {
    try {
      parseEnv({})
      expect.unreachable()
    } catch (err) {
      expect(err).toBeInstanceOf(EnvValidationError)
      const problems = (err as EnvValidationError).problems.join('\n')
      expect(problems).toContain('APP_URL is required')
      expect(problems).toContain('DATABASE_URL is required')
      expect(problems).toContain('PAYLOAD_SECRET is required')
    }
  })

  it('rejects a short PAYLOAD_SECRET without printing its value', () => {
    const secret = 'short-secret-value'
    try {
      parseEnv({ ...valid, PAYLOAD_SECRET: secret })
      expect.unreachable()
    } catch (err) {
      expect((err as Error).message).toContain('PAYLOAD_SECRET must be at least 32 characters')
      expect((err as Error).message).not.toContain(secret)
    }
  })

  it('rejects a non-postgres DATABASE_URL', () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: 'mongodb://localhost/db' })).toThrow(
      /DATABASE_URL must be a postgres/,
    )
  })

  it('rejects an out-of-range pool size', () => {
    expect(() => parseEnv({ ...valid, DATABASE_POOL_MAX: '0' })).toThrow(EnvValidationError)
  })
})

describe('parseEnv email and proxy rules', () => {
  it('defaults to the console email transport and an untrusted proxy', () => {
    const env = parseEnv(valid)
    expect(env.EMAIL_TRANSPORT).toBe('console')
    expect(env.TRUST_PROXY).toBe(false)
  })

  it('requires RESEND_API_KEY for the resend transport', () => {
    expect(() => parseEnv({ ...valid, EMAIL_TRANSPORT: 'resend' })).toThrow(
      /RESEND_API_KEY is required/,
    )
  })

  it('requires resend and a real sender when APP_ENV=production (not merely a production build)', () => {
    expect(() => parseEnv({ ...valid, NODE_ENV: 'production' })).not.toThrow()
    try {
      parseEnv({ ...valid, APP_ENV: 'production' })
      expect.unreachable()
    } catch (err) {
      const msg = (err as Error).message
      expect(msg).toContain('EMAIL_TRANSPORT must be "resend" when APP_ENV=production')
      expect(msg).toContain('EMAIL_FROM_ADDRESS must be a real')
    }
    expect(() =>
      parseEnv({
        ...valid,
        APP_ENV: 'production',
        EMAIL_TRANSPORT: 'resend',
        RESEND_API_KEY: 're_test_placeholder',
        EMAIL_FROM_ADDRESS: 'no-reply@nihongomock.com',
      }),
    ).not.toThrow()
  })
})
