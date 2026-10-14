import { withRoute } from '@/server/http/route'
import { me } from '@/server/services/student-auth'

export const dynamic = 'force-dynamic'

export const GET = withRoute(async (req) =>
  Response.json({ student: await me(req.headers) }, { headers: { 'Cache-Control': 'no-store' } }),
)
