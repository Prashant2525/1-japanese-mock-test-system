import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { payloadClient } from '@/server/auth/session'
import { examCatalogue, type CatalogueLevel } from '@/server/catalogue/queries'
import { Reveal } from '@/ui/components/reveal'
import { StationBadge } from '@/ui/components/station-badge'

import { studentPage } from '../student-page'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t('student.nav.mockTests'), robots: { index: false } }
}

/** Levels that share exactly the same sections, in level order (e.g. JLPT N5–N3 and N2–N1). */
function groupBySections(levels: CatalogueLevel[]) {
  const groups: { levels: CatalogueLevel[]; sections: CatalogueLevel['sections'] }[] = []
  for (const level of levels) {
    const sig = level.sections.map((s) => s.key).join('|')
    const same = groups.find((g) => g.sections.map((s) => s.key).join('|') === sig)
    if (same) same.levels.push(level)
    else groups.push({ levels: [level], sections: level.sections })
  }
  return groups
}

/**
 * Mock tests (behind the level gate, LD-R02). Phase 13: the exam catalogue from the CMS — exams,
 * their levels and each level's sections. The tests themselves arrive in Phases 15–16 (KI-27).
 */
export default async function Page({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  await studentPage(locale, 'mock-tests')
  const t = await getTranslations('student')
  const exams = await examCatalogue(await payloadClient(), locale === 'ja' ? 'ja' : 'en')

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12">
      <Reveal>
        <h1 className="text-3xl font-black sm:text-4xl">{t('nav.mockTests')}</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">{t('mockTests.intro')}</p>
      </Reveal>

      <p className="rounded-card border border-dashed border-line bg-surface p-6 text-center text-muted">
        {t('mockTests.empty')}
      </p>

      {exams.length ? (
        <section aria-labelledby="exams" className="grid gap-5">
          <h2 id="exams" className="text-xl font-bold">
            {t('mockTests.examsTitle')}
          </h2>
          {exams.map((exam, i) => (
            <Reveal key={exam.code} delayMs={Math.min(i, 4) * 60}>
              <article
                aria-labelledby={`exam-${exam.code}`}
                className="grid gap-5 rounded-card bg-surface p-5 shadow-card sm:p-7"
              >
                <header className="flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className="grid size-12 shrink-0 place-items-center rounded-input bg-night text-lg font-black text-white"
                  >
                    {exam.code.slice(0, 1)}
                  </span>
                  <span className="grid gap-1">
                    <h3 id={`exam-${exam.code}`} className="text-xl font-black">
                      {exam.name}
                    </h3>
                    {exam.description ? (
                      <span className="text-muted">{exam.description}</span>
                    ) : null}
                  </span>
                </header>

                {exam.levels.length ? (
                  <div className="grid gap-4">
                    <h4 className="text-sm font-bold text-muted">
                      {t('mockTests.sectionsByLevel')}
                    </h4>
                    <ul className="grid gap-4">
                      {groupBySections(exam.levels).map((group) => (
                        <li
                          key={group.levels.map((l) => l.code).join('-')}
                          className="grid gap-3 rounded-input border border-line p-4 sm:grid-cols-[minmax(0,12rem)_1fr] sm:items-center"
                        >
                          <span className="flex flex-wrap gap-2">
                            {group.levels.map((l) => (
                              <StationBadge key={l.code} level={l.code} color={l.badgeColor} />
                            ))}
                          </span>
                          {group.sections.length ? (
                            <ol
                              aria-label={t('mockTests.sectionsFor', {
                                levels: group.levels.map((l) => l.code).join(', '),
                              })}
                              className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm font-bold"
                              lang={locale}
                            >
                              {group.sections.map((s, n) => (
                                <li key={s.key} className="flex items-center gap-2">
                                  {n > 0 ? (
                                    <span
                                      aria-hidden="true"
                                      className="h-0.5 w-4 rounded-full bg-signal"
                                    />
                                  ) : null}
                                  <span className="rounded-full border border-line bg-day px-3 py-1">
                                    {s.name}
                                  </span>
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <span className="text-sm text-muted">{t('mockTests.noSections')}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {exam.nonAffiliationNotice ? (
                  <p className="text-xs text-muted">{exam.nonAffiliationNotice}</p>
                ) : null}
              </article>
            </Reveal>
          ))}
        </section>
      ) : null}
    </div>
  )
}
