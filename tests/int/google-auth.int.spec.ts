import { createHash } from 'node:crypto'

import type { Payload } from 'payload'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { GET as callbackRoute } from '@/app/api/v1/auth/google/callback/route'
import { GET as startRoute } from '@/app/api/v1/auth/google/route'
import { POST as loginRoute } from '@/app/api/v1/auth/login/route'
import { POST as logoutRoute } from '@/app/api/v1/auth/logout/route'
import { GET as meRoute } from '@/app/api/v1/me/route'
import { GOOGLE_TOKEN_URL } from '@/server/auth/google'

import { call, client, createStudent, resetRateLimits, uniqueEmail, uniqueIp } from './helpers'

let payload: Payload
const CLIENT_ID = 'int-test.apps.googleusercontent.com'
const APP = 'http://localhost:3000'

beforeAll(async () => {
  payload = await client()
})

beforeEach(async () => {
  await resetRateLimits()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

type Flow = { cookie: string; state: string; nonce: string; challenge: string; ip: string }

function cookieNamed(res: Response, name: string): string | undefined {
  return res.headers
    .getSetCookie()
    .find((c) => c.startsWith(`${name}=`))
    ?.split(';')[0]
}

function setCookieLine(res: Response, name: string): string | undefined {
  return res.headers.getSetCookie().find((c) => c.startsWith(`${name}=`))
}

async function start(query = 'locale=en'): Promise<Flow> {
  const ip = uniqueIp()
  const res = await call(startRoute, `/api/v1/auth/google?${query}`, { ip })
  expect(res.status).toBe(303)
  const location = new URL(res.headers.get('location')!)
  expect(location.origin).toBe('https://accounts.google.com')
  const q = location.searchParams
  return {
    cookie: cookieNamed(res, 'nm_google_flow')!,
    state: q.get('state')!,
    nonce: q.get('nonce')!,
    challenge: q.get('code_challenge')!,
    ip,
  }
}

const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')

/** Replaces Google's token endpoint with one that returns these claims. Returns the requests. */
function fakeGoogle(claims: Record<string, unknown>, nonce: string): URLSearchParams[] {
  const received: URLSearchParams[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(String(url)).toBe(GOOGLE_TOKEN_URL)
      received.push(new URLSearchParams(String(init?.body)))
      const now = Math.floor(Date.now() / 1000)
      const idToken = `${b64({ alg: 'RS256' })}.${b64({
        iss: 'https://accounts.google.com',
        aud: CLIENT_ID,
        iat: now,
        exp: now + 3600,
        nonce,
        email_verified: true,
        ...claims,
      })}.sig`
      return Response.json({ id_token: idToken, access_token: 'unused' })
    }),
  )
  return received
}

async function finish(flow: Flow, query = `state=${flow.state}&code=one-time-code`) {
  return call(callbackRoute, `/api/v1/auth/google/callback?${query}`, {
    cookie: flow.cookie,
    ip: flow.ip,
  })
}

const googleId = () => `g-${Math.random().toString(36).slice(2)}`

async function me(sessionCookie: string) {
  return call(meRoute, '/api/v1/me', { cookie: sessionCookie })
}

describe('Continue with Google', () => {
  it('start: sends the browser to Google with PKCE and a signed, short-lived flow cookie', async () => {
    const res = await call(startRoute, '/api/v1/auth/google?locale=ja&next=/ja/app/results', {
      ip: uniqueIp(),
    })
    expect(res.status).toBe(303)
    expect(res.headers.get('cache-control')).toBe('no-store')
    const q = new URL(res.headers.get('location')!).searchParams
    expect(q.get('client_id')).toBe(CLIENT_ID)
    expect(q.get('redirect_uri')).toBe(`${APP}/api/v1/auth/google/callback`)
    expect(q.get('code_challenge_method')).toBe('S256')
    expect(q.get('hl')).toBe('ja')
    const flowCookie = setCookieLine(res, 'nm_google_flow')!
    expect(flowCookie).toContain('HttpOnly')
    expect(flowCookie).toContain('SameSite=Lax')
    expect(flowCookie).toContain('Path=/api/v1/auth/google')
    expect(flowCookie).toContain('Max-Age=600')
  })

  it('creates a confirmed account for a new Google user and signs them in', async () => {
    const flow = await start('locale=ja&next=/ja/app/results')
    const email = uniqueEmail('google-new')
    const sub = googleId()
    const received = fakeGoogle({ sub, email, name: '山田 花子' }, flow.nonce)

    const res = await finish(flow)
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(`${APP}/ja/app/results`)
    // The code exchange proves possession of the PKCE verifier and uses our client secret.
    const body = received[0]!
    expect(body.get('code')).toBe('one-time-code')
    expect(body.get('grant_type')).toBe('authorization_code')
    expect(body.get('client_secret')).toBe(process.env.GOOGLE_CLIENT_SECRET)
    expect(createHash('sha256').update(body.get('code_verifier')!).digest('base64url')).toBe(
      flow.challenge,
    )
    // The flow cookie is cleared; a session cookie is set and works.
    expect(setCookieLine(res, 'nm_google_flow')).toContain('Max-Age=0')
    const session = cookieNamed(res, 'nm_student_session')!
    const profile = (await (await me(session)).json()) as { student: Record<string, unknown> }
    expect(profile.student).toMatchObject({ name: '山田 花子', email, preferredLocale: 'ja' })

    const stored = await payload.find({
      collection: 'students',
      where: { email: { equals: email } },
      showHiddenFields: true,
    })
    expect(stored.totalDocs).toBe(1)
    expect(stored.docs[0]).toMatchObject({ googleSub: sub, _verified: true, status: 'active' })
  })

  it('signs the same Google user into the same account next time', async () => {
    const email = uniqueEmail('google-again')
    const sub = googleId()
    for (let i = 0; i < 2; i++) {
      const flow = await start()
      fakeGoogle({ sub, email }, flow.nonce)
      expect((await finish(flow)).headers.get('location')).toBe(`${APP}/en/app`)
    }
    const stored = await payload.find({
      collection: 'students',
      where: { email: { equals: email } },
    })
    expect(stored.totalDocs).toBe(1)
  })

  it('links an existing confirmed account with the same email; its password keeps working', async () => {
    const { student, email, password } = await createStudent()
    const flow = await start()
    fakeGoogle({ sub: googleId(), email: email.toUpperCase() }, flow.nonce)
    const res = await finish(flow)
    expect(res.headers.get('location')).toBe(`${APP}/en/app`)
    const session = cookieNamed(res, 'nm_student_session')!
    const profile = (await (await me(session)).json()) as { student: { id: number } }
    expect(profile.student.id).toBe(student.id)
    const login = await call(loginRoute, '/api/v1/auth/login', {
      body: { email, password },
      ip: uniqueIp(),
    })
    expect(login.status).toBe(200)
  })

  it('links an unconfirmed account, confirms it and replaces its password (pre-registration attack)', async () => {
    const { student, email, password } = await createStudent({ verified: false })
    const flow = await start()
    fakeGoogle({ sub: googleId(), email }, flow.nonce)
    const res = await finish(flow)
    expect(res.headers.get('location')).toBe(`${APP}/en/app`)
    const stored = await payload.findByID({
      collection: 'students',
      id: student.id,
      showHiddenFields: true,
    })
    expect(stored._verified).toBe(true)
    const login = await call(loginRoute, '/api/v1/auth/login', {
      body: { email, password },
      ip: uniqueIp(),
    })
    expect(login.status).toBe(401)
  })

  it('refuses suspended accounts', async () => {
    const { student, email } = await createStudent()
    await payload.update({ collection: 'students', id: student.id, data: { status: 'suspended' } })
    const flow = await start()
    fakeGoogle({ sub: googleId(), email }, flow.nonce)
    const res = await finish(flow)
    expect(res.headers.get('location')).toBe(`${APP}/en/login?oauth=disabled`)
    expect(cookieNamed(res, 'nm_student_session')).toBeUndefined()
  })

  it('refuses an email already linked to a different Google account', async () => {
    const email = uniqueEmail('google-conflict')
    const first = await start()
    fakeGoogle({ sub: googleId(), email }, first.nonce)
    await finish(first)
    const second = await start()
    fakeGoogle({ sub: googleId(), email }, second.nonce)
    const res = await finish(second)
    expect(res.headers.get('location')).toBe(`${APP}/en/login?oauth=failed`)
  })

  it('Google sessions are revocable like password sessions (logout ends them)', async () => {
    const flow = await start()
    fakeGoogle({ sub: googleId(), email: uniqueEmail('google-logout') }, flow.nonce)
    const session = cookieNamed(await finish(flow), 'nm_student_session')!
    expect((await me(session)).status).toBe(200)
    await call(logoutRoute, '/api/v1/auth/logout', { cookie: session, method: 'POST' })
    expect((await me(session)).status).toBe(401)
  })

  describe('rejects answers that are not for this browser or this attempt', () => {
    it('wrong state (forged or stale callback)', async () => {
      const flow = await start()
      const res = await finish(flow, 'state=forged&code=x')
      expect(res.headers.get('location')).toBe(`${APP}/en/login?oauth=expired`)
    })

    it('missing flow cookie (callback opened in another browser)', async () => {
      const flow = await start()
      const res = await finish({ ...flow, cookie: '' })
      expect(res.headers.get('location')).toBe(`${APP}/en/login?oauth=expired`)
    })

    it('a different nonce in the ID token (replayed token)', async () => {
      const flow = await start()
      fakeGoogle({ sub: googleId(), email: uniqueEmail('google-nonce') }, 'other-nonce')
      const res = await finish(flow)
      expect(res.headers.get('location')).toBe(`${APP}/en/login?oauth=failed`)
      expect(cookieNamed(res, 'nm_student_session')).toBeUndefined()
    })

    it('an email Google has not verified', async () => {
      const flow = await start()
      fakeGoogle(
        { sub: googleId(), email: uniqueEmail('google-unverified'), email_verified: false },
        flow.nonce,
      )
      expect((await finish(flow)).headers.get('location')).toBe(`${APP}/en/login?oauth=failed`)
    })

    it('Google refusing the code', async () => {
      const flow = await start()
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => Response.json({ error: 'invalid_grant' }, { status: 400 })),
      )
      expect((await finish(flow)).headers.get('location')).toBe(`${APP}/en/login?oauth=failed`)
    })
  })

  it('reports a cancelled Google screen and keeps the language and destination', async () => {
    const flow = await start('locale=ja&next=/ja/app/results')
    const res = await finish(flow, `state=${flow.state}&error=access_denied`)
    expect(res.headers.get('location')).toBe(
      `${APP}/ja/login?oauth=cancelled&next=%2Fja%2Fapp%2Fresults`,
    )
  })

  it('never redirects outside the student area', async () => {
    const flow = await start('locale=en&next=https://evil.example/')
    fakeGoogle({ sub: googleId(), email: uniqueEmail('google-next') }, flow.nonce)
    expect((await finish(flow)).headers.get('location')).toBe(`${APP}/en/app`)
  })

  it('is unavailable when switched off in the CMS', async () => {
    await payload.updateGlobal({ slug: 'sign-in-settings', data: { googleEnabled: false } })
    try {
      const res = await call(startRoute, '/api/v1/auth/google?locale=en', { ip: uniqueIp() })
      expect(res.headers.get('location')).toBe(`${APP}/en/login?oauth=unavailable`)
    } finally {
      await payload.updateGlobal({ slug: 'sign-in-settings', data: { googleEnabled: true } })
    }
  })

  it('is rate limited per IP', async () => {
    const ip = uniqueIp()
    let last: Response | undefined
    for (let i = 0; i < 31; i++) {
      last = await call(startRoute, '/api/v1/auth/google?locale=en', { ip })
    }
    expect(last!.headers.get('location')).toBe(`${APP}/en/login?oauth=rate_limited`)
  })
})
