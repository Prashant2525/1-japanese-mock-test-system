import { setRequestLocale } from 'next-intl/server'
import type { ReactNode } from 'react'

/**
 * Test screens (UX-R04 "calm screen"): no site header, footer or navigation, so nothing competes
 * with the questions and nothing invites leaving mid-stage. The runner provides its own landmarks.
 */
export default async function ExamLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  setRequestLocale((await params).locale)
  return <div className="min-h-dvh bg-day">{children}</div>
}
