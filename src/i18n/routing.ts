import { defineRouting } from 'next-intl/routing'

/**
 * Locales and URL shape (D-004, D-028): every page lives under /en or /ja; English is the default.
 * Browser language is never used. The choice is remembered in the NEXT_LOCALE cookie (set by proxy.ts).
 */
export const LOCALES = ['en', 'ja'] as const
export type AppLocale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: AppLocale = 'en'
export const LOCALE_COOKIE = 'NEXT_LOCALE'

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeDetection: false,
  localeCookie: false,
})

export function isLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}
