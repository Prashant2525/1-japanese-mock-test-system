'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'

import { Link, usePathname } from '@/i18n/navigation'

import { cn } from '../lib/cn'

const OPTIONS = [
  { locale: 'en', label: 'EN', lang: 'en' },
  { locale: 'ja', label: '日本語', lang: 'ja' },
] as const

/**
 * EN / 日本語 switch (D-028). Real links (work without JavaScript); the current page and query are kept.
 * The choice is remembered by the NEXT_LOCALE cookie set in proxy.ts.
 */
export function LanguageToggle({ tone = 'day' }: { tone?: 'day' | 'night' }) {
  const t = useTranslations('a11y')
  const current = useLocale()
  const pathname = usePathname()
  const search = useSearchParams()
  const query = Object.fromEntries(search.entries())
  return (
    <nav aria-label={t('languageSwitcher')}>
      <ul
        className={cn(
          'flex rounded-full border p-0.5 text-sm font-bold',
          tone === 'night' ? 'border-on-night/40' : 'border-line bg-surface',
        )}
      >
        {OPTIONS.map((o) => {
          const active = o.locale === current
          return (
            <li key={o.locale}>
              <Link
                href={{ pathname, query }}
                locale={o.locale}
                prefetch={false}
                lang={o.lang}
                hrefLang={o.lang}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'inline-flex min-h-9 min-w-11 items-center justify-center rounded-full px-2.5 whitespace-nowrap transition-colors duration-200 sm:px-3',
                  active
                    ? tone === 'night'
                      ? 'bg-on-night text-night'
                      : 'bg-night text-white'
                    : tone === 'night'
                      ? 'text-on-night hover:bg-on-night/10'
                      : 'text-ink hover:bg-ink/5',
                )}
              >
                {o.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
