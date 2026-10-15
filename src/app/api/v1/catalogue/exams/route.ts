import { payloadClient } from '@/server/auth/session'
import { examCatalogue } from '@/server/catalogue/queries'
import { withRoute } from '@/server/http/route'

export const dynamic = 'force-dynamic'

/**
 * Public exam catalogue (Phase 13): enabled exam types, their levels for mock tests and each
 * level's sections, in the requested language. No sign-in needed; nothing private is included.
 * A CMS change shows within a minute (short shared cache).
 */
export const GET = withRoute(async (req) => {
  const locale = new URL(req.url).searchParams.get('locale') === 'ja' ? 'ja' : 'en'
  return Response.json(
    { exams: await examCatalogue(await payloadClient(), locale) },
    { headers: { 'Cache-Control': 'public, max-age=60' } },
  )
})
