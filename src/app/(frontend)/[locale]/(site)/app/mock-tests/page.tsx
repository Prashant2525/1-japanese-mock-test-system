import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Reveal } from '@/ui/components/reveal'

import { studentPage } from '../student-page'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t('student.nav.mockTests'), robots: { index: false } }
}

/** Behind the level gate (LD-R02). The list itself arrives in Phase 16 (KI-27). */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  await studentPage(locale, 'mock-tests')
  const t = await getTranslations('student')
  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 py-12">
      <Reveal>
        <h1 className="text-3xl font-black sm:text-4xl">{t('nav.mockTests')}</h1>
      </Reveal>
      <Reveal delayMs={80}>
        <p className="rounded-card border border-dashed border-line bg-surface p-8 text-center text-muted">
          {t('mockTests.empty')}
        </p>
      </Reveal>
    </div>
  )
}
