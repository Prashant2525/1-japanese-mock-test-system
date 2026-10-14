import { describe, expect, it } from 'vitest'

import {
  authorizationUrl,
  codeChallenge,
  GOOGLE_AUTHORIZE_URL,
  GoogleSignInError,
  newFlow,
  openFlow,
  profileFromIdToken,
  sealFlow,
  type GoogleConfig,
} from '@/server/auth/google'

const config: GoogleConfig = {
  clientId: 'unit.apps.googleusercontent.com',
  clientSecret: 'not-used-here',
  redirectUri: 'http://localhost:3000/api/v1/auth/google/callback',
}
const SECRET = 'x'.repeat(48)
const NOW = 1_800_000_000

const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
const idToken = (claims: Record<string, unknown>) =>
  `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64(claims)}.signature`
const goodClaims = {
  iss: 'https://accounts.google.com',
  aud: config.clientId,
  azp: config.clientId,
  sub: '1234567890',
  email: 'Student@Example.com',
  email_verified: true,
  name: 'Aarav Sharma',
  nonce: 'n-1',
  iat: NOW - 10,
  exp: NOW + 3600,
}
const expected = { clientId: config.clientId, nonce: 'n-1' }

describe('authorizationUrl', () => {
  it('asks Google for an OpenID code with PKCE, state and nonce', () => {
    const flow = newFlow('ja', '/ja/app')
    const url = new URL(authorizationUrl(config, flow))
    expect(`${url.origin}${url.pathname}`).toBe(GOOGLE_AUTHORIZE_URL)
    const q = url.searchParams
    expect(q.get('client_id')).toBe(config.clientId)
    expect(q.get('redirect_uri')).toBe(config.redirectUri)
    expect(q.get('response_type')).toBe('code')
    expect(q.get('scope')).toBe('openid email profile')
    expect(q.get('state')).toBe(flow.state)
    expect(q.get('nonce')).toBe(flow.nonce)
    expect(q.get('code_challenge_method')).toBe('S256')
    expect(q.get('code_challenge')).toBe(codeChallenge(flow.verifier))
    expect(q.get('code_challenge')).not.toBe(flow.verifier)
    expect(q.get('hl')).toBe('ja')
  })

  it('uses fresh random values for every attempt', () => {
    const a = newFlow('en', '/en/app')
    const b = newFlow('en', '/en/app')
    expect(a.state).not.toBe(b.state)
    expect(a.nonce).not.toBe(b.nonce)
    expect(a.verifier).not.toBe(b.verifier)
  })
})

describe('flow cookie', () => {
  it('round-trips', () => {
    const flow = newFlow('en', '/en/app')
    expect(openFlow(sealFlow(flow, SECRET), SECRET)).toEqual(flow)
  })

  it('rejects tampering, another secret, expiry and garbage', () => {
    const flow = newFlow('en', '/en/app')
    const sealed = sealFlow(flow, SECRET)
    const [, mac] = sealed.split('.')
    expect(openFlow(`${b64({ ...flow, next: '/en/app/x' })}.${mac}`, SECRET)).toBeNull()
    expect(openFlow(sealed, 'y'.repeat(48))).toBeNull()
    expect(openFlow(sealFlow({ ...flow, exp: Date.now() / 1000 - 1 }, SECRET), SECRET)).toBeNull()
    expect(openFlow('nonsense', SECRET)).toBeNull()
    expect(openFlow(undefined, SECRET)).toBeNull()
  })
})

describe('profileFromIdToken', () => {
  it('returns the Google identity with a lower-case email', () => {
    expect(profileFromIdToken(idToken(goodClaims), expected, NOW)).toEqual({
      sub: '1234567890',
      email: 'student@example.com',
      name: 'Aarav Sharma',
    })
  })

  it('accepts the short issuer form and a missing name', () => {
    const { name: _name, ...rest } = goodClaims
    expect(
      profileFromIdToken(idToken({ ...rest, iss: 'accounts.google.com' }), expected, NOW).name,
    ).toBeNull()
  })

  it.each([
    ['another issuer', { iss: 'https://evil.example' }],
    ['another app', { aud: 'other.apps.googleusercontent.com' }],
    ['another authorized party', { azp: 'other.apps.googleusercontent.com' }],
    ['an expired token', { exp: NOW - 3600 }],
    ['a token from the future', { iat: NOW + 3600 }],
    ['a different nonce (replay)', { nonce: 'n-2' }],
    ['no nonce', { nonce: undefined }],
    ['an unverified email', { email_verified: false }],
    ['no email', { email: undefined }],
    ['no subject', { sub: '' }],
  ])('rejects %s', (_label, change) => {
    expect(() => profileFromIdToken(idToken({ ...goodClaims, ...change }), expected, NOW)).toThrow(
      GoogleSignInError,
    )
  })

  it('rejects a malformed token', () => {
    expect(() => profileFromIdToken('not-a-jwt', expected, NOW)).toThrow(GoogleSignInError)
    expect(() => profileFromIdToken('a.%%%.c', expected, NOW)).toThrow(GoogleSignInError)
  })
})
