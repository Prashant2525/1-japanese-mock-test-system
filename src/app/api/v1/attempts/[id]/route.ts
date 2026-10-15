import { getAttempt } from '@/server/attempts/service'
import { withRoute } from '@/server/http/route'

import { attemptId } from './params'

export const dynamic = 'force-dynamic'

/** An own attempt: questions WITHOUT answers, saved answers, deadline and server time. */
export const GET = withRoute<{ id: string }>(async (req, { params }) =>
  Response.json(await getAttempt(req.headers, attemptId(params.id)), {
    headers: { 'Cache-Control': 'no-store' },
  }),
)
