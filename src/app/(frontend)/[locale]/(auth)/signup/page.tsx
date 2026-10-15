import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { headers } from 'next/headers'

import { redirect } from '@/i18n/navigation'
import { currentStudentForPage } from '@/server/auth/session'
import { isGoogleSignInAvailable } from '@/server/services/google-auth'
import { AuthCard } from '@/ui/components/auth-card'
import { SignupForm } from '@/ui/forms/signup-form'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t('auth.signup.title'), robots: { index: false } }
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  // Already signed in: no second account; go to the student area.
  const student = await currentStudentForPage(await headers())
  if (student && student.status !== 'suspended') redirect({ href: '/app', locale })
  const t = await getTranslations()
  const google = await isGoogleSignInAvailable()
  return (
    <AuthCard title={t('auth.signup.title')} subtitle={t('auth.signup.subtitle')}>
      <SignupForm google={google} />
    </AuthCard>
  )
}
