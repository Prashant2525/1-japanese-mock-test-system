import type { Payload, PayloadRequest } from 'payload'

import { logger } from '../logger'

type JsonValue = string | number | boolean | Record<string, unknown> | unknown[] | null

export type AuditActorType = 'admin' | 'student' | 'system'

export type AuditEntry = {
  actorType: AuditActorType
  actorId?: string | number | null
  action: string
  entityType: string
  entityId?: string | number | null
  summary?: string
  before?: unknown
  after?: unknown
  ip?: string | null
  userAgent?: string | null
  requestId?: string | null
}

const SENSITIVE_KEYS = new Set([
  'password',
  'hash',
  'salt',
  'token',
  'sessions',
  'resetPasswordToken',
  'resetPasswordExpiration',
  '_verificationToken',
  'apiKey',
  'secret',
  'loginAttempts',
  'lockUntil',
])

/** Removes credentials and session data before anything is written to the audit log. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value)) {
    out[k] = SENSITIVE_KEYS.has(k) ? '[redacted]' : redact(v, depth + 1)
  }
  return out
}

/**
 * Appends an audit event (ARCHITECTURE §9). Pass `req` to write inside the caller's
 * transaction, so the event commits or rolls back with the change it describes.
 */
export async function recordAudit(
  payload: Payload,
  entry: AuditEntry,
  req?: Partial<PayloadRequest>,
): Promise<void> {
  try {
    await payload.create({
      collection: 'audit-events',
      overrideAccess: true,
      req,
      data: {
        actorType: entry.actorType,
        actorId: entry.actorId == null ? null : String(entry.actorId),
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId == null ? null : String(entry.entityId),
        summary: entry.summary?.slice(0, 500) ?? null,
        before: entry.before === undefined ? null : (redact(entry.before) as JsonValue),
        after: entry.after === undefined ? null : (redact(entry.after) as JsonValue),
        ip: entry.ip ?? null,
        userAgent: entry.userAgent ?? null,
        requestId: entry.requestId ?? null,
      },
    })
  } catch (err) {
    // Never let audit failure leak details; surface it loudly in logs.
    logger.error({ err, action: entry.action, entityType: entry.entityType }, 'audit write failed')
    throw err
  }
}
