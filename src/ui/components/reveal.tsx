import type { CSSProperties, ReactNode } from 'react'

import { cn } from '../lib/cn'

/**
 * "fade-up" motion preset (DESIGN_SYSTEM §4), CSS-only: it plays on load without JavaScript,
 * ends fully visible, and is switched off for visitors who prefer reduced motion (globals.css).
 */
export function Reveal({
  children,
  delayMs = 0,
  className,
}: {
  children: ReactNode
  delayMs?: number
  className?: string
}) {
  return (
    <div
      className={cn('nm-reveal', className)}
      style={{ '--nm-delay': `${delayMs}ms` } as CSSProperties}
    >
      {children}
    </div>
  )
}
