import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { headers } from 'next/headers'

import { redirect } from '@/i18n/navigation'
import { currentStudent } from '@/server/auth/session'
import { Reveal } from '@/ui/components/reveal'

export const metadata: Metadata = { robots: { index: false } }

/**
 * Student home (protected). The server checks the session on every request; proxy.ts only
 * redirects early as a convenience. Level-check gating (Phase 10) and the dashboard come later.
 */
export default async function StudentHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const student = await currentStudent(await headers())
  if (!student || student.status === 'suspended') {
    redirect({ href: { pathname: '/login', query: { next: `/${locale}/app` } }, locale })
    return null
  }
  const t = await getTranslations('app')
  return (
    <div className="mx-auto grid max-w-3xl gap-8 px-4 py-12">
      <Reveal>
        <h1 className="text-3xl font-black sm:text-4xl">{t('welcome', { name: student.name })}</h1>
      </Reveal>
      <Reveal delayMs={80}>
        <section aria-labelledby="level-check" className="rounded-card bg-surface p-6 shadow-card">
          <h2 id="level-check" className="text-xl font-bold">
            {t('levelCheckTitle')}
          </h2>
          <p className="mt-2 text-muted">{t(`levelCheck.${student.determinationStatus}`)}</p>
        </section>
      </Reveal>
      <Reveal delayMs={160}>
        <section aria-labelledby="account" className="rounded-card bg-surface p-6 shadow-card">
          <h2 id="account" className="text-xl font-bold">
            {t('accountTitle')}
          </h2>
          <dl className="mt-3 grid gap-1 text-sm">
            <dt className="text-muted">{t('email')}</dt>
            <dd className="font-medium">{student.email}</dd>
            <dt className="mt-2 text-muted">{t('language')}</dt>
            <dd className="font-medium">
              {student.preferredLocale === 'ja' ? '日本語' : 'English'}
            </dd>
          </dl>
        </section>
      </Reveal>
    </div>
  )
}
