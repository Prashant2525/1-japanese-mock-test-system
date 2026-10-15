/**
 * Cookie names (KI-32, D-077). Payload's `payload-token` belongs to admins only; students have their
 * own cookie, so an admin and a student session never mix in one browser.
 */
export const ADMIN_COOKIE = 'payload-token'
export const STUDENT_COOKIE = 'nm_student_session'

/**
 * The `collection` claim of a Payload session token, read WITHOUT verifying the signature.
 * Only for routing decisions (e.g. clearing a leftover student token); never for authorization.
 */
export function tokenCollection(token: string | undefined): string | null {
  const part = token?.split('.')[1]
  if (!part) return null
  try {
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    const claims = JSON.parse(json) as { collection?: unknown }
    return typeof claims.collection === 'string' ? claims.collection : null
  } catch {
    return null
  }
}
