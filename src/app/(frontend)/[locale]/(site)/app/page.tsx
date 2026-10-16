import type { Metadata } from 'next'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { payloadClient } from '@/server/auth/session'
import { examCatalogue, levelById } from '@/server/catalogue/queries'
import { levelCheckSummaryOrNull } from '@/server/level-check/service'
import { resultsFor } from '@/server/student/areas'
import { studyDashboardFor, type DashboardMaterial } from '@/server/study/progress'
import { ResultsTable } from '@/ui/components/results-table'
import { Reveal } from '@/ui/components/reveal'
import { StationBadge } from '@/ui/components/station-badge'

import { studentPage } from './student-page'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t('student.nav.home'), robots: { index: false } }
}

function Bar({ percent }: { percent: number }) {
  return (
    <span aria-hidden="true" className="block h-2 overflow-hidden rounded-full bg-line">
      <span
        className="block h-full rounded-full bg-signal transition-[width] duration-700 ease-standard motion-reduce:transition-none"
        style={{ width: `${percent}%` }}
      />
    </span>
  )
}

/**
 * Student home dashboard (D-106, STU-R01; open only once a level is assigned, LD-R01). Every
 * figure comes from the student's own records: their level and level check, study progress they
 * recorded with "Mark as studied" (RV-12), the CMS catalogue and their results. Nothing is
 * estimated, and nothing here claims exam readiness.
 */
export default async function StudentHome({ params }: Props) {
  const { locale: raw } = await params
  setRequestLocale(raw)
  const locale = raw === 'ja' ? 'ja' : 'en'
  const student = await studentPage(raw, 'home')
  const t = await getTranslations('dashboard')
  const ts = await getTranslations('student')
  const format = await getFormatter()
  const payload = await payloadClient()
  const levelId =
    typeof student.assignedLevel === 'object' ? student.assignedLevel?.id : student.assignedLevel
  const [level, summary, study, results, exams] = await Promise.all([
    levelId ? levelById(payload, levelId, locale) : null,
    levelCheckSummaryOrNull(student),
    studyDashboardFor(student, locale),
    resultsFor(student, 1, 3),
    examCatalogue(payload, locale),
  ])
  const date = (iso: string) => format.dateTime(new Date(iso), { dateStyle: 'medium' })
  const next: DashboardMaterial | null = study.continue ?? study.recommended[0] ?? null
  const passedStages = summary?.stages.filter((s) => s.passed).length ?? 0
  const card = 'rounded-card bg-surface p-5 shadow-card sm:p-6'

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:py-10">
      {/* 1. Welcome, level and the next step */}
      <Reveal>
        <section
          aria-labelledby="welcome"
          className="relative isolate overflow-hidden rounded-card bg-night p-6 text-on-night shadow-card sm:p-10"
        >
          <span
            aria-hidden="true"
            className="absolute -top-24 -right-24 -z-10 size-80 rounded-full border-[14px] border-white/5"
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-44 left-1/3 -z-10 size-72 rounded-full border-[10px] border-signal/25"
          />
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="grid gap-3">
              <p className="text-xs font-bold tracking-[0.2em] text-muted-on-night uppercase">
                {t('eyebrow')}
              </p>
              <h1 id="welcome" className="text-3xl font-black text-white sm:text-5xl">
                {t('greeting', { name: student.name })}
              </h1>
              <p className="max-w-xl text-muted-on-night">{t('lead')}</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {next ? (
                  <Link
                    href={`/app/study/${next.slug}`}
                    className="inline-flex min-h-12 max-w-full items-center gap-2 rounded-full bg-signal px-6 font-bold text-white transition-colors hover:bg-signal-hover"
                  >
                    <span className="truncate">
                      {study.continue
                        ? t('continueCta', { title: next.title })
                        : t('startCta', { title: next.title })}
                    </span>
                    <span aria-hidden="true">→</span>
                  </Link>
                ) : (
                  <Link
                    href="/app/study"
                    className="inline-flex min-h-12 items-center rounded-full bg-signal px-6 font-bold text-white hover:bg-signal-hover"
                  >
                    {t('libraryCta')}
                  </Link>
                )}
                <Link
                  href="/app/mock-tests"
                  className="inline-flex min-h-12 items-center rounded-full border-2 border-white/40 px-6 font-bold text-white hover:border-white"
                >
                  {t('testsCta')}
                </Link>
              </div>
            </div>
            {level ? (
              <div className="grid justify-items-center gap-2 rounded-card border border-white/15 px-8 py-6 text-center">
                <span className="text-xs font-bold tracking-wider text-muted-on-night uppercase">
                  {t('levelLabel')}
                </span>
                <StationBadge level={level.code} color={level.badgeColor} className="text-3xl" />
                <span className="text-sm text-muted-on-night">
                  {summary ? t('levelByCheck') : t('levelByStaff')}
                </span>
              </div>
            ) : null}
          </div>
        </section>
      </Reveal>

      {/* 2. Key figures (real counts only) */}
      <Reveal delayMs={60}>
        <section aria-label={t('statsLabel')}>
          <ul className="grid gap-4 sm:grid-cols-3">
            <li className={card}>
              <p className="text-sm text-muted">{t('statStudied')}</p>
              <p className="mt-1 text-3xl font-black tabular-nums">
                {t('ofTotal', { done: study.total.studied, total: study.total.available })}
              </p>
              <p className="mt-1 text-xs text-muted">{t('statStudiedHelp')}</p>
            </li>
            <li className={card}>
              <p className="text-sm text-muted">{t('statLastStudied')}</p>
              <p className="mt-1 text-3xl font-black">
                {study.lastStudiedAt ? date(study.lastStudiedAt) : t('notYet')}
              </p>
              <p className="mt-1 text-xs text-muted">{t('statLastStudiedHelp')}</p>
            </li>
            <li className={card}>
              <p className="text-sm text-muted">{t('statLevelCheck')}</p>
              <p className="mt-1 text-3xl font-black tabular-nums">
                {summary ? t('ofTotal', { done: passedStages, total: summary.stages.length }) : '—'}
              </p>
              <p className="mt-1 text-xs text-muted">
                {summary
                  ? t('statLevelCheckHelp', { date: date(summary.completedAt) })
                  : t('levelByStaff')}
              </p>
            </li>
          </ul>
        </section>
      </Reveal>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* 3. Progress by category at the student's levels */}
        <Reveal delayMs={100}>
          <section aria-labelledby="progress" className={`${card} grid gap-5`}>
            <div>
              <h2 id="progress" className="text-xl font-bold">
                {t('progressTitle', { level: level?.code ?? '' })}
              </h2>
              <p className="mt-1 text-sm text-muted">{t('progressHelp')}</p>
            </div>
            {study.categories.length ? (
              <ul className="grid gap-4">
                {study.categories.map((c) => (
                  <li key={c.key} className="grid gap-2">
                    <span className="flex items-center justify-between gap-3 text-sm">
                      <span className="inline-flex items-center gap-2 font-bold">
                        {c.symbol ? (
                          <span
                            aria-hidden="true"
                            className="grid size-8 place-items-center rounded-full bg-day"
                          >
                            {c.symbol}
                          </span>
                        ) : null}
                        {c.name}
                      </span>
                      <span className="text-muted tabular-nums">
                        {t('ofTotal', { done: c.studied, total: c.available })}
                      </span>
                    </span>
                    <Bar percent={c.percent} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-input border border-dashed border-line p-5 text-center text-sm text-muted">
                {t('noMaterials')}
              </p>
            )}
            <p className="text-xs text-muted">{t('progressNote')}</p>
          </section>
        </Reveal>

        {/* 4. What to study next */}
        <Reveal delayMs={140}>
          <section aria-labelledby="next" className={`${card} grid content-start gap-4`}>
            <h2 id="next" className="text-xl font-bold">
              {t('nextTitle')}
            </h2>
            {study.continue || study.recommended.length ? (
              <ul className="grid gap-3">
                {[...(study.continue ? [study.continue] : []), ...study.recommended]
                  .slice(0, 3)
                  .map((m, i) => (
                    <li key={m.slug}>
                      <Link
                        href={`/app/study/${m.slug}`}
                        className="flex items-center gap-3 rounded-input border border-line p-3 transition-colors hover:border-ink/40"
                      >
                        <span
                          aria-hidden="true"
                          className="grid size-10 shrink-0 place-items-center rounded-full bg-day text-lg"
                        >
                          {m.category.symbol ?? '・'}
                        </span>
                        <span className="grid min-w-0 flex-1 gap-0.5">
                          <span className="text-xs font-bold text-muted">
                            {i === 0 && study.continue ? t('continueTag') : m.category.name}
                          </span>
                          <span className="truncate font-bold">{m.title}</span>
                        </span>
                        <StationBadge level={m.level.code} color={m.level.badgeColor} />
                      </Link>
                    </li>
                  ))}
              </ul>
            ) : study.total.available ? (
              <p className="rounded-input bg-day p-4 text-sm">{t('allStudied')}</p>
            ) : (
              <p className="rounded-input border border-dashed border-line p-5 text-center text-sm text-muted">
                {t('noMaterials')}
              </p>
            )}
            <Link
              href="/app/study"
              className="justify-self-start text-sm font-bold underline underline-offset-4"
            >
              {t('libraryLink')}
            </Link>
          </section>
        </Reveal>
      </div>

      {/* 5. Mock tests: the catalogue now, the tests from Phase 15–16 */}
      <Reveal delayMs={180}>
        <section aria-labelledby="tests" className={`${card} grid gap-4`}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="tests" className="text-xl font-bold">
                {t('testsTitle')}
              </h2>
              <p className="mt-1 text-sm text-muted">{t('testsHelp')}</p>
            </div>
            <Link href="/app/mock-tests" className="text-sm font-bold underline underline-offset-4">
              {t('testsLink')}
            </Link>
          </div>
          {exams.length ? (
            <ul className="flex flex-wrap gap-3">
              {exams.map((e) => (
                <li
                  key={e.code}
                  className="inline-flex items-center gap-3 rounded-full border border-line py-1.5 pr-4 pl-1.5"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-8 place-items-center rounded-full bg-night text-sm font-black text-white"
                  >
                    {e.code.slice(0, 1)}
                  </span>
                  <span className="text-sm font-bold">{e.code}</span>
                  <span className="text-xs text-muted">
                    {t('levelsCount', { count: e.levels.length })}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </Reveal>

      {/* 6. Recent results */}
      <Reveal delayMs={220}>
        <section aria-labelledby="recent" className="grid gap-4">
          <div className="flex items-end justify-between gap-3">
            <h2 id="recent" className="text-xl font-bold">
              {t('recentTitle')}
            </h2>
            {results.docs.length ? (
              <Link href="/app/results" className="text-sm font-bold underline underline-offset-4">
                {t('recentLink')}
              </Link>
            ) : null}
          </div>
          {results.docs.length ? (
            <ResultsTable results={results.docs} locale={locale} caption={t('recentTitle')} />
          ) : (
            <p className="rounded-card border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
              {ts('results.empty')}
            </p>
          )}
        </section>
      </Reveal>
    </div>
  )
}
