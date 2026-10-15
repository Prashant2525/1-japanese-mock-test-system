import { getTranslations, setRequestLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import type { ReactNode } from 'react'

import { currentStudentForPage } from '@/server/auth/session'
import { hasDeterminedLevel } from '@/server/student/gate'
import { StudentNav } from '@/ui/components/student-nav'

/** Student area shell. The tabs appear once a level is assigned; each page guards itself. */
export default async function StudentLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  setRequestLocale((await params).locale)
  const student = await currentStudentForPage(await headers())
  const t = await getTranslations('student.nav')
  return (
    <>
      {student && hasDeterminedLevel(student) ? (
        <StudentNav
          label={t('area')}
          items={[
            { href: '/app', label: t('home') },
            { href: '/app/study', label: t('study') },
            { href: '/app/mock-tests', label: t('mockTests') },
            { href: '/app/results', label: t('results') },
          ]}
        />
      ) : null}
      {children}
    </>
  )
}
