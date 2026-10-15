import { withRoute } from '@/server/http/route'
import { listResults } from '@/server/student/areas'

export const dynamic = 'force-dynamic'

/** The student's own results. Level gate: LD-R02 (403 until determined). */
export const GET = withRoute(async (req) =>
  Response.json(await listResults(req.headers), { headers: { 'Cache-Control': 'no-store' } }),
)
