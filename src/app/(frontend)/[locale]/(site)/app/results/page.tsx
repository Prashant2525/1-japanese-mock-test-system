import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { resultsFor } from '@/server/student/areas'
import { ResultsTable } from '@/ui/components/results-table'
import { Reveal } from '@/ui/components/reveal'

import { studentPage } from '../student-page'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t('student.nav.results'), robots: { index: false } }
}

/**
 * Results (behind the level gate, LD-R02): the student's own results, newest first — level-check
 * stages today, mock tests from Phase 16. Answer review per result arrives in Phase 17.
 */
export default async function Page({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const student = await studentPage(locale, 'results')
  const t = await getTranslations('student')
  const results = await resultsFor(student, 1, 50)
  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:py-12">
      <Reveal>
        <h1 className="text-3xl font-black sm:text-4xl">{t('nav.results')}</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">{t('results.intro')}</p>
      </Reveal>
      <Reveal delayMs={80}>
        {results.docs.length ? (
          <ResultsTable
            results={results.docs}
            locale={locale === 'ja' ? 'ja' : 'en'}
            caption={t('nav.results')}
          />
        ) : (
          <p className="rounded-card border border-dashed border-line bg-surface p-8 text-center text-muted">
            {t('results.empty')}
          </p>
        )}
      </Reveal>
    </div>
  )
}
