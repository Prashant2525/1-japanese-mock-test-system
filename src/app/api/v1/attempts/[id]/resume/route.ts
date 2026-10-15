import { resumeAttempt } from '@/server/attempts/service'
import { withRoute } from '@/server/http/route'

import { attemptId } from '../params'

export const dynamic = 'force-dynamic'

/** This tab takes over the attempt (D-027, latest tab wins). */
export const POST = withRoute<{ id: string }>(async (req, { params }) =>
  Response.json(await resumeAttempt(req.headers, attemptId(params.id)), {
    headers: { 'Cache-Control': 'no-store' },
  }),
)
