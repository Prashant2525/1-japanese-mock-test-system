import { setRequestLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import type { ReactNode } from 'react'

import { currentStudent } from '@/server/auth/session'
import { SiteFooter, SiteHeader } from '@/ui/components/site-chrome'

/** Public and student pages: header, main landmark, footer. */
export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  setRequestLocale((await params).locale)
  const student = await currentStudent(await headers())
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader signedIn={Boolean(student)} />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
