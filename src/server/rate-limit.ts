import { createHash } from 'node:crypto'

import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

import { AppError } from './http/errors'

export type RateLimitRule = { limit: number; windowSeconds: number }

/** Named limits (technical defaults; tune in Phase 26 load tests). */
export const RATE_LIMITS = {
  loginPerIp: { limit: 20, windowSeconds: 15 * 60 },
  loginPerAccount: { limit: 10, windowSeconds: 15 * 60 },
  registerPerIp: { limit: 10, windowSeconds: 60 * 60 },
  emailPerAccount: { limit: 3, windowSeconds: 15 * 60 },
  emailPerIp: { limit: 20, windowSeconds: 60 * 60 },
  verifyPerIp: { limit: 30, windowSeconds: 15 * 60 },
  // Counts both the start and the return from Google, so about 15 sign-ins per 15 minutes per IP.
  googlePerIp: { limit: 30, windowSeconds: 15 * 60 },
} satisfies Record<string, RateLimitRule>

/** Keys are hashed so the table never stores emails or IPs in clear text. */
function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

/**
 * Fixed-window counter in PostgreSQL (`rate_limits`, created by migration). Works across
 * multiple app instances without Redis (ARCHITECTURE §4). Returns seconds to wait, or 0.
 */
export async function consume(payload: Payload, key: string, rule: RateLimitRule): Promise<number> {
  const windowMs = rule.windowSeconds * 1000
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs)
  const result = await payload.db.drizzle.execute(sql`
    insert into rate_limits (key, window_start, count)
    values (${hashKey(key)}, ${windowStart.toISOString()}, 1)
    on conflict (key, window_start) do update set count = rate_limits.count + 1
    returning count
  `)
  const count = Number((result.rows[0] as { count: number | string }).count)
  if (count <= rule.limit) return 0
  return Math.max(1, Math.ceil((windowStart.getTime() + windowMs - Date.now()) / 1000))
}

/** Throws RATE_LIMITED (429) when any of the given keys is over its limit. Null keys are skipped. */
export async function enforce(
  payload: Payload,
  checks: { key: string | null; rule: RateLimitRule }[],
): Promise<void> {
  for (const check of checks) {
    if (!check.key) continue
    const retryAfter = await consume(payload, check.key, check.rule)
    if (retryAfter > 0)
      throw new AppError('RATE_LIMITED', undefined, { retryAfterSeconds: retryAfter })
  }
}

/** Clears the counters for specific keys (e.g. test fixtures, or an admin lifting a limit). */
export async function clearRateLimits(payload: Payload, keys: string[]): Promise<void> {
  if (keys.length === 0) return
  const hashes = keys.map(hashKey)
  const list = sql.join(
    hashes.map((h) => sql`${h}`),
    sql`, `,
  )
  await payload.db.drizzle.execute(sql`delete from rate_limits where key in (${list})`)
}

/** Deletes counters from finished windows (run by a scheduled job). */
export async function pruneRateLimits(payload: Payload): Promise<void> {
  await payload.db.drizzle.execute(
    sql`delete from rate_limits where window_start < now() - interval '1 day'`,
  )
}
