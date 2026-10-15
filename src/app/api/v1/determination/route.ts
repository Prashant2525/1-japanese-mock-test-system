import { withRoute } from '@/server/http/route'
import { levelCheckState } from '@/server/level-check/service'

export const dynamic = 'force-dynamic'

/** The student's level check: stages, progress, current attempt, assigned level. */
export const GET = withRoute(async (req) =>
  Response.json(await levelCheckState(req.headers), { headers: { 'Cache-Control': 'no-store' } }),
)
