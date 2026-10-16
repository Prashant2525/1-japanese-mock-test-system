import { headers } from 'next/headers'

import { redirect } from '@/i18n/navigation'
import { currentStudentForPage, type SessionStudent } from '@/server/auth/session'
import { hasDeterminedLevel } from '@/server/student/gate'

/** Student-area pages and their paths under /{locale}/app. */
export const AREA_PATHS = {
  home: '/app',
  'level-check': '/app/level-check',
  study: '/app/study',
  'mock-tests': '/app/mock-tests',
  results: '/app/results',
  'your-level': '/app/your-level',
  profile: '/app/profile',
} as const

export type StudentArea = keyof typeof AREA_PATHS

/**
 * Server-side page guard (LD-R01, LD-R02). Runs on every request to a student page:
 * - not signed in or suspended → login, then back here;
 * - no level yet → the level check (every other area is closed);
 * - level assigned → the level check is closed (no rerun, D-013) and sends them home.
 * Decided only from the session's stored student, never from the URL, query or browser storage.
 */
export async function studentPage(locale: string, area: StudentArea): Promise<SessionStudent> {
  const student = await currentStudentForPage(await headers())
  if (!student || student.status === 'suspended') {
    redirect({
      href: { pathname: '/login', query: { next: `/${locale}${AREA_PATHS[area]}` } },
      locale,
    })
    throw new Error('unreachable')
  }
  const determined = hasDeterminedLevel(student)
  if (!determined && area !== 'level-check') redirect({ href: AREA_PATHS['level-check'], locale })
  if (determined && area === 'level-check') redirect({ href: AREA_PATHS.home, locale })
  return student
}
