import { z } from 'zod'

/**
 * Server environment, validated once at startup (TSR-10).
 * Error messages name the variables that are wrong, never their values.
 */
const booleanFlag = z
  .enum(['true', 'false', '1', '0'])
  .default('false')
  .transform((v) => v === 'true' || v === '1')

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    // Where this instance is deployed. NODE_ENV only says how the code was built (next build is always production).
    APP_ENV: z.enum(['local', 'test', 'staging', 'production']).default('local'),
    APP_URL: z.url(),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    DATABASE_URL: z
      .string()
      .regex(/^postgres(ql)?:\/\//, 'must be a postgres:// connection string'),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
    PAYLOAD_SECRET: z.string().min(32, 'must be at least 32 characters'),
    // Trust X-Forwarded-For for client IPs (set to true only behind your own reverse proxy).
    TRUST_PROXY: booleanFlag,
    // Email: "resend" in production; "console" prints emails in development; "memory" for tests.
    EMAIL_TRANSPORT: z.enum(['resend', 'console', 'memory']).default('console'),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM_ADDRESS: z.email().default('no-reply@nihongomock.invalid'),
    EMAIL_FROM_NAME: z.string().min(1).default('Nihongo Mock'),
    // "Continue with Google" (D-066). Both set = available; both empty = button hidden.
    GOOGLE_CLIENT_ID: z
      .string()
      .regex(/\.apps\.googleusercontent\.com$/, 'must end with .apps.googleusercontent.com')
      .optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  })
  .superRefine((env, ctx) => {
    if (Boolean(env.GOOGLE_CLIENT_ID) !== Boolean(env.GOOGLE_CLIENT_SECRET)) {
      ctx.addIssue({
        code: 'custom',
        path: [env.GOOGLE_CLIENT_ID ? 'GOOGLE_CLIENT_SECRET' : 'GOOGLE_CLIENT_ID'],
        message: 'must be set together with the other Google value (or leave both empty)',
      })
    }
    if (env.EMAIL_TRANSPORT === 'resend' && !env.RESEND_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['RESEND_API_KEY'],
        message: 'is required when EMAIL_TRANSPORT=resend',
      })
    }
    if (env.APP_ENV === 'production' && env.EMAIL_TRANSPORT !== 'resend') {
      ctx.addIssue({
        code: 'custom',
        path: ['EMAIL_TRANSPORT'],
        message: 'must be "resend" when APP_ENV=production',
      })
    }
    if (env.APP_ENV === 'production' && env.EMAIL_FROM_ADDRESS.endsWith('.invalid')) {
      ctx.addIssue({
        code: 'custom',
        path: ['EMAIL_FROM_ADDRESS'],
        message: 'must be a real, verified sender address when APP_ENV=production',
      })
    }
  })

export type Env = z.infer<typeof envSchema>

export class EnvValidationError extends Error {
  constructor(readonly problems: string[]) {
    super(`Invalid environment configuration:\n${problems.map((p) => `  - ${p}`).join('\n')}`)
    this.name = 'EnvValidationError'
  }
}

export function parseEnv(source: Record<string, string | undefined>): Env {
  // An empty line in .env (e.g. `GOOGLE_CLIENT_ID=`) means "not set", not "set to nothing".
  const cleaned = Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, value === '' ? undefined : value]),
  )
  const result = envSchema.safeParse(cleaned)
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
