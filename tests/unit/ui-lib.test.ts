import { afterEach, describe, expect, it, vi } from 'vitest'

import { apiRequest, errorLabelKey } from '@/ui/lib/api'
import { safeNextPath } from '@/ui/lib/safe-next'

describe('safeNextPath (no open redirects)', () => {
  it('accepts student-area paths', () => {
    expect(safeNextPath('/en/app', 'en')).toBe('/en/app')
    expect(safeNextPath('/ja/app/results', 'ja')).toBe('/ja/app/results')
  })

  it.each([
    ['//evil.example', 'protocol-relative'],
    ['https://evil.example/en/app', 'absolute URL'],
    ['/\\evil.example', 'backslash trick'],
    ['/en/admin', 'outside the student area'],
    ['/en/apple', 'look-alike prefix'],
    [null, 'missing'],
  ] as [string | null, string][])('rejects %s (%s)', (next) => {
    expect(safeNextPath(next, 'en')).toBe('/en/app')
  })
})

describe('apiRequest', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns data for a successful call', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ student: { id: 1 } }), { status: 200 })),
    )
    const res = await apiRequest<{ student: { id: number } }>('/api/v1/me')
    expect(res).toEqual({ ok: true, status: 200, data: { student: { id: 1 } } })
  })

  it('surfaces the error code and Retry-After', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'x' } }), {
            status: 429,
            headers: { 'retry-after': '42' },
          }),
      ),
    )
    const res = await apiRequest('/api/v1/auth/login', { body: {} })
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('RATE_LIMITED')
      expect(res.error.retryAfterSeconds).toBe(42)
      expect(errorLabelKey(res.error)).toEqual({
        key: 'errors.RATE_LIMITED_SECONDS',
        values: { seconds: 42 },
      })
    }
  })

  it('reports network failures without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('offline'))),
    )
    const res = await apiRequest('/api/v1/me')
    expect(res).toMatchObject({ ok: false, status: 0, error: { code: 'NETWORK_ERROR' } })
  })

  it('falls back to a generic message for unknown or non-JSON errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>Bad gateway</html>', { status: 502 })),
    )
    const res = await apiRequest('/api/v1/me')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(errorLabelKey(res.error)).toEqual({ key: 'errors.INTERNAL' })
    expect(errorLabelKey({ code: 'SOMETHING_NEW', message: '' })).toEqual({
      key: 'errors.INTERNAL',
    })
  })
})
