import { requestMeta } from '@/server/http/client'
import { parseJson, withRoute } from '@/server/http/route'
import { resetPassword, resetSchema } from '@/server/services/student-auth'

export const dynamic = 'force-dynamic'

export const POST = withRoute(async (req, { requestId }) => {
  const input = await parseJson(req, resetSchema)
  await resetPassword(input, requestMeta(req, requestId))
  return Response.json({ status: 'password_reset' })
})
