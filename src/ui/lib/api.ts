/**
 * Browser client for /api/v1 (API_DOCUMENTATION §2–3). Always same-origin with cookies, JSON in
 * and out, and a uniform result: never throws for HTTP or network errors, so every form can show
 * a translated message from the error `code`.
 */
export type ApiErrorInfo = {
  code: string
  message: string
  details?: unknown
  retryAfterSeconds?: number
}

export type ApiResult<T> =
  { ok: true; status: number; data: T } | { ok: false; status: number; error: ApiErrorInfo }

type Options = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

export async function apiRequest<T = unknown>(
  path: string,
  options: Options = {},
): Promise<ApiResult<T>> {
  const method = options.method ?? (options.body === undefined ? 'GET' : 'POST')
  let res: Response
  try {
    res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers:
        options.body === undefined
          ? { accept: 'application/json' }
          : { 'content-type': 'application/json', accept: 'application/json' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    })
  } catch {
    return { ok: false, status: 0, error: { code: 'NETWORK_ERROR', message: '' } }
  }

  const text = await res.text()
  let json: unknown = null
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      json = null
    }
  }

  if (res.ok) return { ok: true, status: res.status, data: json as T }

  const err = (json as { error?: Partial<ApiErrorInfo> } | null)?.error
  const retryHeader = Number(res.headers.get('retry-after'))
  return {
    ok: false,
    status: res.status,
    error: {
      code: typeof err?.code === 'string' ? err.code : res.status >= 500 ? 'INTERNAL' : 'FORBIDDEN',
      message: typeof err?.message === 'string' ? err.message : '',
      details: err?.details,
      retryAfterSeconds: Number.isFinite(retryHeader) && retryHeader > 0 ? retryHeader : undefined,
    },
  }
}

/** Known error codes that have a translated message under `errors.*`. */
const KNOWN_ERRORS = new Set([
  'VALIDATION_FAILED',
  'INVALID_TOKEN',
  'UNAUTHENTICATED',
  'SESSION_EXPIRED',
  'INVALID_CREDENTIALS',
  'FORBIDDEN',
  'ACCOUNT_DISABLED',
  'EMAIL_NOT_VERIFIED',
  'RATE_LIMITED',
  'NETWORK_ERROR',
  'INTERNAL',
])

/** The label key for an error (falls back to the generic message). */
export function errorLabelKey(error: ApiErrorInfo): {
  key: string
  values?: Record<string, number>
} {
  if (error.code === 'RATE_LIMITED' && error.retryAfterSeconds && error.retryAfterSeconds <= 120) {
    return { key: 'errors.RATE_LIMITED_SECONDS', values: { seconds: error.retryAfterSeconds } }
  }
  return { key: `errors.${KNOWN_ERRORS.has(error.code) ? error.code : 'INTERNAL'}` }
}
