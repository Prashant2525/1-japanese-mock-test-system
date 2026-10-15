import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { payloadClient } from '@/server/auth/session'
import { levelCheckStages } from '@/server/catalogue/queries'
import { levelCheckStateFor } from '@/server/level-check/service'
import { Alert } from '@/ui/components/alert'
import { Button } from '@/ui/components/button'
import { LevelRoute } from '@/ui/components/level-route'
import { Reveal } from '@/ui/components/reveal'
import { StartLevelCheck } from '@/ui/exam/start-level-check'

import { studentPage } from '../student-page'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t('app.levelCheckTitle'), robots: { index: false } }
}

/**
 * Level-check intro (LD-R01): where every student without a level lands. The stages and their
 * colours come from the CMS; Start begins at N5 (or Continue resumes a running check).
 */
export default async function LevelCheckIntro({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const student = await studentPage(locale, 'level-check')
  const t = await getTranslations()
  const lang = locale === 'ja' ? 'ja' : 'en'
  const [stops, state] = await Promise.all([
    levelCheckStages(await payloadClient(), lang),
    levelCheckStateFor(student),
  ])
  // The published stages (what the student will take); colours from the catalogue.
  const colour = new Map(stops.map((s) => [s.code, s.lineColor]))
  const route = (
    state.stages.length ? state.stages.map((s) => s.levelCode) : stops.map((s) => s.code)
  ).map((code) => ({ code, lineColor: colour.get(code) ?? '#2B6BD8' }))
  const first = route[0]?.code ?? 'N5'
  const totalMinutes = state.stages.reduce((sum, s) => sum + s.durationMinutes, 0)
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
          stops={route}
          label={t('student.levelCheck.routeLabel', {
            stops: route.map((s) => s.code).join(' → '),
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
          {state.stages.length ? (
            <ul className="mt-4 grid gap-1 text-sm text-muted">
              {state.stages.map((s) => (
                <li key={s.levelCode}>
                  <strong className="text-ink">{s.levelCode}</strong> ·{' '}
                  {t('exam.stageInfo', { questions: s.questionCount, minutes: s.durationMinutes })}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </Reveal>
      <Reveal delayMs={240}>
        {!state.available && state.status === 'not_started' ? (
          <div className="grid gap-3">
            <Alert tone="info">{t('app.levelCheck.not_started')}</Alert>
            <Button size="lg" disabled className="justify-self-start">
              {t('student.levelCheck.start')}
            </Button>
          </div>
        ) : state.status === 'in_progress' ? (
          <div className="grid gap-3">
            <Alert tone="info">{t('student.levelCheck.inProgress')}</Alert>
            <StartLevelCheck locale={locale} resume label={t('student.levelCheck.continue')} />
          </div>
        ) : (
          <div className="grid gap-3">
            <p className="text-muted">
              {t('student.levelCheck.ready', { count: state.stages.length, minutes: totalMinutes })}
            </p>
            <StartLevelCheck locale={locale} resume={false} label={t('student.levelCheck.start')} />
          </div>
        )}
      </Reveal>
    </div>
  )
}
