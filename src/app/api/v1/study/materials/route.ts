import { withRoute } from '@/server/http/route'
import { listStudyMaterials } from '@/server/student/areas'

export const dynamic = 'force-dynamic'

/** Study materials for the student's level and below. Level gate: LD-R02 (403 until determined). */
export const GET = withRoute(async (req) =>
  Response.json(await listStudyMaterials(req.headers), {
    headers: { 'Cache-Control': 'no-store' },
  }),
)
