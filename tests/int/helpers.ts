import { randomBytes, randomUUID } from 'node:crypto'

import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { getPayload, type Payload } from 'payload'

import type { Admin, Student } from '@/payload-types'
import { memoryOutbox } from '@/server/email/adapter'

export async function client(): Promise<Payload> {
  return getPayload({ config })
}

export const uniqueEmail = (label: string) =>
  `${label}-${randomUUID().slice(0, 8)}@int.nihongo-mock.test`
export const strongPassword = () => `Pw-${randomBytes(12).toString('base64url')}`
/** A distinct client IP per test keeps per-IP rate limits from leaking between tests. */
export const uniqueIp = () => `10.${rand()}.${rand()}.${rand()}`
const rand = () => Math.floor(Math.random() * 250) + 1

export async function roleId(name: string): Promise<number> {
  const payload = await client()
  const found = await payload.find({
    collection: 'roles',
    where: { name: { equals: name } },
    limit: 1,
  })
  const id = found.docs[0]?.id
  if (id === undefined) throw new Error(`role ${name} not seeded`)
  return id
}

export async function createAdmin(
  roleName: string,
  extra: Partial<Pick<Admin, 'status' | 'name'>> = {},
): Promise<{ admin: Admin; password: string }> {
  const payload = await client()
  const password = strongPassword()
  const admin = await payload.create({
    collection: 'admins',
    data: {
      name: extra.name ?? `${roleName} tester`,
      email: uniqueEmail(roleName.toLowerCase().replace(/\s+/g, '-')),
      password,
      roles: [await roleId(roleName)],
      status: extra.status ?? 'active',
      preferredLocale: 'en',
    },
  })
  return { admin, password }
}

type RequestAdmin = Admin & { collection: 'admins'; _strategy?: string }

/**
 * The admin as Payload sees it on a request (roles populated, collection set).
 * By default the session counts as two-factor verified (`_strategy: 'totp'`), which is how a fully
 * logged-in admin looks to access rules (D-058). Pass `verified: false` for a password-only session.
 */
export async function asUser(
  admin: Admin,
  opts: { verified?: boolean } = {},
): Promise<RequestAdmin> {
  const payload = await client()
  const full = await payload.findByID({ collection: 'admins', id: admin.id, depth: 1 })
  return {
    ...full,
    collection: 'admins',
    ...(opts.verified === false ? { _strategy: 'local-jwt' } : { _strategy: 'totp' }),
  }
}

export async function createStudent(
  opts: { verified?: boolean; locale?: 'en' | 'ja' } = {},
): Promise<{ student: Student; email: string; password: string }> {
  const payload = await client()
  const email = uniqueEmail('student')
  const password = strongPassword()
  const student = await payload.create({
    collection: 'students',
    disableVerificationEmail: true,
    data: {
      name: 'Test Student',
      email,
      password,
      preferredLocale: opts.locale ?? 'en',
      status: 'active',
      determinationStatus: 'not_started',
    },
  })
  if (opts.verified !== false) {
    await payload.db.updateOne({
      collection: 'students',
      id: student.id,
      data: { _verified: true },
      returning: false,
    })
  }
  return { student, email, password }
}

export function outboxFor(email: string) {
  return memoryOutbox().filter((m) => m.to === email)
}

/** Extracts the token query parameter or the last path segment of the first link in an email. */
export function tokenFromEmail(html: string): string {
  const href = html.match(/href="([^"]+)"/)?.[1]?.replace(/&amp;/g, '&')
  if (!href) throw new Error('no link in email')
  const url = new URL(href)
  return url.searchParams.get('token') ?? url.pathname.split('/').pop()!
}

export async function resetRateLimits(): Promise<void> {
  const payload = await client()
  await payload.db.drizzle.execute(sql`delete from rate_limits`)
}

type CallOptions = {
  body?: unknown
  cookie?: string
  ip?: string
  origin?: string
  method?: string
  /** Browsers send Sec-Fetch-Site; Payload only accepts session cookies with it. Default true. */
  browser?: boolean
}

/** Calls a Next.js route handler directly with a realistic Request. */
export async function call(
  handler: (req: Request, ctx?: { params?: Promise<Record<string, string>> }) => Promise<Response>,
  path: string,
  opts: CallOptions = {},
): Promise<Response> {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (opts.cookie) headers.set('cookie', opts.cookie)
  if (opts.browser !== false) headers.set('sec-fetch-site', 'same-origin')
  if (opts.ip) headers.set('x-forwarded-for', opts.ip)
  if (opts.origin) headers.set('origin', opts.origin)
  return handler(
    new Request(`http://localhost:3000${path}`, {
      method: opts.method ?? (opts.body === undefined ? 'GET' : 'POST'),
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    }),
  )
}

/** Turns a Set-Cookie header into a Cookie header value. */
export function cookieFrom(res: Response): string {
  const set = res.headers.get('set-cookie')
  if (!set) throw new Error('no Set-Cookie header')
  return set.split(';')[0]!
}
