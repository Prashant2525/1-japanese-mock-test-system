import type { z } from 'zod'

import { logger } from '../logger'
import { AppError, toErrorBody } from './errors'

export type RouteContext<P = Record<string, string>> = {
  requestId: string
  params: P
}

type Handler<P> = (req: Request, ctx: RouteContext<P>) => Promise<Response>

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/

function requestIdFrom(req: Request): string {
  const incoming = req.headers.get('x-request-id')
  return incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : `req_${crypto.randomUUID()}`
}

/**
 * Wraps a Next.js route handler with request IDs, the shared error model and logging.
 * Every /api/v1 handler must use this.
 */
export function withRoute<P = Record<string, string>>(handler: Handler<P>) {
  return async (req: Request, nextCtx?: { params?: Promise<P> }): Promise<Response> => {
    const requestId = requestIdFrom(req)
    const started = performance.now()
    let response: Response
    try {
      const params = ((await nextCtx?.params) ?? {}) as P
      response = await handler(req, { requestId, params })
    } catch (err) {
      const { status, body } = toErrorBody(err, requestId)
      if (status >= 500) {
        logger.error({ requestId, err }, 'request failed')
      } else {
        logger.info({ requestId, code: body.error.code }, 'request rejected')
      }
      response = Response.json(body, { status })
    }
    response.headers.set('X-Request-Id', requestId)
    logger.debug(
      {
        requestId,
        method: req.method,
        path: new URL(req.url).pathname,
        status: response.status,
        ms: Math.round(performance.now() - started),
      },
      'request',
    )
    return response
  }
}

/** Parses and validates a JSON body. Unknown fields are rejected by using strict schemas. */
export async function parseJson<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    throw new AppError('VALIDATION_FAILED', undefined, [
      { path: '', message: 'Body must be valid JSON' },
    ])
  }
  return schema.parse(raw)
}
