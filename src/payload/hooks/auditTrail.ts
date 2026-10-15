import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { recordAudit } from '@/server/audit/record'

/** Fields that change on every save and say nothing about what the admin did. */
const IGNORED = new Set(['updatedAt', 'createdAt', 'id', '_status', 'sessions'])

/** A relationship may arrive populated ({ id, … }) or as a bare ID; compare by ID. */
function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: unknown }).id
  return value ?? null
}

/**
 * The top-level fields whose value differs between two versions of a document, with the old and
 * new values. Used so audit entries show exactly what an admin changed (Phase 9 pattern).
 */
export function changedFields(
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown>,
): { before: Record<string, unknown>; after: Record<string, unknown> } {
  const diff = { before: {} as Record<string, unknown>, after: {} as Record<string, unknown> }
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after)])
  for (const key of keys) {
    if (IGNORED.has(key)) continue
    const old = normalize(before?.[key])
    const next = normalize(after[key])
    if (JSON.stringify(old) !== JSON.stringify(next)) {
      diff.before[key] = old
      diff.after[key] = next
    }
  }
  return diff
}

type Options = {
  /** Audit entity type, usually the collection slug. */
  entityType: string
  /** Action prefix, e.g. `level` → `level.created`, `level.updated`, `level.deleted`. */
  action: string
  /** Short human summary of the document (shown in the audit list). */
  summary: (doc: Record<string, unknown>) => string
}

/**
 * Reusable audit hooks for admin-managed collections (Phase 9 CRUD pattern, rule 11).
 * Records who changed what, in which content language, inside the same transaction as the change.
 * Saves that change nothing are not recorded.
 */
export function auditTrail({ entityType, action, summary }: Options): {
  afterChange: CollectionAfterChangeHook
  afterDelete: CollectionAfterDeleteHook
} {
  return {
    afterChange: async ({ doc, previousDoc, operation, req }) => {
      const diff = changedFields(operation === 'create' ? undefined : previousDoc, doc)
      if (operation === 'update' && Object.keys(diff.after).length === 0) return doc
      await recordAudit(
        req.payload,
        {
          actorType: req.user ? 'admin' : 'system',
          actorId: req.user?.id,
          action: `${action}.${operation === 'create' ? 'created' : 'updated'}`,
          entityType,
          entityId: doc.id,
          summary: `${summary(doc)} [${req.locale ?? 'en'}]`,
          before: operation === 'create' ? undefined : diff.before,
          after: diff.after,
        },
        req,
      )
      return doc
    },
    afterDelete: async ({ doc, req }) => {
      await recordAudit(
        req.payload,
        {
          actorType: req.user ? 'admin' : 'system',
          actorId: req.user?.id,
          action: `${action}.deleted`,
          entityType,
          entityId: doc.id,
          summary: summary(doc),
          before: doc,
        },
        req,
      )
    },
  }
}
