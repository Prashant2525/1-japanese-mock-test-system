import { requestMeta } from '@/server/http/client'
import { withRoute } from '@/server/http/route'
import { logout } from '@/server/services/student-auth'

export const dynamic = 'force-dynamic'

export const POST = withRoute(async (req, { requestId }) => {
  const expired = await logout(req.headers, requestMeta(req, requestId))
  return new Response(null, { status: 204, headers: { 'Set-Cookie': expired } })
})
