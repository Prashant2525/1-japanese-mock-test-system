import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Suspense, type ReactNode } from 'react'

import { Link } from '@/i18n/navigation'
import { LanguageToggle } from '@/ui/components/language-toggle'
import { Logo } from '@/ui/components/logo'
import { RouteStations } from '@/ui/components/route-stations'
import { SkylineLayer } from '@/ui/components/skyline'

/**
 * Auth pages (Direction B): a night "station" panel with the route N5 → N4 → N3 and skyline,
 * beside a calm day card holding the form. Stacks on phones.
 */
export default async function AuthLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  // Every layout and page must set the locale before translating (next-intl caches per request).
  setRequestLocale((await params).locale)
  const t = await getTranslations()
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:grid-rows-1">
      <aside className="on-night relative isolate overflow-hidden bg-night px-4 pt-4 pb-6 text-on-night sm:px-6 lg:px-12 lg:pt-10 lg:pb-10">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="rounded-card">
            <Logo
              variant="wordmark"
              tone="night"
              className="h-9 sm:h-10"
              alt={t('meta.siteName')}
            />
          </Link>
          <Suspense fallback={null}>
            <LanguageToggle tone="night" />
          </Suspense>
        </div>
        <div className="mt-5 max-w-md lg:mt-24">
          <p className="text-lg leading-snug font-black lg:text-3xl">{t('authPanel.title')}</p>
          <p className="mt-3 hidden text-muted-on-night lg:block">{t('authPanel.body')}</p>
          <div className="mt-6 hidden lg:block">
            <RouteStations label={t('authPanel.stations')} />
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 hidden h-1/2 lg:block"
          aria-hidden="true"
        >
          <SkylineLayer layer={1} className="absolute inset-0 h-full w-full" />
          <SkylineLayer layer={2} className="absolute inset-0 h-full w-full" />
          <SkylineLayer layer={3} className="absolute inset-0 h-full w-full" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-signal" aria-hidden="true" />
      </aside>
      <main
        id="main"
        tabIndex={-1}
        className="flex items-start justify-center px-4 py-10 outline-none sm:py-16 lg:items-center"
      >
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}
