import type { ReactNode } from 'react'

import { cn } from '../lib/cn'

const TONES = {
  info: { box: 'border-info/30 bg-info/5', icon: 'text-info' },
  success: { box: 'border-success/30 bg-success/5', icon: 'text-success' },
  warning: { box: 'border-warning/40 bg-warning/5', icon: 'text-warning' },
  danger: { box: 'border-danger/30 bg-danger/5', icon: 'text-danger' },
} as const

/**
 * Status message with icon + text + colour (never colour alone, DESIGN_SYSTEM §6).
 * Errors use role="alert" so screen readers announce them; others use role="status".
 */
export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: keyof typeof TONES
  title?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex gap-3 rounded-card border p-4 text-sm leading-relaxed',
        TONES[tone].box,
        className,
      )}
    >
      <span className={cn('mt-0.5 shrink-0', TONES[tone].icon)} aria-hidden="true">
        <ToneIcon tone={tone} />
      </span>
      <div className="grid gap-1 text-ink">
        {title ? <p className="font-bold">{title}</p> : null}
        {children}
      </div>
    </div>
  )
}

function ToneIcon({ tone }: { tone: keyof typeof TONES }) {
  if (tone === 'success') {
    return (
      <svg viewBox="0 0 20 20" className="size-5">
        <circle cx="10" cy="10" r="9" fill="currentColor" />
        <path
          d="m6 10.5 2.5 2.5L14 7.5"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 20 20" className="size-5">
      <circle cx="10" cy="10" r="9" fill="currentColor" />
      {tone === 'info' ? (
        <path d="M10 9v5M10 6v.4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M10 5.5v5.5M10 13.6v.4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  )
}
