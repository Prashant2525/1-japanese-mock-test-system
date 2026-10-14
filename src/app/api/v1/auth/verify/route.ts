import { requestMeta } from '@/server/http/client'
import { parseJson, withRoute } from '@/server/http/route'
import { tokenSchema, verifyEmail } from '@/server/services/student-auth'

export const dynamic = 'force-dynamic'

export const POST = withRoute(async (req, { requestId }) => {
  const { token } = await parseJson(req, tokenSchema)
  await verifyEmail(token, requestMeta(req, requestId))
  return Response.json({ status: 'verified' })
})
