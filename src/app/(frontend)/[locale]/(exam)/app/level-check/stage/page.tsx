import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { headers } from 'next/headers'

import { redirect } from '@/i18n/navigation'
import { currentStudentForPage } from '@/server/auth/session'
import { hasDeterminedLevel } from '@/server/student/gate'
import { LevelCheckRunner } from '@/ui/exam/level-check-runner'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t('app.levelCheckTitle'), robots: { index: false } }
}

/** A level-check stage. Students who already have a level go to their result instead. */
export default async function StagePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const student = await currentStudentForPage(await headers())
  if (!student || student.status === 'suspended') {
    redirect({
      href: { pathname: '/login', query: { next: `/${locale}/app/level-check/stage` } },
      locale,
    })
    return null
  }
  if (hasDeterminedLevel(student)) redirect({ href: '/app/your-level', locale })
  return <LevelCheckRunner locale={locale} />
}
