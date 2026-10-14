import { randomBytes, randomUUID } from 'node:crypto'

import { getFieldsToSign, jwtSign, type Payload } from 'payload'
import { removeExpiredSessions } from 'payload/shared'

import type { Student } from '@/payload-types'
import { safeNextPath } from '@/ui/lib/safe-next'

import { recordAudit } from '../audit/record'
import {
  authorizationUrl,
  exchangeCode,
  FLOW_COOKIE,
  FLOW_COOKIE_PATH,
  FLOW_TTL_SECONDS,
  googleConfig,
  GoogleSignInError,
  newFlow,
  openFlow,
  profileFromIdToken,
  safeEqual,
  sealFlow,
  type GoogleProfile,
} from '../auth/google'
import { payloadClient } from '../auth/session'
import { getEnv } from '../env'
import { isAppError } from '../http/errors'
import { logger } from '../logger'
import { enforce, RATE_LIMITS } from '../rate-limit'
import { cookieFor, type RequestMeta } from './student-auth'

type Locale = 'en' | 'ja'

/** Why a Google sign-in ended on the login page (shown there as `?oauth=<reason>`). */
export type GoogleFailure =
  'cancelled' | 'expired' | 'failed' | 'disabled' | 'unavailable' | 'rate_limited'

/** Where to send the browser next, and the cookies to set on the way. */
export type GoogleRedirect = { location: string; cookies: string[] }

/** "Continue with Google" is shown only when the server has the keys AND the CMS switch is on. */
export async function isGoogleSignInAvailable(payload?: Payload): Promise<boolean> {
  if (!googleConfig()) return false
  const client = payload ?? (await payloadClient())
  const settings = await client.findGlobal({ slug: 'sign-in-settings', depth: 0 })
  return settings.googleEnabled !== false
}

const secure = () => getEnv().APP_URL.startsWith('https://')

function flowCookie(value: string, maxAge: number): string {
  return [
    `${FLOW_COOKIE}=${value}`,
    `Path=${FLOW_COOKIE_PATH}`,
    `Max-Age=${maxAge}`,
    'HttpOnly',
    'SameSite=Lax',
    ...(secure() ? ['Secure'] : []),
  ].join('; ')
}

const clearFlowCookie = () => flowCookie('', 0)

function absolute(path: string): string {
  return new URL(path, getEnv().APP_URL).toString()
}

function loginPage(locale: Locale, reason: GoogleFailure, next?: string): string {
  const params = new URLSearchParams({ oauth: reason })
  if (next && next !== `/${locale}/app`) params.set('next', next)
  return absolute(`/${locale}/login?${params.toString()}`)
}

function readCookie(header: string | null, name: string): string | undefined {
  for (const part of header?.split(';') ?? []) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return undefined
}

async function limited(payload: Payload, meta: RequestMeta): Promise<boolean> {
  try {
    await enforce(payload, [
      { key: meta.ip && `google:ip:${meta.ip}`, rule: RATE_LIMITS.googlePerIp },
    ])
    return false
  } catch (err) {
    if (isAppError(err) && err.code === 'RATE_LIMITED') return true
    throw err
  }
}

/** Step 1: remember the attempt in a signed cookie and send the browser to Google. */
export async function startGoogleSignIn(
  input: { locale: Locale; next: string | null },
  meta: RequestMeta,
): Promise<GoogleRedirect> {
  const payload = await payloadClient()
  const next = safeNextPath(input.next, input.locale)
  const config = googleConfig()
  if (!config || !(await isGoogleSignInAvailable(payload)))
    return { location: loginPage(input.locale, 'unavailable', next), cookies: [] }
  if (await limited(payload, meta))
    return { location: loginPage(input.locale, 'rate_limited', next), cookies: [] }
  const flow = newFlow(input.locale, next)
  return {
    location: authorizationUrl(config, flow),
    cookies: [flowCookie(sealFlow(flow, payload.secret), FLOW_TTL_SECONDS)],
  }
}

/** Step 2: Google sent the browser back. Check it is the same attempt, then sign the student in. */
export async function finishGoogleSignIn(
  query: URLSearchParams,
  cookieHeader: string | null,
  meta: RequestMeta,
): Promise<GoogleRedirect> {
  const payload = await payloadClient()
  const flow = openFlow(readCookie(cookieHeader, FLOW_COOKIE), payload.secret)
  const locale: Locale = flow?.locale ?? 'en'
  const fail = (reason: GoogleFailure): GoogleRedirect => ({
    location: loginPage(locale, reason, flow?.next),
    cookies: [clearFlowCookie()],
  })

  const config = googleConfig()
  if (!config || !(await isGoogleSignInAvailable(payload))) return fail('unavailable')
  if (await limited(payload, meta)) return fail('rate_limited')
  // No cookie, an expired one, or a state that doesn't match: a stale tab or a forged callback.
  const state = query.get('state')
  if (!flow || !state || !safeEqual(state, flow.state)) return fail('expired')
  const googleError = query.get('error')
  if (googleError) return fail(googleError === 'access_denied' ? 'cancelled' : 'failed')
  const code = query.get('code')
  if (!code) return fail('failed')

  let profile: GoogleProfile
  try {
    const idToken = await exchangeCode(config, code, flow.verifier)
    profile = profileFromIdToken(idToken, { clientId: config.clientId, nonce: flow.nonce })
  } catch (err) {
    if (!(err instanceof GoogleSignInError)) throw err
    logger.warn({ requestId: meta.requestId, reason: err.reason }, 'google sign-in rejected')
    return fail('failed')
  }

  const outcome = await signInWithGoogleProfile(payload, profile, flow.locale, meta)
  if (outcome.result !== 'ok') return fail(outcome.result)
  return {
    location: absolute(safeNextPath(flow.next, flow.locale)),
    cookies: [clearFlowCookie(), outcome.setCookie],
  }
}

type StudentRow = Student & { _verified?: boolean | null }

async function findStudent(payload: Payload, where: Record<string, unknown>) {
  const found = await payload.find({
    collection: 'students',
    where: where as never,
    limit: 1,
    depth: 0,
    overrideAccess: true,
    showHiddenFields: true,
  })
  return found.docs[0] as StudentRow | undefined
}

/** A password nobody knows. Google-only students can set their own through "Forgot password". */
const unusablePassword = () => randomBytes(32).toString('base64url')

/**
 * Finds the student for a Google identity, linking or creating the account if needed (D-066):
 * 1. Already linked (same Google ID) → that student.
 * 2. Same email, not linked → link. Google has verified the email, so the account is marked
 *    verified; if it was NOT verified yet, its password is replaced, because it may have been set
 *    by someone else who registered this email first.
 * 3. Otherwise → new verified student.
 * Suspended accounts are refused. An email linked to a different Google ID is refused.
 */
export async function signInWithGoogleProfile(
  payload: Payload,
  profile: GoogleProfile,
  locale: Locale,
  meta: RequestMeta,
): Promise<
  { result: 'ok'; setCookie: string; student: Student } | { result: 'disabled' | 'failed' }
> {
  let student = await findStudent(payload, { googleSub: { equals: profile.sub } })

  if (!student) {
    const existing = await findStudent(payload, { email: { equals: profile.email } })
    if (existing) {
      if (existing.googleSub) return { result: 'failed' }
      if (existing.status === 'suspended') return { result: 'disabled' }
      const wasUnverified = existing._verified === false
      await payload.update({
        collection: 'students',
        id: existing.id,
        overrideAccess: true,
        data: {
          googleSub: profile.sub,
          ...(wasUnverified ? { password: unusablePassword() } : {}),
        },
      })
      if (wasUnverified) {
        await payload.db.updateOne({
          collection: 'students',
          id: existing.id,
          data: { _verified: true, _verificationToken: null },
          returning: false,
        })
      }
      await recordAudit(payload, {
        actorType: 'student',
        actorId: existing.id,
        action: 'student.google_linked',
        entityType: 'students',
        entityId: existing.id,
        summary: wasUnverified
          ? 'unconfirmed account: email confirmed, password replaced'
          : undefined,
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      })
      student = existing
    } else {
      const created = await payload.create({
        collection: 'students',
        overrideAccess: true,
        disableVerificationEmail: true,
        data: {
          name: (profile.name ?? profile.email.split('@')[0]!).slice(0, 120),
          email: profile.email,
          password: unusablePassword(),
          preferredLocale: locale,
          status: 'active',
          determinationStatus: 'not_started',
          googleSub: profile.sub,
        },
      })
      await payload.db.updateOne({
        collection: 'students',
        id: created.id,
        data: { _verified: true },
        returning: false,
      })
      await recordAudit(payload, {
        actorType: 'student',
        actorId: created.id,
        action: 'student.registered',
        entityType: 'students',
        entityId: created.id,
        summary: 'via Google',
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      })
      student = created
    }
  }

  if (student.status === 'suspended') return { result: 'disabled' }
  const setCookie = await issueSession(payload, student)
  await recordAudit(payload, {
    actorType: 'student',
    actorId: student.id,
    action: 'student.login',
    entityType: 'students',
    entityId: student.id,
    summary: 'via Google',
    ip: meta.ip,
    userAgent: meta.userAgent,
    requestId: meta.requestId,
  })
  return { result: 'ok', setCookie, student }
}

/**
 * Creates a revocable session exactly like Payload's password login does (session ID stored on the
 * student and signed into the token), without needing a password. Only the sessions column is
 * written.
 */
async function issueSession(payload: Payload, student: Student): Promise<string> {
  const collectionConfig = payload.collections.students.config
  const { tokenExpiration } = collectionConfig.auth
  const row = (await payload.db.findOne({
    collection: 'students',
    where: { id: { equals: student.id } },
    select: { sessions: true },
  })) as { sessions?: { id: string; createdAt: string | Date; expiresAt: string | Date }[] } | null
  const sid = randomUUID()
  const now = new Date()
  const sessions = [
    ...removeExpiredSessions(row?.sessions ?? []),
    { id: sid, createdAt: now, expiresAt: new Date(now.getTime() + tokenExpiration * 1000) },
  ]
  await payload.db.updateOne({
    collection: 'students',
    id: student.id,
    data: { sessions, updatedAt: null },
    returning: false,
  })
  const fieldsToSign = getFieldsToSign({
    collectionConfig,
    email: student.email,
    sid,
    user: { ...student, collection: 'students' } as never,
  })
  const { token } = await jwtSign({ fieldsToSign, secret: payload.secret, tokenExpiration })
  return cookieFor(payload, token)
}

/**
 * Turns a Google step into a browser redirect. These routes are opened by navigation, not fetch,
 * so even an unexpected error ends on the login page with a message instead of a JSON body.
 */
export async function googleRedirect(
  requestId: string,
  run: () => Promise<GoogleRedirect>,
): Promise<Response> {
  let target: GoogleRedirect
  try {
    target = await run()
  } catch (err) {
    logger.error({ requestId, err }, 'google sign-in error')
    target = { location: loginPage('en', 'failed'), cookies: [clearFlowCookie()] }
  }
  const headers = new Headers({ Location: target.location, 'Cache-Control': 'no-store' })
  for (const cookie of target.cookies) headers.append('Set-Cookie', cookie)
  return new Response(null, { status: 303, headers })
}
