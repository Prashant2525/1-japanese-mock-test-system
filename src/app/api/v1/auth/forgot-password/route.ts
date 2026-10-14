import { requestMeta } from '@/server/http/client'
import { parseJson, withRoute } from '@/server/http/route'
import { emailOnlySchema, forgotPassword } from '@/server/services/student-auth'

export const dynamic = 'force-dynamic'

/** Always 202, whether or not the email has an account (no enumeration). */
export const POST = withRoute(async (req, { requestId }) => {
  const { email } = await parseJson(req, emailOnlySchema)
  await forgotPassword(email, requestMeta(req, requestId))
  return Response.json({ status: 'accepted' }, { status: 202 })
})
