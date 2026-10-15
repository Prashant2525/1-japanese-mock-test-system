import { AppError } from '@/server/http/errors'
import { withRoute } from '@/server/http/route'
import { startLevelCheck, startSchema } from '@/server/level-check/service'

export const dynamic = 'force-dynamic'

/** Starts the level check at the first stage (N5). Accepts no level or stage (LD-R03). */
export const POST = withRoute(async (req) => {
  // An empty body is fine; anything else must be an empty JSON object (no level, no stage).
  const text = (await req.text()).trim()
  let body: unknown = {}
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      throw new AppError('VALIDATION_FAILED')
    }
  }
  startSchema.parse(body)
  return Response.json(await startLevelCheck(req.headers), {
    headers: { 'Cache-Control': 'no-store' },
  })
})
