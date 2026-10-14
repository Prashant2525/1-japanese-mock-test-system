import type { ReactNode } from 'react'

import { Reveal } from './reveal'

/** Card wrapper for every auth page: one h1, optional subtitle, then the form. */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <Reveal>
      <div className="rounded-card bg-surface p-6 shadow-card sm:p-8">
        <h1 className="text-2xl font-black sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-2 text-muted">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
    </Reveal>
  )
}
