import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { Button } from '@/ui/components/button'
import { Reveal } from '@/ui/components/reveal'
import { SkylineLayer } from '@/ui/components/skyline'
import { StationBadge } from '@/ui/components/station-badge'

/**
 * Temporary home page (KI-08) in the approved design. The real CMS-built home page (blocks,
 * parallax hero, route map) arrives in Phase 18. All text comes from UI labels.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('home')
  return (
    <section className="on-night relative isolate overflow-hidden bg-night text-on-night">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[60%]"
        aria-hidden="true"
      >
        <SkylineLayer layer={1} className="absolute inset-0 h-full w-full" />
        <SkylineLayer layer={2} className="absolute inset-0 h-full w-full" />
        <SkylineLayer layer={3} className="absolute inset-0 h-full w-full" />
      </div>
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-40 sm:pt-24 sm:pb-56">
        <Reveal>
          <p className="font-sign text-sm font-bold tracking-[0.2em] text-[#FF8A8F] uppercase">
            {t('eyebrow')}
          </p>
        </Reveal>
        <Reveal delayMs={80}>
          <h1 className="mt-4 max-w-3xl text-4xl leading-tight font-black sm:text-6xl">
            {t('title')}{' '}
            <StationBadge
              level={t('titleStation')}
              className="border-4 border-line-n5 bg-white align-middle text-3xl text-night sm:text-5xl"
            />
          </h1>
        </Reveal>
        <Reveal delayMs={160}>
          <p className="mt-5 max-w-xl text-lg text-muted-on-night">{t('underConstruction')}</p>
        </Reveal>
        <Reveal delayMs={240} className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/signup">{t('ctaSignup')}</Link>
          </Button>
          <Button asChild size="lg" variant="onNight">
            <Link href="/login">{t('ctaLogin')}</Link>
          </Button>
        </Reveal>
      </div>
      <div className="absolute inset-x-0 bottom-8 h-2.5 bg-signal" aria-hidden="true" />
    </section>
  )
}
