import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { POST as forgotRoute } from '@/app/api/v1/auth/forgot-password/route'
import { POST as loginRoute } from '@/app/api/v1/auth/login/route'
import { POST as logoutRoute } from '@/app/api/v1/auth/logout/route'
import { POST as registerRoute } from '@/app/api/v1/auth/register/route'
import { POST as resendRoute } from '@/app/api/v1/auth/resend-verification/route'
import { POST as resetRoute } from '@/app/api/v1/auth/reset-password/route'
import { POST as verifyRoute } from '@/app/api/v1/auth/verify/route'
import { PATCH as preferencesRoute } from '@/app/api/v1/me/preferences/route'
import { GET as meRoute } from '@/app/api/v1/me/route'

import {
  asUser,
  call,
  client,
  cookieFrom,
  createAdmin,
  createStudent,
  outboxFor,
  resetRateLimits,
  strongPassword,
  tokenFromEmail,
  uniqueEmail,
  uniqueIp,
} from './helpers'

let payload: Payload

beforeAll(async () => {
  payload = await client()
})

beforeEach(async () => {
  await resetRateLimits()
})

async function errorCode(res: Response): Promise<string> {
  return ((await res.json()) as { error: { code: string } }).error.code
}

async function login(email: string, password: string, ip = uniqueIp()) {
  return call(loginRoute, '/api/v1/auth/login', { body: { email, password }, ip })
}

describe('registration and email verification', () => {
  it('creates an unverified student and emails an English verification link', async () => {
    const email = uniqueEmail('reg')
    const res = await call(registerRoute, '/api/v1/auth/register', {
      body: { name: 'Aarav', email, password: strongPassword() },
      ip: uniqueIp(),
    })
    expect(res.status).toBe(202)
    const found = await payload.find({
      collection: 'students',
      where: { email: { equals: email } },
      showHiddenFields: true,
    })
    expect(found.docs[0]?._verified).toBe(false)
    expect(found.docs[0]?.determinationStatus).toBe('not_started')
    const [mail] = outboxFor(email)
    expect(mail?.subject).toBe('Confirm your email for Nihongo Mock')
    expect(mail?.html).toContain('http://localhost:3000/en/verify-email?token=')
    expect(mail?.html).toContain('Hi Aarav,')
  })

  it('sends the Japanese template to a student who chose Japanese', async () => {
    const email = uniqueEmail('reg-ja')
    await call(registerRoute, '/api/v1/auth/register', {
      body: { name: '花子', email, password: strongPassword(), preferredLocale: 'ja' },
      ip: uniqueIp(),
    })
    const [mail] = outboxFor(email)
    expect(mail?.subject).toBe('【Nihongo Mock】メールアドレスの確認')
    expect(mail?.html).toContain('/ja/verify-email?token=')
    expect(mail?.html).toContain('lang="ja"')
  })

  it('escapes HTML in names inside emails', async () => {
    const email = uniqueEmail('xss')
    await call(registerRoute, '/api/v1/auth/register', {
      body: { name: '<img src=x onerror=alert(1)>', email, password: strongPassword() },
      ip: uniqueIp(),
    })
    const [mail] = outboxFor(email)
    expect(mail?.html).not.toContain('<img src=x')
    expect(mail?.html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('answers a duplicate sign-up exactly like a new one and creates no second account', async () => {
    const { email } = await createStudent()
    const res = await call(registerRoute, '/api/v1/auth/register', {
      body: { name: 'Someone', email, password: strongPassword() },
      ip: uniqueIp(),
    })
    expect(res.status).toBe(202)
    expect(await res.json()).toEqual({ status: 'accepted' })
    const count = await payload.count({
      collection: 'students',
      where: { email: { equals: email } },
    })
    expect(count.totalDocs).toBe(1)
  })

  it('rejects weak passwords and unknown fields', async () => {
    const weak = await call(registerRoute, '/api/v1/auth/register', {
      body: { name: 'x', email: uniqueEmail('weak'), password: 'short' },
      ip: uniqueIp(),
    })
    expect(weak.status).toBe(400)
    const extra = await call(registerRoute, '/api/v1/auth/register', {
      body: {
        name: 'x',
        email: uniqueEmail('extra'),
        password: strongPassword(),
        determinationStatus: 'completed',
      },
      ip: uniqueIp(),
    })
    expect(extra.status).toBe(400)
  })

  it('refuses login before verification, then verifies once with the emailed token', async () => {
    const email = uniqueEmail('verify')
    const password = strongPassword()
    await call(registerRoute, '/api/v1/auth/register', {
      body: { name: 'V', email, password },
      ip: uniqueIp(),
    })

    const early = await login(email, password)
    expect(early.status).toBe(403)
    expect(await errorCode(early)).toBe('EMAIL_NOT_VERIFIED')

    const bad = await call(verifyRoute, '/api/v1/auth/verify', {
      body: { token: 'not-a-real-token-123' },
      ip: uniqueIp(),
    })
    expect(bad.status).toBe(400)
    expect(await errorCode(bad)).toBe('INVALID_TOKEN')

    const token = tokenFromEmail(outboxFor(email)[0]!.html)
    const ok = await call(verifyRoute, '/api/v1/auth/verify', { body: { token }, ip: uniqueIp() })
    expect(ok.status).toBe(200)
    const reused = await call(verifyRoute, '/api/v1/auth/verify', {
      body: { token },
      ip: uniqueIp(),
    })
    expect(reused.status).toBe(400)

    expect((await login(email, password)).status).toBe(200)
  })

  it('re-sends a working verification link to unverified students only', async () => {
    const email = uniqueEmail('resend')
    const password = strongPassword()
    await call(registerRoute, '/api/v1/auth/register', {
      body: { name: 'R', email, password },
      ip: uniqueIp(),
    })
    const res = await call(resendRoute, '/api/v1/auth/resend-verification', {
      body: { email },
      ip: uniqueIp(),
    })
    expect(res.status).toBe(202)
    const mails = outboxFor(email)
    expect(mails).toHaveLength(2)
    const token = tokenFromEmail(mails[1]!.html)
    expect(
      (await call(verifyRoute, '/api/v1/auth/verify', { body: { token }, ip: uniqueIp() })).status,
    ).toBe(200)

    const unknown = await call(resendRoute, '/api/v1/auth/resend-verification', {
      body: { email: uniqueEmail('nobody') },
      ip: uniqueIp(),
    })
    expect(unknown.status).toBe(202)
  })
})

describe('login, session and logout', () => {
  it('gives the same answer for a wrong password and an unknown email', async () => {
    const { email } = await createStudent()
    const wrong = await login(email, 'wrong-password-123')
    const unknown = await login(uniqueEmail('ghost'), 'wrong-password-123')
    expect(wrong.status).toBe(401)
    expect(unknown.status).toBe(401)
    const a = (await wrong.json()) as { error: { code: string; message: string } }
    const b = (await unknown.json()) as { error: { code: string; message: string } }
    expect([a.error.code, a.error.message]).toEqual([b.error.code, b.error.message])
    expect(a.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('sets an HTTP-only session cookie and serves /me without secrets', async () => {
    const { email, password, student } = await createStudent()
    const res = await login(email, password)
    expect(res.status).toBe(200)
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toMatch(/HttpOnly/i)
    expect(setCookie).toMatch(/SameSite=Lax/i)

    const meRes = await call(meRoute, '/api/v1/me', { cookie: cookieFrom(res) })
    expect(meRes.status).toBe(200)
    const body = (await meRes.json()) as { student: Record<string, unknown> }
    expect(body.student).toEqual({
      id: student.id,
      name: 'Test Student',
      email,
      preferredLocale: 'en',
      status: 'active',
      determinationStatus: 'not_started',
      assignedLevel: null,
      nextStep: 'level_check',
    })
    expect(JSON.stringify(body)).not.toMatch(/hash|salt|sessions|token/i)
  })

  it('ignores the session cookie on requests without browser same-origin signals', async () => {
    const { email, password } = await createStudent()
    const cookie = cookieFrom(await login(email, password))
    const res = await call(meRoute, '/api/v1/me', { cookie, browser: false })
    expect(res.status).toBe(401)
  })

  it('/me requires a session', async () => {
    const res = await call(meRoute, '/api/v1/me')
    expect(res.status).toBe(401)
    expect(await errorCode(res)).toBe('UNAUTHENTICATED')
  })

  it('logout revokes the session on the server (the old cookie stops working)', async () => {
    const { email, password } = await createStudent()
    const cookie = cookieFrom(await login(email, password))
    const out = await call(logoutRoute, '/api/v1/auth/logout', { cookie, body: {} })
    expect(out.status).toBe(204)
    expect(out.headers.get('set-cookie')).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0|expires=/i)
    expect((await call(meRoute, '/api/v1/me', { cookie })).status).toBe(401)
  })

  it('logging out one device leaves other sessions working', async () => {
    const { email, password } = await createStudent()
    const phone = cookieFrom(await login(email, password))
    const laptop = cookieFrom(await login(email, password))
    await call(logoutRoute, '/api/v1/auth/logout', { cookie: phone, body: {} })
    expect((await call(meRoute, '/api/v1/me', { cookie: laptop })).status).toBe(200)
  })

  it('locks the account after 5 wrong passwords (reported as rate limiting, no enumeration)', async () => {
    const { email, password } = await createStudent()
    for (let i = 0; i < 5; i++) expect((await login(email, 'wrong-password-123')).status).toBe(401)
    const locked = await login(email, password)
    expect(locked.status).toBe(429)
    expect(await errorCode(locked)).toBe('RATE_LIMITED')
  })

  it('rate-limits many login attempts from one IP and sends Retry-After', async () => {
    const ip = uniqueIp()
    let last: Response | undefined
    for (let i = 0; i < 21; i++) last = await login(uniqueEmail('spray'), 'wrong-password-123', ip)
    expect(last!.status).toBe(429)
    expect(Number(last!.headers.get('retry-after'))).toBeGreaterThan(0)
  })

  it('suspending a student ends their sessions and blocks login', async () => {
    const { email, password, student } = await createStudent()
    const cookie = cookieFrom(await login(email, password))
    const { admin } = await createAdmin('Super Admin')
    await payload.update({
      collection: 'students',
      id: student.id,
      overrideAccess: false,
      user: await asUser(admin),
      data: { status: 'suspended' },
    })
    expect((await call(meRoute, '/api/v1/me', { cookie })).status).toBe(401)
    const res = await login(email, password)
    expect(res.status).toBe(403)
    expect(await errorCode(res)).toBe('ACCOUNT_DISABLED')
  })

  it('rejects cross-site requests (CSRF)', async () => {
    const { email, password } = await createStudent()
    const res = await call(loginRoute, '/api/v1/auth/login', {
      body: { email, password },
      ip: uniqueIp(),
      origin: 'https://evil.example',
    })
    expect(res.status).toBe(403)
  })

  it('records login and logout in the audit log', async () => {
    const { email, password, student } = await createStudent()
    const cookie = cookieFrom(await login(email, password))
    await call(logoutRoute, '/api/v1/auth/logout', { cookie, body: {} })
    const events = await payload.find({
      collection: 'audit-events',
      where: { entityId: { equals: String(student.id) } },
      sort: 'createdAt',
    })
    const actions = events.docs.map((e) => e.action)
    expect(actions).toEqual(expect.arrayContaining(['student.login', 'student.logout']))
  })
})

describe('password reset', () => {
  it('answers the same for unknown emails and sends nothing', async () => {
    const ghost = uniqueEmail('ghost')
    const res = await call(forgotRoute, '/api/v1/auth/forgot-password', {
      body: { email: ghost },
      ip: uniqueIp(),
    })
    expect(res.status).toBe(202)
    expect(outboxFor(ghost)).toHaveLength(0)
  })

  it('resets with the emailed token once, signs out everywhere, and swaps the password', async () => {
    const { email, password } = await createStudent()
    const before = cookieFrom(await login(email, password))
    await call(forgotRoute, '/api/v1/auth/forgot-password', { body: { email }, ip: uniqueIp() })
    const [mail] = outboxFor(email)
    expect(mail?.subject).toBe('Reset your Nihongo Mock password')
    expect(mail?.html).toContain('60 minutes')
    const token = tokenFromEmail(mail!.html)

    const newPassword = strongPassword()
    const ok = await call(resetRoute, '/api/v1/auth/reset-password', {
      body: { token, password: newPassword },
      ip: uniqueIp(),
    })
    expect(ok.status).toBe(200)

    expect((await call(meRoute, '/api/v1/me', { cookie: before })).status).toBe(401)
    expect((await login(email, password)).status).toBe(401)
    expect((await login(email, newPassword)).status).toBe(200)

    const reused = await call(resetRoute, '/api/v1/auth/reset-password', {
      body: { token, password: strongPassword() },
      ip: uniqueIp(),
    })
    expect(reused.status).toBe(400)
    expect(await errorCode(reused)).toBe('INVALID_TOKEN')
  })
})

describe('students cannot reach other students or protected fields', () => {
  it('a student sees only their own record through the CMS API', async () => {
    const a = await createStudent()
    const b = await createStudent()
    const user = { ...a.student, collection: 'students' as const }
    const list = await payload.find({ collection: 'students', overrideAccess: false, user })
    expect(list.docs.map((d) => d.id)).toEqual([a.student.id])
    await expect(
      payload.findByID({ collection: 'students', id: b.student.id, overrideAccess: false, user }),
    ).rejects.toBeTruthy()
  })

  it('a student cannot change their own level-check status or account status', async () => {
    const a = await createStudent()
    const user = { ...a.student, collection: 'students' as const }
    await expect(
      payload.update({
        collection: 'students',
        id: a.student.id,
        overrideAccess: false,
        user,
        data: { determinationStatus: 'completed', status: 'active' },
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('a student can change only their language preference through /me/preferences', async () => {
    const { email, password } = await createStudent()
    const cookie = cookieFrom(await login(email, password))
    const res = await call(preferencesRoute, '/api/v1/me/preferences', {
      cookie,
      method: 'PATCH',
      body: { preferredLocale: 'ja' },
    })
    expect(res.status).toBe(200)
    expect(
      ((await res.json()) as { student: { preferredLocale: string } }).student.preferredLocale,
    ).toBe('ja')
    const sneaky = await call(preferencesRoute, '/api/v1/me/preferences', {
      cookie,
      method: 'PATCH',
      body: { preferredLocale: 'en', determinationStatus: 'completed' },
    })
    expect(sneaky.status).toBe(400)
  })
})
