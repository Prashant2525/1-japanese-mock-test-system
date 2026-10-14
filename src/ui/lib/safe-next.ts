import { LOCALES } from '@/i18n/routing'

/**
 * Accepts a post-login redirect target only if it is a same-site path inside the student area
 * of a known locale (prevents open redirects like ?next=//evil.example or ?next=https://…).
 */
export function safeNextPath(next: string | null | undefined, locale: string): string {
  const fallback = `/${locale}/app`
  if (!next || next.length > 300) return fallback
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback
  const allowed = LOCALES.some((l) => next === `/${l}/app` || next.startsWith(`/${l}/app/`))
  return allowed ? next : fallback
}
