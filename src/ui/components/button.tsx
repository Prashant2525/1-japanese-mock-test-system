import { Slot } from '@radix-ui/react-slot'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '../lib/cn'
import { Spinner } from './spinner'

const VARIANTS = {
  primary:
    'bg-signal text-white shadow-[0_10px_24px_-12px_rgb(215_38_47/0.8)] hover:bg-signal-hover disabled:bg-signal/60',
  secondary: 'border-2 border-ink text-ink bg-surface hover:bg-day',
  ghost: 'text-ink hover:bg-ink/5',
  onNight: 'border-2 border-on-night/80 text-on-night hover:bg-on-night/10',
} as const

const SIZES = {
  md: 'min-h-11 px-5 text-[0.95rem]',
  lg: 'min-h-12 px-6 text-base',
  sm: 'min-h-9 px-3 text-sm',
} as const

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS
  size?: keyof typeof SIZES
  /** Shows a spinner, disables the button and announces busy state. */
  loading?: boolean
  /** Render the child element (e.g. a Link) with button styling. */
  asChild?: boolean
  children: ReactNode
}

/** Primary action = signal red (one per view). Minimum 44px tall for touch (DESIGN_SYSTEM §5). */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  asChild = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-card font-bold transition-[background-color,transform,box-shadow] duration-200 ease-standard',
    'hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-70',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
  if (asChild) {
    return (
      <Slot className={classes} {...props}>
        {children}
      </Slot>
    )
  }
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : null}
      {children}
    </button>
  )
}
