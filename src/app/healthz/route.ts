import { withRoute } from '@/server/http/route'

export const dynamic = 'force-dynamic'

/** Liveness: the process is up and serving requests. No dependencies are checked here. */
export const GET = withRoute(async () =>
  Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } }),
)
