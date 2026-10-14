import { checkReadiness } from '@/server/health'
import { withRoute } from '@/server/http/route'

export const dynamic = 'force-dynamic'

/** Readiness: database reachable and migrations current. 503 tells the load balancer to wait. */
export const GET = withRoute(async () => {
  const report = await checkReadiness()
  return Response.json(
    { status: report.ready ? 'ready' : 'not_ready', checks: report.checks },
    { status: report.ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  )
})
