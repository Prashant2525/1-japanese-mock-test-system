import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import { redirect as nextRedirect } from 'next/navigation'
import { Suspense } from 'react'

import { currentStudentForPage } from '@/server/auth/session'
import { isGoogleSignInAvailable } from '@/server/services/google-auth'
import { AuthCard } from '@/ui/components/auth-card'
import { safeNextPath } from '@/ui/lib/safe-next'
import { LoginForm } from '@/ui/forms/login-form'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string | string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t('auth.login.title'), robots: { index: false } }
}

export default async function Page({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  // Already signed in: no second login form; go where they were heading (or the student area).
  const student = await currentStudentForPage(await headers())
  if (student && student.status !== 'suspended') {
    const next = (await searchParams).next
    // safeNextPath returns a full path that already starts with the locale (e.g. /en/app).
    nextRedirect(safeNextPath(typeof next === 'string' ? next : null, locale))
  }
  const t = await getTranslations()
  const google = await isGoogleSignInAvailable()
  return (
    <AuthCard title={t('auth.login.title')} subtitle={t('auth.login.subtitle')}>
      {/* The form reads the URL (useSearchParams), which needs a Suspense boundary. */}
      <Suspense fallback={null}>
        <LoginForm google={google} />
      </Suspense>
    </AuthCard>
  )
}
