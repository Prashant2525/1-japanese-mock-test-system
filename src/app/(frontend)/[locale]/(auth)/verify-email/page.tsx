import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Suspense } from 'react'

import { AuthCard } from '@/ui/components/auth-card'
import { VerifyEmail } from '@/ui/forms/verify-email'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t('auth.verify.title'), robots: { index: false } }
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations()
  return (
    <AuthCard title={t('auth.verify.title')}>
      {/* The form reads the URL (useSearchParams), which needs a Suspense boundary. */}
      <Suspense fallback={null}>
        <VerifyEmail />
      </Suspense>
    </AuthCard>
  )
}
