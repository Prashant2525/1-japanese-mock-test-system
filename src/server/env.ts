import { z } from 'zod'

/**
 * Server environment, validated once at startup (TSR-10).
 * Error messages name the variables that are wrong, never their values.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, 'must be a postgres:// connection string'),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  PAYLOAD_SECRET: z.string().min(32, 'must be at least 32 characters'),
})

export type Env = z.infer<typeof envSchema>

export class EnvValidationError extends Error {
  constructor(readonly problems: string[]) {
    super(`Invalid environment configuration:\n${problems.map((p) => `  - ${p}`).join('\n')}`)
    this.name = 'EnvValidationError'
  }
}

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source)
  if (result.success) return result.data
  const problems = result.error.issues.map((issue) => {
    const name = issue.path.join('.') || '(root)'
    const reason =
      issue.code === 'invalid_type' && issue.input === undefined ? 'is required' : issue.message
    return `${name} ${reason}`
  })
  throw new EnvValidationError(problems)
}

let cached: Env | undefined

/** Validated environment. Throws EnvValidationError on first access if anything is missing or malformed. */
export function getEnv(): Env {
  cached ??= parseEnv(process.env)
  return cached
}
