import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { payloadClient } from '@/server/auth/session'
import { levelById } from '@/server/catalogue/queries'
import { Reveal } from '@/ui/components/reveal'
import { StationBadge } from '@/ui/components/station-badge'

import { studentPage } from './student-page'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t('student.nav.home'), robots: { index: false } }
}

/** Student home: open only once a level is assigned (LD-R01); otherwise the guard sends them on. */
export default async function StudentHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const student = await studentPage(locale, 'home')
  const t = await getTranslations()
  const levelId =
    typeof student.assignedLevel === 'object' ? student.assignedLevel?.id : student.assignedLevel
  const level = levelId
    ? await levelById(await payloadClient(), levelId, locale === 'ja' ? 'ja' : 'en')
    : null
  const cards = [
    { href: '/app/study', title: t('student.nav.study'), body: t('student.home.studyBody') },
    {
      href: '/app/mock-tests',
      title: t('student.nav.mockTests'),
      body: t('student.home.mockTestsBody'),
    },
    {
      href: '/app/results',
      title: t('student.nav.results'),
      body: t('student.home.resultsBody'),
    },
  ]
  return (
    <div className="mx-auto grid max-w-4xl gap-8 px-4 py-12">
      <Reveal>
        <h1 className="text-3xl font-black sm:text-4xl">
          {t('app.welcome', { name: student.name })}
        </h1>
        {level ? (
          <p className="mt-4 flex items-center gap-3 text-lg">
            <span className="text-muted">{t('student.home.levelLabel')}</span>
            <StationBadge level={level.code} color={level.badgeColor} />
          </p>
        ) : null}
      </Reveal>
      <Reveal delayMs={80}>
        <section aria-labelledby="continue">
          <h2 id="continue" className="text-xl font-bold">
            {t('student.home.continueTitle')}
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-3">
            {cards.map((card) => (
              <li key={card.href}>
                <Link
                  href={card.href}
                  className="block h-full rounded-card border-t-4 border-signal bg-surface p-5 shadow-card transition-transform duration-200 ease-standard hover:-translate-y-0.5"
                >
                  <span className="block text-lg font-bold">{card.title}</span>
                  <span className="mt-1 block text-sm text-muted">{card.body}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>
      <Reveal delayMs={160}>
        <section aria-labelledby="account" className="rounded-card bg-surface p-6 shadow-card">
          <h2 id="account" className="text-xl font-bold">
            {t('app.accountTitle')}
          </h2>
          <dl className="mt-3 grid gap-1 text-sm">
            <dt className="text-muted">{t('app.email')}</dt>
            <dd className="font-medium">{student.email}</dd>
            <dt className="mt-2 text-muted">{t('app.language')}</dt>
            <dd className="font-medium">
              {student.preferredLocale === 'ja' ? '日本語' : 'English'}
            </dd>
          </dl>
        </section>
      </Reveal>
    </div>
  )
}
