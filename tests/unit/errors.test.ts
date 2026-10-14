import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { AppError, ERROR_STATUS, toErrorBody } from '@/server/http/errors'
import { parseJson, withRoute } from '@/server/http/route'

describe('toErrorBody', () => {
  it('maps an AppError to its status and code', () => {
    const { status, body } = toErrorBody(new AppError('ATTEMPT_CLOSED'), 'req_test1234')
    expect(status).toBe(410)
    expect(body.error.code).toBe('ATTEMPT_CLOSED')
    expect(body.error.requestId).toBe('req_test1234')
    expect(body.error.message).toMatch(/submitted/)
  })

  it('maps a ZodError to VALIDATION_FAILED with field paths', () => {
    const result = z.object({ age: z.number() }).safeParse({ age: 'x' })
    expect(result.success).toBe(false)
    const { status, body } = toErrorBody(result.error, 'req_test1234')
    expect(status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_FAILED')
    expect(body.error.details).toEqual([{ path: 'age', message: expect.any(String) }])
  })

  it('hides the details of unknown errors', () => {
    const { status, body } = toErrorBody(new Error('db password is hunter2'), 'req_test1234')
    expect(status).toBe(500)
    expect(body.error.code).toBe('INTERNAL')
    expect(JSON.stringify(body)).not.toContain('hunter2')
  })

  it('has a status for every code', () => {
    for (const status of Object.values(ERROR_STATUS)) {
      expect(status).toBeGreaterThanOrEqual(400)
    }
  })
})

describe('withRoute', () => {
  it('adds a generated X-Request-Id to successful responses', async () => {
    const handler = withRoute(async () => Response.json({ ok: true }))
    const res = await handler(new Request('http://test.local/x'))
    expect(res.status).toBe(200)
    expect(res.headers.get('X-Request-Id')).toMatch(/^req_[0-9a-f-]{36}$/)
  })

  it('keeps a well-formed incoming request ID and ignores a malformed one', async () => {
    const handler = withRoute(async () => new Response(null, { status: 204 }))
    const kept = await handler(
      new Request('http://test.local/x', { headers: { 'x-request-id': 'abc12345XYZ' } }),
    )
    expect(kept.headers.get('X-Request-Id')).toBe('abc12345XYZ')
    const replaced = await handler(
      new Request('http://test.local/x', {
        headers: { 'x-request-id': '<script>alert(1)</script>' },
      }),
    )
    expect(replaced.headers.get('X-Request-Id')).toMatch(/^req_/)
  })

  it('converts thrown AppErrors into the error model', async () => {
    const handler = withRoute(async () => {
      throw new AppError('LEVEL_NOT_DETERMINED')
    })
    const res = await handler(new Request('http://test.local/x'))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.code).toBe('LEVEL_NOT_DETERMINED')
    expect(body.error.requestId).toBe(res.headers.get('X-Request-Id'))
  })

  it('returns INTERNAL for unexpected errors', async () => {
    const handler = withRoute(async () => {
      throw new TypeError('boom')
    })
    const res = await handler(new Request('http://test.local/x'))
    expect(res.status).toBe(500)
    expect((await res.json()).error.code).toBe('INTERNAL')
  })

  it('passes resolved route params to the handler', async () => {
    const handler = withRoute<{ id: string }>(async (_req, ctx) => Response.json(ctx.params))
    const res = await handler(new Request('http://test.local/x'), {
      params: Promise.resolve({ id: '42' }),
    })
    expect(await res.json()).toEqual({ id: '42' })
  })
})

describe('parseJson', () => {
  const schema = z.strictObject({ name: z.string() })

  it('parses a valid body', async () => {
    const req = new Request('http://test.local/x', {
      method: 'POST',
      body: JSON.stringify({ name: 'Aiko' }),
    })
    expect(await parseJson(req, schema)).toEqual({ name: 'Aiko' })
  })

  it('rejects invalid JSON with VALIDATION_FAILED', async () => {
    const req = new Request('http://test.local/x', { method: 'POST', body: '{not json' })
    await expect(parseJson(req, schema)).rejects.toMatchObject({ code: 'VALIDATION_FAILED' })
  })

  it('rejects unknown fields', async () => {
    const req = new Request('http://test.local/x', {
      method: 'POST',
      body: JSON.stringify({ name: 'Aiko', role: 'admin' }),
    })
    await expect(parseJson(req, schema)).rejects.toBeInstanceOf(z.ZodError)
  })
})
