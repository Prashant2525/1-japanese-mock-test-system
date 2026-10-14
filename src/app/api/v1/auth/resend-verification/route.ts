import { requestMeta } from '@/server/http/client'
import { parseJson, withRoute } from '@/server/http/route'
import { emailOnlySchema, resendVerification } from '@/server/services/student-auth'

export const dynamic = 'force-dynamic'

export const POST = withRoute(async (req, { requestId }) => {
  const { email } = await parseJson(req, emailOnlySchema)
  await resendVerification(email, requestMeta(req, requestId))
  return Response.json({ status: 'accepted' }, { status: 202 })
})
