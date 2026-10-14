import { NextResponse, type NextRequest } from 'next/server'

/**
 * Students authenticate only through /api/v1/auth (rate limits, non-enumerating responses, audit).
 * Payload's own student auth and create endpoints would bypass those protections, so they are closed.
 * Admin-panel reads of students (/api/cms/students, /api/cms/students/:id) stay available and
 * are governed by collection access rules.
 */
const BLOCKED_STUDENT_ACTIONS = new Set([
  'login',
  'logout',
  'refresh-token',
  'forgot-password',
  'reset-password',
  'verify',
  'unlock',
  'first-register',
  'me',
  'init',
  'access',
])

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  // The admin two-factor plugin needs the current path in server components (payload-totp README).
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const response = NextResponse.next()
    response.headers.append('x-pathname', pathname)
    return response
  }
  const segments = pathname.split('/').filter(Boolean) // api, cms, students, ...
  const action = segments[3]
  const isCreate = segments.length === 3 && request.method === 'POST'
  if (isCreate || (action && BLOCKED_STUDENT_ACTIONS.has(action))) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Not found.', details: null, requestId: null } },
      { status: 404 },
    )
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/cms/students', '/api/cms/students/:path*'],
}
