import { requestMeta } from '@/server/http/client'
import { parseJson, withRoute } from '@/server/http/route'
import { register, registerSchema } from '@/server/services/student-auth'

export const dynamic = 'force-dynamic'

/** Sign up. Same 202 response whether or not the email already has an account (no enumeration). */
export const POST = withRoute(async (req, { requestId }) => {
  const input = await parseJson(req, registerSchema)
  await register(input, requestMeta(req, requestId))
  return Response.json({ status: 'accepted' }, { status: 202 })
})
