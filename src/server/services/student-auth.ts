import { randomBytes } from 'node:crypto'

import {
  APIError,
  AuthenticationError,
  createLocalReq,
  generateExpiredPayloadCookie,
  generatePayloadCookie,
  LockedAuth,
  logoutOperation,
  UnverifiedEmail,
  type Payload,
} from 'payload'
import { z } from 'zod'

import type { Student } from '@/payload-types'

import { recordAudit } from '../audit/record'
import { payloadClient, requireStudent, type SessionStudent } from '../auth/session'
import { revokeAllSessions } from '../auth/sessions'
import { renderEmail, type Locale } from '../email/templates'
import { getEnv } from '../env'
import { AppError } from '../http/errors'
import { enforce, RATE_LIMITS } from '../rate-limit'

/** Request facts passed from route handlers (never trusted for identity). */
export type RequestMeta = { ip: string | null; userAgent: string | null; requestId: string }

const email = z
  .email()
  .max(254)
  .transform((v) => v.trim().toLowerCase())
const password = z.string().min(10, 'must be at least 10 characters').max(128)
const locale = z.enum(['en', 'ja'])

export const registerSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
  email,
  password,
  preferredLocale: locale.default('en'),
})
export const loginSchema = z.strictObject({ email, password: z.string().min(1).max(128) })
export const emailOnlySchema = z.strictObject({ email })
export const tokenSchema = z.strictObject({ token: z.string().min(10).max(200) })
export const resetSchema = z.strictObject({ token: z.string().min(10).max(200), password })
export const preferencesSchema = z.strictObject({ preferredLocale: locale })

export type PublicStudent = {
  id: number
  name: string
  email: string
  preferredLocale: Locale
  status: Student['status']
  determinationStatus: Student['determinationStatus']
}

export function toPublicStudent(s: Student): PublicStudent {
  return {
    id: s.id,
    name: s.name,
    email: s.email,
    preferredLocale: s.preferredLocale,
    status: s.status,
    determinationStatus: s.determinationStatus,
  }
}

type HiddenAuthFields = { _verified?: boolean | null }

function cookieFor(payload: Payload, token: string): string {
  return generatePayloadCookie({
    collectionAuthConfig: payload.collections.students.config.auth,
    cookiePrefix: payload.config.cookiePrefix,
    token,
  })
}

export function expiredCookie(payload: Payload): string {
  return generateExpiredPayloadCookie({
    collectionAuthConfig: payload.collections.students.config.auth,
    cookiePrefix: payload.config.cookiePrefix,
  })
}

async function findByEmail(payload: Payload, address: string) {
  const found = await payload.find({
    collection: 'students',
    where: { email: { equals: address } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    showHiddenFields: true,
  })
  return found.docs[0] as (Student & HiddenAuthFields) | undefined
}

/** Issues a fresh verification token and emails it (used for re-sends; sign-up uses Payload's own send). */
async function sendVerification(payload: Payload, student: Student): Promise<void> {
  const token = randomBytes(20).toString('hex')
  await payload.db.updateOne({
    collection: 'students',
    id: student.id,
    data: { _verificationToken: token },
    returning: false,
  })
  const loc: Locale = student.preferredLocale === 'ja' ? 'ja' : 'en'
  const link = `${getEnv().APP_URL}/${loc}/verify-email?token=${token}`
  const rendered = await renderEmail(payload, 'verify_email', loc, { name: student.name }, link)
  await payload.sendEmail({ to: student.email, subject: rendered.subject, html: rendered.html })
}

/**
 * Sign-up (AUTH-R01). Always resolves the same way, whether or not the email is already registered,
 * so the response never reveals which emails have accounts.
 */
export async function register(
  input: z.infer<typeof registerSchema>,
  meta: RequestMeta,
): Promise<void> {
  const payload = await payloadClient()
  await enforce(payload, [
    { key: meta.ip && `register:ip:${meta.ip}`, rule: RATE_LIMITS.registerPerIp },
    { key: `email:acct:${input.email}`, rule: RATE_LIMITS.emailPerAccount },
  ])
  const existing = await findByEmail(payload, input.email)
  if (existing) {
    if (existing._verified === false) await sendVerification(payload, existing)
    return
  }
  const student = await payload.create({
    collection: 'students',
    overrideAccess: true,
    data: {
      name: input.name,
      email: input.email,
      password: input.password,
      preferredLocale: input.preferredLocale,
      status: 'active',
      determinationStatus: 'not_started',
    },
  })
  await recordAudit(payload, {
    actorType: 'student',
    actorId: student.id,
    action: 'student.registered',
    entityType: 'students',
    entityId: student.id,
    ip: meta.ip,
    userAgent: meta.userAgent,
    requestId: meta.requestId,
  })
}

export async function verifyEmail(token: string, meta: RequestMeta): Promise<void> {
  const payload = await payloadClient()
  await enforce(payload, [
    { key: meta.ip && `verify:ip:${meta.ip}`, rule: RATE_LIMITS.verifyPerIp },
  ])
  const found = await payload.find({
    collection: 'students',
    where: { _verificationToken: { equals: token } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  try {
    await payload.verifyEmail({ collection: 'students', token })
  } catch {
    throw new AppError('INVALID_TOKEN')
  }
  const studentId = found.docs[0]?.id
  await recordAudit(payload, {
    actorType: 'student',
    actorId: studentId,
    action: 'student.email_verified',
    entityType: 'students',
    entityId: studentId,
    ip: meta.ip,
    requestId: meta.requestId,
  })
}

export async function resendVerification(address: string, meta: RequestMeta): Promise<void> {
  const payload = await payloadClient()
  await enforce(payload, [
    { key: meta.ip && `email:ip:${meta.ip}`, rule: RATE_LIMITS.emailPerIp },
    { key: `email:acct:${address}`, rule: RATE_LIMITS.emailPerAccount },
  ])
  const student = await findByEmail(payload, address)
  if (student && student._verified === false && student.status === 'active') {
    await sendVerification(payload, student)
  }
}

export async function login(
  input: z.infer<typeof loginSchema>,
  meta: RequestMeta,
): Promise<{ student: PublicStudent; setCookie: string }> {
  const payload = await payloadClient()
  await enforce(payload, [
    { key: meta.ip && `login:ip:${meta.ip}`, rule: RATE_LIMITS.loginPerIp },
    { key: `login:acct:${input.email}`, rule: RATE_LIMITS.loginPerAccount },
  ])
  let result: Awaited<ReturnType<typeof payload.login<'students'>>>
  try {
    result = await payload.login({
      collection: 'students',
      data: { email: input.email, password: input.password },
      context: { rateLimited: true },
    })
  } catch (err) {
    if (err instanceof LockedAuth) throw new AppError('RATE_LIMITED')
    if (err instanceof UnverifiedEmail) throw new AppError('EMAIL_NOT_VERIFIED')
    if (err instanceof AuthenticationError) throw new AppError('INVALID_CREDENTIALS')
    if (err instanceof APIError && err.message === 'ACCOUNT_DISABLED')
      throw new AppError('ACCOUNT_DISABLED')
    throw err
  }
  if (!result.token || !result.user) throw new AppError('INVALID_CREDENTIALS')
  await recordAudit(payload, {
    actorType: 'student',
    actorId: result.user.id,
    action: 'student.login',
    entityType: 'students',
    entityId: result.user.id,
    ip: meta.ip,
    userAgent: meta.userAgent,
    requestId: meta.requestId,
  })
  return {
    student: toPublicStudent(result.user as Student),
    setCookie: cookieFor(payload, result.token),
  }
}

/** Ends the current session (it stops working everywhere immediately). Idempotent. */
export async function logout(headers: Headers, meta: RequestMeta): Promise<string> {
  const payload = await payloadClient()
  const { user } = await payload.auth({ headers })
  if (user && user.collection === 'students') {
    const req = await createLocalReq({ user }, payload)
    await logoutOperation({ collection: payload.collections.students, req })
    await recordAudit(payload, {
      actorType: 'student',
      actorId: user.id,
      action: 'student.logout',
      entityType: 'students',
      entityId: user.id,
      ip: meta.ip,
      requestId: meta.requestId,
    })
  }
  return expiredCookie(payload)
}

/** Always resolves the same way (no account enumeration). */
export async function forgotPassword(address: string, meta: RequestMeta): Promise<void> {
  const payload = await payloadClient()
  await enforce(payload, [
    { key: meta.ip && `email:ip:${meta.ip}`, rule: RATE_LIMITS.emailPerIp },
    { key: `email:acct:${address}`, rule: RATE_LIMITS.emailPerAccount },
  ])
  try {
    await payload.forgotPassword({
      collection: 'students',
      data: { email: address },
      context: { rateLimited: true },
    })
  } catch {
    // Unknown, throttled or failed sends look identical to the caller.
  }
}

/** Sets a new password from an emailed token, then signs the student out everywhere. */
export async function resetPassword(
  input: z.infer<typeof resetSchema>,
  meta: RequestMeta,
): Promise<void> {
  const payload = await payloadClient()
  await enforce(payload, [
    { key: meta.ip && `verify:ip:${meta.ip}`, rule: RATE_LIMITS.verifyPerIp },
  ])
  let studentId: number | undefined
  try {
    const result = await payload.resetPassword({
      collection: 'students',
      data: { token: input.token, password: input.password },
      overrideAccess: true,
    })
    studentId = (result.user as unknown as Student | undefined)?.id
  } catch {
    throw new AppError('INVALID_TOKEN')
  }
  if (studentId === undefined) throw new AppError('INVALID_TOKEN')
  await revokeAllSessions(payload, 'students', studentId)
  await recordAudit(payload, {
    actorType: 'student',
    actorId: studentId,
    action: 'student.password_reset',
    entityType: 'students',
    entityId: studentId,
    ip: meta.ip,
    requestId: meta.requestId,
  })
}

export async function me(headers: Headers): Promise<PublicStudent> {
  return toPublicStudent(await requireStudent(headers))
}

export async function updatePreferences(
  headers: Headers,
  input: z.infer<typeof preferencesSchema>,
): Promise<PublicStudent> {
  const student: SessionStudent = await requireStudent(headers)
  const payload = await payloadClient()
  const updated = await payload.update({
    collection: 'students',
    id: student.id,
    overrideAccess: true,
    data: { preferredLocale: input.preferredLocale },
  })
  return toPublicStudent(updated)
}
