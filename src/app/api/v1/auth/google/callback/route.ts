import { requestMeta } from '@/server/http/client'
import { withRoute } from '@/server/http/route'
import { finishGoogleSignIn, googleRedirect } from '@/server/services/google-auth'

export const dynamic = 'force-dynamic'

/**
 * Google sends the browser back here (the "Authorized redirect URI" in Google Cloud).
 * Always answers with a redirect: to the student area, or to the login page with a reason.
 */
export const GET = withRoute(async (req, { requestId }) =>
  googleRedirect(requestId, () =>
    finishGoogleSignIn(
      new URL(req.url).searchParams,
      req.headers.get('cookie'),
      requestMeta(req, requestId),
    ),
  ),
)
