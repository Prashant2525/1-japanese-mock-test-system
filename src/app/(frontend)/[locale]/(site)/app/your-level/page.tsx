import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { payloadClient } from '@/server/auth/session'
import { levelById } from '@/server/catalogue/queries'
import { levelCheckSummaryOrNull } from '@/server/level-check/service'
import { Alert } from '@/ui/components/alert'
import { Button } from '@/ui/components/button'
import { Reveal } from '@/ui/components/reveal'
import { StationBadge } from '@/ui/components/station-badge'

import { studentPage } from '../student-page'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ timeUp?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t('student.yourLevel.title'), robots: { index: false } }
}

/** "Your level" (D-012): the assigned level and each stage's score, right after the level check. */
export default async function YourLevel({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const student = await studentPage(locale, 'your-level')
  const t = await getTranslations()
  const lang = locale === 'ja' ? 'ja' : 'en'
  const levelId =
    typeof student.assignedLevel === 'object' ? student.assignedLevel?.id : student.assignedLevel
  const [level, summary] = await Promise.all([
    levelId ? levelById(await payloadClient(), levelId, lang) : null,
    levelCheckSummaryOrNull(student),
  ])
  const beginner = summary?.stages.length === 1 && summary.stages[0]?.passed === false
  return (
    <div className="mx-auto grid max-w-3xl gap-8 px-4 py-12">
      {(await searchParams).timeUp ? <Alert tone="info">{t('exam.timeUp')}</Alert> : null}
      <section className="on-night grid justify-items-center gap-4 rounded-card bg-night px-6 py-12 text-center text-on-night shadow-card">
        <h1 className="text-lg font-bold tracking-widest uppercase">
          {t('student.yourLevel.title')}
        </h1>
        {level ? (
          <StationBadge
            level={level.code}
            color={level.badgeColor}
            className="nm-stamp px-6 py-2 text-5xl sm:text-6xl"
          />
        ) : null}
        <p className="max-w-md text-lg text-muted-on-night">
          {level
            ? t(beginner ? 'student.yourLevel.beginnerLead' : 'student.yourLevel.lead', {
                level: level.code,
              })
            : null}
        </p>
      </section>
      {summary ? (
        <Reveal>
          <section aria-labelledby="stages" className="rounded-card bg-surface p-6 shadow-card">
            <h2 id="stages" className="text-xl font-bold">
              {t('student.yourLevel.stagesTitle')}
            </h2>
            <ol className="mt-4 grid gap-3">
              {summary.stages.map((s) => (
                <li
                  key={s.levelCode}
                  className="flex items-center justify-between gap-4 border-b border-line pb-3 last:border-0"
                >
                  <span className="font-sign text-lg font-bold">{s.levelCode}</span>
                  <span className="tabular-nums">
                    {t('student.yourLevel.score', { percent: s.percent })}
                  </span>
                  <span className={s.passed ? 'font-bold text-success' : 'font-bold text-danger'}>
                    {s.passed
                      ? `✓ ${t('student.yourLevel.passed')}`
                      : `✕ ${t('student.yourLevel.notPassed')}`}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </Reveal>
      ) : null}
      <Button asChild size="lg" className="justify-self-start">
        <Link href="/app">{t('student.yourLevel.goHome')}</Link>
      </Button>
    </div>
  )
}
