import { saveAnswer, saveAnswerSchema } from '@/server/attempts/service'
import { parseJson, withRoute } from '@/server/http/route'

import { attemptId } from '../../params'

export const dynamic = 'force-dynamic'

/** Saves one answer (and the review flag) while the attempt is open, for the current tab only. */
export const PUT = withRoute<{ id: string; questionKey: string }>(async (req, { params }) => {
  const input = await parseJson(req, saveAnswerSchema)
  return Response.json(
    await saveAnswer(
      req.headers,
      attemptId(params.id),
      decodeURIComponent(params.questionKey),
      input,
    ),
    { headers: { 'Cache-Control': 'no-store' } },
  )
})
