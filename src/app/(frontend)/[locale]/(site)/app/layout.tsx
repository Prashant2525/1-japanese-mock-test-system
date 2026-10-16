import { getTranslations, setRequestLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import type { ReactNode } from 'react'

import { currentStudentForPage, payloadClient } from '@/server/auth/session'
import { levelById } from '@/server/catalogue/queries'
import { hasDeterminedLevel } from '@/server/student/gate'
import { StudentSidebar, StudentTabBar, type StudentNavItem } from '@/ui/components/student-nav'

/**
 * Student area shell (D-098): left sidebar on large screens, bottom tab bar on phones. Shown once a
 * level is assigned; before that only the level check is open. Each page still guards itself on
 * the server. The calm exam screens live in another route group and never get this shell.
 */
export default async function StudentLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const student = await currentStudentForPage(await headers())
  if (!student || !hasDeterminedLevel(student)) return <>{children}</>

  const t = await getTranslations('student.nav')
  const levelId =
    typeof student.assignedLevel === 'object' ? student.assignedLevel?.id : student.assignedLevel
  const level = levelId
    ? await levelById(await payloadClient(), levelId, locale === 'ja' ? 'ja' : 'en')
    : null
  const items: StudentNavItem[] = [
    { href: '/app', label: t('home'), icon: 'home' },
    { href: '/app/study', label: t('study'), icon: 'study' },
    { href: '/app/mock-tests', label: t('mockTests'), icon: 'tests' },
    { href: '/app/results', label: t('results'), icon: 'results' },
    { href: '/app/profile', label: t('profile'), icon: 'profile' },
  ]
  return (
    <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <StudentSidebar label={t('area')} items={items} level={level} levelLabel={t('yourLevel')} />
      <div className="min-w-0">
        {children}
        <StudentTabBar label={t('area')} items={items} />
      </div>
    </div>
  )
}
