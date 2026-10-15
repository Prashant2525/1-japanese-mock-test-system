import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

import type { Student } from '@/payload-types'
import { STUDENT_COOKIE } from '@/shared/session-cookies'

import { getEnv } from '../env'
import { AppError } from '../http/errors'

export async function payloadClient(): Promise<Payload> {
  return getPayload({ config })
}

export type SessionStudent = Student & { collection: 'students'; _sid?: string }

function cookieValue(header: string | null, name: string): string | undefined {
  for (const part of header?.split(';') ?? []) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=') || undefined
  }
  return undefined
}

/**
 * Headers that authenticate ONLY a student session (KI-32, D-077), or null when there is none.
 *
 * Students have their own cookie (`nm_student_session`); Payload's `payload-token` is for admins.
 * The token is handed to Payload as `Authorization: JWT …`, so an admin cookie in the same browser
 * can never count as a student session. Mobile clients send that header themselves (D-025).
 *
 * Request-forgery rules (what Payload enforced for its own cookie): a request from another origin
 * gets no session, with one exception for pages: a plain top-level page load that arrives from
 * another site (the return from Google, a link in an email) may read it (KI-29). That is exactly
 * what the cookie's SameSite=Lax already allows; page renders never change data.
 */
export function studentAuthHeaders(
  headers: Headers,
  { page = false }: { page?: boolean } = {},
): Headers | null {
  const out = new Headers()
  const token = cookieValue(headers.get('cookie'), STUDENT_COOKIE)
  if (token) {
    if (!cookieAllowed(headers, page)) return null
    out.set('authorization', `JWT ${token}`)
    return out
  }
  const bearer = headers.get('authorization')
  if (!bearer?.startsWith('JWT ')) return null
  out.set('authorization', bearer)
  return out
}

/**
 * When the student cookie may be used. A cookie travels automatically, so the request must show
 * it comes from our own site: an Origin equal to ours, or the browser's Sec-Fetch-Site saying
 * same-origin / same-site / none (typed address, bookmark). Requests with neither (non-browser
 * tools) must send `Authorization: JWT` instead. Pages also accept a top-level page load from
 * another site (KI-29).
 */
function cookieAllowed(headers: Headers, page: boolean): boolean {
  const origin = headers.get('origin')
  if (origin) return origin === new URL(getEnv().APP_URL).origin
  const site = headers.get('sec-fetch-site')
  if (site === 'same-origin' || site === 'same-site' || site === 'none') return true
  return (
    page &&
    site === 'cross-site' &&
    headers.get('sec-fetch-mode') === 'navigate' &&
    headers.get('sec-fetch-dest') === 'document'
  )
}

async function studentFrom(headers: Headers | null): Promise<SessionStudent | null> {
  if (!headers) return null
  const payload = await payloadClient()
  const { user } = await payload.auth({ headers })
  if (!user || user.collection !== 'students') return null
  return user as SessionStudent
}

/** The signed-in student of an API request (student cookie or `Authorization: JWT`), or null. */
export async function currentStudent(headers: Headers): Promise<SessionStudent | null> {
  return studentFrom(studentAuthHeaders(headers))
}

/** The signed-in student for a page render (also after arriving from another site, KI-29). */
export async function currentStudentForPage(headers: Headers): Promise<SessionStudent | null> {
  return studentFrom(studentAuthHeaders(headers, { page: true }))
}

/** Requires a signed-in, active student. Throws UNAUTHENTICATED or ACCOUNT_DISABLED. */
export async function requireStudent(headers: Headers): Promise<SessionStudent> {
  const student = await currentStudent(headers)
  if (!student) throw new AppError('UNAUTHENTICATED')
  if (student.status === 'suspended') throw new AppError('ACCOUNT_DISABLED')
  return student
}
