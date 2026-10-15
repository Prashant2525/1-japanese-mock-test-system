import { submitAttempt } from '@/server/attempts/service'
import { withRoute } from '@/server/http/route'

import { attemptId } from '../params'

export const dynamic = 'force-dynamic'

/** Submits the attempt. Idempotent: a repeat returns the same result. */
export const POST = withRoute<{ id: string }>(async (req, { params }) =>
  Response.json(await submitAttempt(req.headers, attemptId(params.id)), {
    headers: { 'Cache-Control': 'no-store' },
  }),
)
