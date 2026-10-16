import type { Metadata } from 'next'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { profileFor } from '@/server/student/profile'
import { Reveal } from '@/ui/components/reveal'
import { StationBadge } from '@/ui/components/station-badge'

import { studentPage } from '../student-page'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t('student.nav.profile'), robots: { index: false } }
}

/**
 * The student's profile (D-106): account details, sign-in methods, how the level was set and its
 * history, and the way to change the password. The level is system-controlled (D-013): there is
 * no control to change it here.
 */
export default async function ProfilePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const student = await studentPage(locale, 'profile')
  const t = await getTranslations('profile')
  const format = await getFormatter()
  const p = await profileFor(student, locale === 'ja' ? 'ja' : 'en')
  const date = (iso: string) => format.dateTime(new Date(iso), { dateStyle: 'medium' })
  const sourceLabel = (s: 'determination' | 'override' | 'reset') =>
    s === 'determination'
      ? t('sourceCheck')
      : s === 'override'
        ? t('sourceStaff')
        : t('sourceReset')

  const card = 'rounded-card bg-surface p-6 shadow-card sm:p-7'
  const row = 'grid gap-0.5 sm:grid-cols-[12rem_1fr] sm:gap-4'

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:py-12">
      <Reveal>
        <p className="text-sm font-bold tracking-wider text-signal uppercase">{t('eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">{t('title')}</h1>
      </Reveal>

      <Reveal delayMs={60}>
        <section aria-label={t('accountTitle')} className={`${card} flex items-center gap-5`}>
          <span
            aria-hidden="true"
            className="grid size-16 shrink-0 place-items-center rounded-full bg-night text-2xl font-black text-white"
          >
            {p.name.trim().slice(0, 1).toUpperCase()}
          </span>
          <span className="grid min-w-0 gap-1">
            <span className="truncate text-xl font-black">{p.name}</span>
            <span className="truncate text-muted">{p.email}</span>
          </span>
          {p.level ? (
            <StationBadge
              level={p.level.code}
              color={p.level.badgeColor}
              className="ml-auto text-lg"
            />
          ) : null}
        </section>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Reveal delayMs={100}>
          <section aria-labelledby="account" className={`${card} grid gap-4`}>
            <h2 id="account" className="text-xl font-bold">
              {t('accountTitle')}
            </h2>
            <dl className="grid gap-3 text-sm">
              <div className={row}>
                <dt className="text-muted">{t('name')}</dt>
                <dd className="font-bold">{p.name}</dd>
              </div>
              <div className={row}>
                <dt className="text-muted">{t('email')}</dt>
                <dd className="font-bold break-all">{p.email}</dd>
              </div>
              <div className={row}>
                <dt className="text-muted">{t('language')}</dt>
                <dd className="font-bold">{p.preferredLocale === 'ja' ? '日本語' : 'English'}</dd>
              </div>
              <div className={row}>
                <dt className="text-muted">{t('joined')}</dt>
                <dd className="font-bold">{date(p.joinedAt)}</dd>
              </div>
              <div className={row}>
                <dt className="text-muted">{t('signIn')}</dt>
                <dd className="font-bold">
                  {p.googleLinked ? t('signInEmailGoogle') : t('signInEmail')}
                </dd>
              </div>
            </dl>
          </section>
        </Reveal>

        <Reveal delayMs={140}>
          <section aria-labelledby="level" className={`${card} grid content-start gap-4`}>
            <h2 id="level" className="text-xl font-bold">
              {t('levelTitle')}
            </h2>
            {p.level ? (
              <p className="flex items-center gap-3">
                <StationBadge level={p.level.code} color={p.level.badgeColor} className="text-lg" />
                {p.level.name !== p.level.code ? (
                  <span className="font-bold">{p.level.name}</span>
                ) : null}
              </p>
            ) : null}
            {p.levelSetAt && p.levelSource ? (
              <p className="text-sm text-muted">
                {t('levelSet', {
                  how: sourceLabel(p.levelSource),
                  date: date(p.levelSetAt),
                })}
              </p>
            ) : null}
            <p className="rounded-input bg-day p-3 text-sm">{t('levelFixed')}</p>
            {p.levelSource === 'determination' ? (
              <Link
                href="/app/your-level"
                className="justify-self-start text-sm font-bold underline underline-offset-4"
              >
                {t('levelResult')}
              </Link>
            ) : null}
          </section>
        </Reveal>
      </div>

      {p.history.length ? (
        <Reveal delayMs={180}>
          <section aria-labelledby="history" className={`${card} grid gap-4`}>
            <h2 id="history" className="text-xl font-bold">
              {t('historyTitle')}
            </h2>
            <ol className="grid gap-3">
              {p.history.map((h, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 border-l-[3px] border-signal pl-4 text-sm"
                >
                  <span className="w-28 text-muted">{date(h.at)}</span>
                  <span className="font-bold">{h.levelCode ?? '—'}</span>
                  <span className="text-muted">{sourceLabel(h.source)}</span>
                </li>
              ))}
            </ol>
          </section>
        </Reveal>
      ) : null}

      <Reveal delayMs={220}>
        <section aria-labelledby="security" className={`${card} grid gap-4`}>
          <h2 id="security" className="text-xl font-bold">
            {t('securityTitle')}
          </h2>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="grid gap-1">
              <span className="font-bold">{t('password')}</span>
              <span className="text-sm text-muted">{t('passwordHelp')}</span>
            </span>
            <Link
              href="/forgot-password"
              className="inline-flex min-h-11 items-center rounded-full border-2 border-night px-5 text-sm font-bold"
            >
              {t('passwordAction')}
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  )
}
