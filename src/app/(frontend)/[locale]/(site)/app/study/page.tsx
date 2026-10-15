import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { listStudyMaterialsFor } from '@/server/study/service'
import { Reveal } from '@/ui/components/reveal'
import { StationBadge } from '@/ui/components/station-badge'
import { cn } from '@/ui/lib/cn'

import { studentPage } from '../student-page'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ level?: string; category?: string; q?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t('student.nav.study'), robots: { index: false } }
}

/** The study library (SM-R01..R06): materials of the student's level and below, by category. */
export default async function StudyPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const student = await studentPage(locale, 'study')
  const t = await getTranslations('student')
  const query = await searchParams
  const result = await listStudyMaterialsFor(student, {
    locale: locale === 'ja' ? 'ja' : 'en',
    level: query.level ?? null,
    category: query.category ?? null,
    q: query.q ?? null,
  })
  const { levels, categories } = result.filters
  const filtered = Boolean(query.level || query.category || query.q)

  const chip = (active: boolean) =>
    cn(
      'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-bold transition-colors',
      active
        ? 'border-night bg-night text-white'
        : 'border-line bg-surface text-ink hover:border-ink/40',
    )
  const href = (change: { level?: string | null; category?: string | null; q?: string | null }) => {
    const next = { level: query.level, category: query.category, q: query.q, ...change }
    const q = Object.fromEntries(Object.entries(next).filter(([, v]) => v)) as Record<
      string,
      string
    >
    return { pathname: '/app/study', query: q }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-12">
      <Reveal>
        <h1 className="text-3xl font-black sm:text-4xl">{t('nav.study')}</h1>
      </Reveal>
      <form role="search" action="" method="get" className="flex flex-wrap items-end gap-2">
        <label className="grid flex-1 basis-60 gap-1 text-sm font-bold">
          {t('study.search')}
          <input
            type="search"
            name="q"
            defaultValue={query.q ?? ''}
            maxLength={100}
            className="min-h-11 rounded-input border border-line bg-surface px-3 text-base font-normal"
          />
        </label>
        {query.level ? <input type="hidden" name="level" value={query.level} /> : null}
        {query.category ? <input type="hidden" name="category" value={query.category} /> : null}
        <button
          type="submit"
          className="min-h-11 rounded-full bg-night px-5 text-sm font-bold text-white"
        >
          {t('study.searchButton')}
        </button>
        {query.q ? (
          <Link
            href={href({ q: null })}
            className="min-h-11 content-center text-sm font-bold underline underline-offset-4"
          >
            {t('study.clearSearch')}
          </Link>
        ) : null}
      </form>
      <nav aria-label={t('study.filters')} className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-full text-sm font-bold text-muted sm:w-24">{t('study.level')}</span>
          <Link
            href={href({ level: null })}
            className={chip(!query.level)}
            aria-current={!query.level ? 'true' : undefined}
          >
            {t('study.all')}
          </Link>
          {levels.map((l) => (
            <Link
              key={l.code}
              href={href({ level: l.code })}
              className={chip(query.level === l.code)}
              aria-current={query.level === l.code ? 'true' : undefined}
            >
              {l.code}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-full text-sm font-bold text-muted sm:w-24">{t('study.category')}</span>
          <Link
            href={href({ category: null })}
            className={chip(!query.category)}
            aria-current={!query.category ? 'true' : undefined}
          >
            {t('study.all')}
          </Link>
          {categories.map((c) => (
            <Link
              key={c.key}
              href={href({ category: c.key })}
              className={chip(query.category === c.key)}
              aria-current={query.category === c.key ? 'true' : undefined}
            >
              {c.symbol ? <span aria-hidden="true">{c.symbol}</span> : null}
              {c.name}
            </Link>
          ))}
        </div>
      </nav>

      {result.docs.length === 0 ? (
        <p className="rounded-card border border-dashed border-line bg-surface p-8 text-center text-muted">
          {filtered ? t('study.noneForFilter') : t('study.empty')}
        </p>
      ) : (
        <>
          <p className="text-sm text-muted">{t('study.count', { count: result.totalDocs })}</p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.docs.map((m, i) => (
              <Reveal key={m.slug} delayMs={Math.min(i, 6) * 40} as="li">
                <Link
                  href={`/app/study/${m.slug}`}
                  className="flex h-full flex-col gap-3 rounded-card border-t-4 border-signal bg-surface p-5 shadow-card transition-transform duration-200 ease-standard hover:-translate-y-0.5"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-muted">
                      {m.category.symbol ? (
                        <span
                          aria-hidden="true"
                          className="grid size-8 place-items-center rounded-full bg-day text-base text-ink"
                        >
                          {m.category.symbol}
                        </span>
                      ) : null}
                      {m.category.name}
                    </span>
                    <StationBadge
                      level={m.level.code}
                      color={m.level.badgeColor}
                      className="text-base"
                    />
                  </span>
                  <span className="text-lg font-bold" lang={locale}>
                    {m.title}
                  </span>
                  {m.summary ? <span className="text-sm text-muted">{m.summary}</span> : null}
                  <span className="mt-auto flex flex-wrap gap-3 text-xs font-bold text-muted">
                    {m.media.audio ? (
                      <span>♪ {t('study.audioCount', { count: m.media.audio })}</span>
                    ) : null}
                    {m.media.pdf ? (
                      <span>▤ {t('study.pdfCount', { count: m.media.pdf })}</span>
                    ) : null}
                    {m.media.image ? (
                      <span>▣ {t('study.imageCount', { count: m.media.image })}</span>
                    ) : null}
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
