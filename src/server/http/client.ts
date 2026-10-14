import { getEnv } from '../env'
import { AppError } from './errors'

/**
 * Client IP for rate limiting and audit. Only trusts X-Forwarded-For when TRUST_PROXY is on
 * (behind our own reverse proxy); otherwise returns null and per-IP limits are skipped.
 */
export function clientIp(headers: Headers): string | null {
  if (!getEnv().TRUST_PROXY) return null
  const forwarded = headers.get('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  if (first && /^[0-9a-fA-F:.]{3,45}$/.test(first)) return first
  const real = headers.get('x-real-ip')?.trim()
  return real && /^[0-9a-fA-F:.]{3,45}$/.test(real) ? real : null
}

export function userAgent(headers: Headers): string | null {
  return headers.get('user-agent')?.slice(0, 300) ?? null
}

/**
 * CSRF guard for cookie-authenticated mutations (API_DOCUMENTATION §2).
 * Browsers always send Origin or Sec-Fetch-Site on cross-site POSTs; reject when they point elsewhere.
 * Non-browser clients (no such headers) are allowed; they cannot carry a victim's cookies.
 */
export function assertSameOrigin(req: Request): void {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return
  const expected = new URL(getEnv().APP_URL).origin
  const origin = req.headers.get('origin')
  if (origin && origin !== expected) throw new AppError('FORBIDDEN', 'Cross-site request refused.')
  const site = req.headers.get('sec-fetch-site')
  if (!origin && site && site !== 'same-origin' && site !== 'none') {
    throw new AppError('FORBIDDEN', 'Cross-site request refused.')
  }
}

/** Request facts for services and audit (IP only when TRUST_PROXY is on). */
export function requestMeta(req: Request, requestId: string) {
  return { ip: clientIp(req.headers), userAgent: userAgent(req.headers), requestId }
}
