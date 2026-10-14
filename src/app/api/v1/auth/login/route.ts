import { requestMeta } from '@/server/http/client'
import { parseJson, withRoute } from '@/server/http/route'
import { login, loginSchema } from '@/server/services/student-auth'

export const dynamic = 'force-dynamic'

/** Student login. Sets an HTTP-only session cookie; the session is revocable server-side. */
export const POST = withRoute(async (req, { requestId }) => {
  const input = await parseJson(req, loginSchema)
  const { student, setCookie } = await login(input, requestMeta(req, requestId))
  return Response.json(
    { student },
    { headers: { 'Set-Cookie': setCookie, 'Cache-Control': 'no-store' } },
  )
})
