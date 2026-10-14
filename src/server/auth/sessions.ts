import type { Payload, PayloadRequest } from 'payload'

/**
 * Revokes every session of a user (ARCHITECTURE §4). Payload validates the session ID inside each
 * token on every request, so removing sessions logs the user out everywhere immediately.
 * Mirrors Payload's own logout operation (allSessions) without touching updatedAt.
 */
export async function revokeAllSessions(
  payload: Payload,
  collection: 'admins' | 'students',
  id: number | string,
  req?: Partial<PayloadRequest>,
): Promise<void> {
  await payload.db.updateOne({
    collection,
    id,
    data: { sessions: [], updatedAt: null },
    req,
    returning: false,
  })
}
