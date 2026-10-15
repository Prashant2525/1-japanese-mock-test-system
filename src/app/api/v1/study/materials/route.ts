import { withRoute } from '@/server/http/route'
import { requireStudentWithLevel } from '@/server/student/gate'
import { listStudyMaterialsFor } from '@/server/study/service'

export const dynamic = 'force-dynamic'

/**
 * Study materials for the student's level and below (LD-R02 gate first). Filters: `level` (code),
 * `category` (key), `q` (search), `page`, `limit`, `locale`.
 */
export const GET = withRoute(async (req) => {
  const student = await requireStudentWithLevel(req.headers)
  const q = new URL(req.url).searchParams
  return Response.json(
    await listStudyMaterialsFor(student, {
      locale: q.get('locale') === 'ja' ? 'ja' : 'en',
      level: q.get('level'),
      category: q.get('category'),
      q: q.get('q'),
      page: Math.max(1, Number(q.get('page')) || 1),
      limit: Math.min(50, Math.max(1, Number(q.get('limit')) || 24)),
    }),
    { headers: { 'Cache-Control': 'no-store' } },
  )
})
