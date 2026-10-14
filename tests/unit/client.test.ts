import { describe, expect, it } from 'vitest'

import { assertSameOrigin, clientIp } from '@/server/http/client'

const req = (method: string, headers: Record<string, string>) =>
  new Request('http://localhost:3000/api/v1/x', { method, headers })

describe('assertSameOrigin', () => {
  it('allows same-origin browser requests and non-browser clients', () => {
    expect(() => assertSameOrigin(req('POST', { origin: 'http://localhost:3000' }))).not.toThrow()
    expect(() => assertSameOrigin(req('POST', { 'sec-fetch-site': 'same-origin' }))).not.toThrow()
    expect(() => assertSameOrigin(req('POST', {}))).not.toThrow()
  })

  it('rejects cross-site browser requests', () => {
    expect(() => assertSameOrigin(req('POST', { origin: 'https://evil.example' }))).toThrow(
      /Cross-site/,
    )
    expect(() => assertSameOrigin(req('POST', { 'sec-fetch-site': 'cross-site' }))).toThrow(
      /Cross-site/,
    )
  })

  it('does not check safe methods', () => {
    expect(() => assertSameOrigin(req('GET', { origin: 'https://evil.example' }))).not.toThrow()
  })
})

describe('clientIp (TRUST_PROXY on)', () => {
  it('takes the first X-Forwarded-For address', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe(
      '203.0.113.7',
    )
  })

  it('ignores malformed values', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '<script>' }))).toBeNull()
  })
})
