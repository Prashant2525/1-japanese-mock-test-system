import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

import { getEnv } from '../env'

/**
 * "Continue with Google" (D-066): OpenID Connect authorization-code flow with PKCE.
 * No library: Google's three endpoints are stable and documented, and the ID token arrives
 * directly from Google's token endpoint over TLS, authenticated with our client secret, so its
 * signature does not need a separate check (OpenID Connect Core §3.1.3.7; Google's OIDC guide).
 * The claims (issuer, audience, expiry, nonce, verified email) are still validated.
 */
export const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com'])

/** Short-lived cookie that ties Google's answer to the browser that started the sign-in. */
export const FLOW_COOKIE = 'nm_google_flow'
export const FLOW_COOKIE_PATH = '/api/v1/auth/google'
export const FLOW_TTL_SECONDS = 10 * 60
const CLOCK_SKEW_SECONDS = 5 * 60

export type GoogleConfig = { clientId: string; clientSecret: string; redirectUri: string }

/** Google settings from the environment, or null when they are not configured. */
export function googleConfig(): GoogleConfig | null {
  const env = getEnv()
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return null
  return {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${new URL(env.APP_URL).origin}${FLOW_COOKIE_PATH}/callback`,
  }
}

export type FlowState = {
  state: string
  nonce: string
  verifier: string
  locale: 'en' | 'ja'
  next: string
  /** Seconds since epoch. */
  exp: number
}

const random = () => randomBytes(32).toString('base64url')

export function newFlow(locale: 'en' | 'ja', next: string): FlowState {
  return {
    state: random(),
    nonce: random(),
    verifier: random(),
    locale,
    next,
    exp: Math.floor(Date.now() / 1000) + FLOW_TTL_SECONDS,
  }
}

export function codeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url')
}

export function authorizationUrl(config: GoogleConfig, flow: FlowState): string {
  const url = new URL(GOOGLE_AUTHORIZE_URL)
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: codeChallenge(flow.verifier),
    code_challenge_method: 'S256',
    prompt: 'select_account',
    hl: flow.locale,
  }).toString()
  return url.toString()
}

// ---- Flow cookie (signed, so a cookie planted from another subdomain is rejected) ----

const sign = (body: string, secret: string) =>
  createHmac('sha256', secret).update(`google-flow.${body}`).digest('base64url')

export function sealFlow(flow: FlowState, secret: string): string {
  const body = Buffer.from(JSON.stringify(flow)).toString('base64url')
  return `${body}.${sign(body, secret)}`
}

/** Returns the flow if the cookie is intact and unexpired, otherwise null. */
export function openFlow(value: string | undefined, secret: string): FlowState | null {
  if (!value) return null
  const [body, mac] = value.split('.')
  if (!body || !mac || !safeEqual(mac, sign(body, secret))) return null
  try {
    const flow = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as FlowState
    if (typeof flow.exp !== 'number' || flow.exp < Date.now() / 1000) return null
    return flow
  } catch {
    return null
  }
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

// ---- Token exchange and ID-token claims ----

export type GoogleProfile = { sub: string; email: string; name: string | null }

export class GoogleSignInError extends Error {
  constructor(readonly reason: string) {
    super(`Google sign-in failed: ${reason}`)
    this.name = 'GoogleSignInError'
  }
}

/** Exchanges the one-time code for an ID token (server to Google, never through the browser). */
export async function exchangeCode(
  config: GoogleConfig,
  code: string,
  verifier: string,
): Promise<string> {
  let res: Response
  try {
    res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
        code_verifier: verifier,
      }),
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new GoogleSignInError('token endpoint unreachable')
  }
  // Google's error body names the problem (e.g. invalid_grant) without secrets; keep only the code.
  const body = (await res.json().catch(() => null)) as {
    id_token?: unknown
    error?: unknown
  } | null
  if (!res.ok || typeof body?.id_token !== 'string') {
    throw new GoogleSignInError(`token exchange ${res.status} ${String(body?.error ?? '')}`.trim())
  }
  return body.id_token
}

/** Validates the ID token's claims and returns the Google identity. */
export function profileFromIdToken(
  idToken: string,
  expected: { clientId: string; nonce: string },
  nowSeconds = Math.floor(Date.now() / 1000),
): GoogleProfile {
  const part = idToken.split('.')[1]
  if (!part) throw new GoogleSignInError('malformed id_token')
  let claims: Record<string, unknown>
  try {
    claims = JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>
  } catch {
    throw new GoogleSignInError('malformed id_token')
  }
  const aud = claims.aud
  const audiences = Array.isArray(aud) ? aud : [aud]
  if (!GOOGLE_ISSUERS.has(String(claims.iss))) throw new GoogleSignInError('wrong issuer')
  if (!audiences.includes(expected.clientId)) throw new GoogleSignInError('wrong audience')
  if (claims.azp !== undefined && claims.azp !== expected.clientId)
    throw new GoogleSignInError('wrong authorized party')
  if (typeof claims.exp !== 'number' || claims.exp + CLOCK_SKEW_SECONDS < nowSeconds)
    throw new GoogleSignInError('expired')
  if (typeof claims.iat === 'number' && claims.iat - CLOCK_SKEW_SECONDS > nowSeconds)
    throw new GoogleSignInError('issued in the future')
  if (typeof claims.nonce !== 'string' || !safeEqual(claims.nonce, expected.nonce))
    throw new GoogleSignInError('nonce mismatch')
  if (typeof claims.sub !== 'string' || !claims.sub) throw new GoogleSignInError('missing subject')
  if (typeof claims.email !== 'string' || !claims.email.includes('@'))
    throw new GoogleSignInError('missing email')
  if (claims.email_verified !== true && claims.email_verified !== 'true')
    throw new GoogleSignInError('email not verified by Google')
  const name = typeof claims.name === 'string' && claims.name.trim() ? claims.name.trim() : null
  return { sub: claims.sub, email: claims.email.trim().toLowerCase(), name }
}
