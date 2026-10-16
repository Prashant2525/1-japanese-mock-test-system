import { setRequestLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import type { ReactNode } from 'react'

import { currentStudentForPage } from '@/server/auth/session'
import { SiteFooter, SiteHeader } from '@/ui/components/site-chrome'

/**
 * Public and student pages: header, main landmark, footer. `main` grows to fill the space between
 * header and footer; when it holds the student shell it also becomes a flex column so the shell
 * (and its full-height sidebar) fills that space even on short pages, and the shell shows the
 * footer inside its content column (this full-width one is then hidden). Public pages keep normal flow.
 */
export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  setRequestLocale((await params).locale)
  const student = await currentStudentForPage(await headers())
  return (
    <div className="flex min-h-dvh flex-col has-[[data-student-shell]]:[&>footer]:hidden">
      <SiteHeader signedIn={Boolean(student)} />
      <main
        id="main"
        tabIndex={-1}
        className="flex-1 outline-none has-[>[data-student-shell]]:flex has-[>[data-student-shell]]:flex-col"
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
