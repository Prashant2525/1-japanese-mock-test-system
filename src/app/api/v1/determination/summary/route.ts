import { withRoute } from '@/server/http/route'
import { levelCheckSummary } from '@/server/level-check/service'

export const dynamic = 'force-dynamic'

/** The "Your level" summary after the level check (D-012). */
export const GET = withRoute(async (req) =>
  Response.json(await levelCheckSummary(req.headers), {
    headers: { 'Cache-Control': 'no-store' },
  }),
)
