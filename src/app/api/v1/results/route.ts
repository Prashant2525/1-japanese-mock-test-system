import { withRoute } from '@/server/http/route'
import { listResults } from '@/server/student/areas'

export const dynamic = 'force-dynamic'

/** The student's own results. Level gate: LD-R02 (403 until determined). */
export const GET = withRoute(async (req) => {
  const q = new URL(req.url).searchParams
  const page = Math.max(1, Number(q.get('page')) || 1)
  const limit = Math.min(50, Math.max(1, Number(q.get('limit')) || 20))
  return Response.json(await listResults(req.headers, page, limit), {
    headers: { 'Cache-Control': 'no-store' },
  })
})
