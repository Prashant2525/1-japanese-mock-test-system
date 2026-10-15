import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { payloadClient } from '@/server/auth/session'
import { levelCheckStages } from '@/server/catalogue/queries'
import { Alert } from '@/ui/components/alert'
import { Button } from '@/ui/components/button'
import { LevelRoute } from '@/ui/components/level-route'
import { Reveal } from '@/ui/components/reveal'

import { studentPage } from '../student-page'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t('app.levelCheckTitle'), robots: { index: false } }
}

/**
 * Level-check intro (LD-R01): where every student without a level lands. The stages come from the
 * CMS catalogue. Starting the check arrives in Phase 11; until then the button is disabled (KI-27).
 */
export default async function LevelCheckIntro({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const student = await studentPage(locale, 'level-check')
  const t = await getTranslations()
  const stages = await levelCheckStages(await payloadClient(), locale === 'ja' ? 'ja' : 'en')
  const first = stages[0]?.code ?? 'N5'
  return (
    <div className="mx-auto grid max-w-3xl gap-8 px-4 py-12">
      <Reveal>
        <p className="font-sign text-sm font-bold tracking-widest text-signal uppercase">
          {t('student.levelCheck.eyebrow')}
        </p>
        <h1 className="mt-1 text-3xl font-black sm:text-4xl">{t('student.levelCheck.title')}</h1>
        <p className="mt-3 text-lg text-muted">{t('student.levelCheck.intro')}</p>
      </Reveal>
      <Reveal delayMs={80}>
        <LevelRoute
          stops={stages}
          label={t('student.levelCheck.routeLabel', {
            stops: stages.map((s) => s.code).join(' → '),
          })}
        />
      </Reveal>
      <Reveal delayMs={160}>
        <section aria-labelledby="rules" className="rounded-card bg-surface p-6 shadow-card">
          <h2 id="rules" className="text-xl font-bold">
            {t('student.levelCheck.rulesTitle')}
          </h2>
          <ol className="mt-3 grid list-decimal gap-2 pl-5">
            <li>{t('student.levelCheck.ruleStart', { first })}</li>
            <li>{t('student.levelCheck.ruleClimb')}</li>
            <li>{t('student.levelCheck.ruleStop', { first })}</li>
            <li>{t('student.levelCheck.ruleUnlock')}</li>
          </ol>
        </section>
      </Reveal>
      <Reveal delayMs={240}>
        <div className="grid gap-3">
          <Alert tone="info">{t(`app.levelCheck.${student.determinationStatus}`)}</Alert>
          <Button size="lg" disabled className="justify-self-start">
            {t('student.levelCheck.start')}
          </Button>
        </div>
      </Reveal>
    </div>
  )
}
