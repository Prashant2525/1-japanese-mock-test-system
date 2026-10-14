import { parseJson, withRoute } from '@/server/http/route'
import { preferencesSchema, updatePreferences } from '@/server/services/student-auth'

export const dynamic = 'force-dynamic'

export const PATCH = withRoute(async (req) => {
  const input = await parseJson(req, preferencesSchema)
  return Response.json({ student: await updatePreferences(req.headers, input) })
})
