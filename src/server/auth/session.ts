import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

import type { Student } from '@/payload-types'

import { AppError } from '../http/errors'

export async function payloadClient(): Promise<Payload> {
  return getPayload({ config })
}

export type SessionStudent = Student & { collection: 'students'; _sid?: string }

/** Resolves the signed-in student from the request cookie (or Authorization header), or null. */
export async function currentStudent(headers: Headers): Promise<SessionStudent | null> {
  const payload = await payloadClient()
  const { user } = await payload.auth({ headers })
  if (!user || user.collection !== 'students') return null
  return user as SessionStudent
}

/**
 * Headers for reading the session while rendering a PAGE (never for API routes).
 *
 * Payload accepts the session cookie only when the browser marks a request as coming from our own
 * site (its CSRF defence for the API). A top-level page load that arrives from another site, such
 * as the return from Google sign-in, a link in an email, or later a payment provider's return,
 * is marked "cross-site" even though the browser deliberately sends the SameSite=Lax cookie. Without
 * this, a signed-in student looked signed out on those pages (KI-29).
 *
 * Only a plain top-level document navigation qualifies (`Sec-Fetch-Mode: navigate`,
 * `Sec-Fetch-Dest: document`), so not embeds, fetches or iframes. A cross-site form POST also sends
 * an Origin header, which Payload checks first and still rejects. Page renders never change data.
 */
export function pageRequestHeaders(headers: Headers): Headers {
  const topLevelNavigation =
    headers.get('sec-fetch-site') === 'cross-site' &&
    headers.get('sec-fetch-mode') === 'navigate' &&
    headers.get('sec-fetch-dest') === 'document'
  if (!topLevelNavigation) return headers
  const copy = new Headers(headers)
  copy.set('sec-fetch-site', 'same-site')
  return copy
}

/** The signed-in student for a page render (see `pageRequestHeaders`). */
export async function currentStudentForPage(headers: Headers): Promise<SessionStudent | null> {
  return currentStudent(pageRequestHeaders(headers))
}

/** Requires a signed-in, active student. Throws UNAUTHENTICATED or ACCOUNT_DISABLED. */
export async function requireStudent(headers: Headers): Promise<SessionStudent> {
  const student = await currentStudent(headers)
  if (!student) throw new AppError('UNAUTHENTICATED')
  if (student.status === 'suspended') throw new AppError('ACCOUNT_DISABLED')
  return student
}
