import { NextResponse, type NextRequest } from 'next/server'

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from './i18n/routing'

/**
 * Request gatekeeper (runs before every matched request). Responsibilities, in order:
 * 1. Admin pages: pass the pathname header the two-factor plugin needs.
 * 2. Block Payload's own student auth/create endpoints: students authenticate only through
 *    /api/v1/auth (rate limits, non-enumerating responses, audit). Admin reads of
 *    /api/cms/students stay available and are governed by collection access rules.
 * 3. Website pages: every page lives under /en or /ja (D-028). Unprefixed paths redirect to the
 *    remembered language (NEXT_LOCALE cookie) or English — never the browser language.
 * 4. Student area: no session cookie → redirect to login (convenience only; pages re-check).
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

const SESSION_COOKIE = 'payload-token'
const ONE_YEAR = 60 * 60 * 24 * 365

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const response = NextResponse.next()
    response.headers.append('x-pathname', pathname)
    return response
  }

  if (pathname === '/api/cms/students' || pathname.startsWith('/api/cms/students/')) {
    const segments = pathname.split('/').filter(Boolean) // api, cms, students, action?
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

  if (pathname.startsWith('/api/') || pathname === '/healthz' || pathname === '/readyz') {
    return NextResponse.next()
  }

  const [first, second] = pathname.split('/').filter(Boolean)
  if (!isLocale(first)) {
    const remembered = request.cookies.get(LOCALE_COOKIE)?.value
    const locale = isLocale(remembered) ? remembered : DEFAULT_LOCALE
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
    return NextResponse.redirect(url)
  }

  if (second === 'app' && !request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone()
    url.pathname = `/${first}/login`
    url.search = `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }

  const response = NextResponse.next()
  // Only a real visit changes the remembered language. Next.js prefetches visible links (including
  // the language switch) in the background; those requests must not flip the cookie.
  const isPrefetch =
    request.headers.has('next-router-prefetch') ||
    /prefetch/i.test(request.headers.get('sec-purpose') ?? request.headers.get('purpose') ?? '')
  if (!isPrefetch && request.cookies.get(LOCALE_COOKIE)?.value !== first) {
    response.cookies.set(LOCALE_COOKIE, first, { path: '/', maxAge: ONE_YEAR, sameSite: 'lax' })
  }
  return response
}

export const config = {
  // Everything except Next.js internals and files with an extension (images, fonts, brand SVGs).
  matcher: ['/((?!_next/|_vercel/|.*\\.[a-zA-Z0-9]+$).*)'],
}
