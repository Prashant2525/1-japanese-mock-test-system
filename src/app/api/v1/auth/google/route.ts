import { requestMeta } from '@/server/http/client'
import { withRoute } from '@/server/http/route'
import { googleRedirect, startGoogleSignIn } from '@/server/services/google-auth'

export const dynamic = 'force-dynamic'

/** "Continue with Google": sends the browser to Google's account chooser (D-066). */
export const GET = withRoute(async (req, { requestId }) => {
  const url = new URL(req.url)
  const locale = url.searchParams.get('locale') === 'ja' ? 'ja' : 'en'
  return googleRedirect(requestId, () =>
    startGoogleSignIn({ locale, next: url.searchParams.get('next') }, requestMeta(req, requestId)),
  )
})
