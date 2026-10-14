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
