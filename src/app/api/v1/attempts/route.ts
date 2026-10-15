import { withRoute } from '@/server/http/route'
import { startAttempt } from '@/server/student/areas'

export const dynamic = 'force-dynamic'

/** Starts a mock-test attempt `{ mockTestId }`. Level gate: LD-R02 (403 until determined). */
export const POST = withRoute(async (req) =>
  startAttempt(req.headers, async () => {
    try {
      return await req.json()
    } catch {
      return undefined
    }
  }),
)
