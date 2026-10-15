import { withRoute } from '@/server/http/route'
import { currentStageAttempt } from '@/server/level-check/service'

export const dynamic = 'force-dynamic'

/** Creates or returns the attempt for the current stage (chosen by the server, never the client). */
export const POST = withRoute(async (req) =>
  Response.json(await currentStageAttempt(req.headers), {
    headers: { 'Cache-Control': 'no-store' },
  }),
)
