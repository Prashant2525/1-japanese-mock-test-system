import { describe, expect, it } from 'vitest'

import { GET as healthz } from '@/app/healthz/route'
import { GET as readyz } from '@/app/readyz/route'

describe('health endpoints', () => {
  it('/healthz reports the process is alive', async () => {
    const res = await healthz(new Request('http://localhost/healthz'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(res.headers.get('X-Request-Id')).toBeTruthy()
  })

  it('/readyz reports ready when the database is reachable and migrations are current', async () => {
    const res = await readyz(new Request('http://localhost/readyz'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toEqual({ status: 'ready', checks: { database: 'ok', migrations: 'ok' } })
  })

  it('/readyz exposes no connection details', async () => {
    const res = await readyz(new Request('http://localhost/readyz'))
    const text = await res.text()
    expect(text).not.toMatch(/postgres|localhost|5433|password/i)
  })
})
