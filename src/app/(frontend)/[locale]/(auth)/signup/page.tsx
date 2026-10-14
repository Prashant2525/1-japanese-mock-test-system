import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

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
  const t = await getTranslations()
  return (
    <AuthCard title={t('auth.signup.title')} subtitle={t('auth.signup.subtitle')}>
      <SignupForm />
    </AuthCard>
  )
}
