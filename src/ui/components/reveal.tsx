import type { CSSProperties, ReactNode } from 'react'

import { cn } from '../lib/cn'

/**
 * "fade-up" motion preset (DESIGN_SYSTEM §4), CSS-only: it plays on load without JavaScript,
 * ends fully visible, and is switched off for visitors who prefer reduced motion (globals.css).
 * `as="li"` keeps list semantics when revealing list items.
 */
export function Reveal({
  children,
  delayMs = 0,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode
  delayMs?: number
  className?: string
  as?: 'div' | 'li' | 'section'
}) {
  return (
    <Tag
      className={cn('nm-reveal', className)}
      style={{ '--nm-delay': `${delayMs}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  )
}
