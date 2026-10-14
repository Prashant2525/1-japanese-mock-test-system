'use client'

import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'

import { cn } from '../lib/cn'

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  /** Already-translated error message. */
  error?: string
  /** Extra element at the end of the label row (e.g. "Forgot password?"). */
  labelAside?: ReactNode
}

const inputClass = (invalid: boolean) =>
  cn(
    'block w-full min-h-12 rounded-input border bg-surface px-3.5 text-base text-ink placeholder:text-muted/70',
    'transition-[border-color,box-shadow] duration-200 focus:border-focus focus:outline-none focus:ring-3 focus:ring-focus/30',
    invalid ? 'border-danger' : 'border-line hover:border-muted/60',
  )

/**
 * Labelled input with hint and error wired to aria-describedby / aria-invalid.
 * Works with react-hook-form's register() (forwards the ref).
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, labelAside, id, className, ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  return (
    <div className={cn('grid gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-bold text-ink">
          {label}
        </label>
        {labelAside}
      </div>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        className={inputClass(Boolean(error))}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-center gap-1.5 text-sm font-medium text-danger">
          <ErrorIcon />
          {error}
        </p>
      ) : null}
    </div>
  )
})

type PasswordFieldProps = Omit<FieldProps, 'type'> & { showLabel: string; hideLabel: string }

/** Password input with a show/hide toggle (the toggle is a real button with a state label). */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(
    { label, hint, error, labelAside, id, className, showLabel, hideLabel, ...props },
    ref,
  ) {
    const autoId = useId()
    const inputId = id ?? autoId
    const [visible, setVisible] = useState(false)
    const hintId = hint ? `${inputId}-hint` : undefined
    const errorId = error ? `${inputId}-error` : undefined
    return (
      <div className={cn('grid gap-1.5', className)}>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={inputId} className="text-sm font-bold text-ink">
            {label}
          </label>
          {labelAside}
        </div>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            aria-invalid={error ? true : undefined}
            aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
            className={cn(inputClass(Boolean(error)), 'pr-12')}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? hideLabel : showLabel}
            aria-pressed={visible}
            aria-controls={inputId}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-input text-muted hover:text-ink"
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {hint ? (
          <p id={hintId} className="text-sm text-muted">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="flex items-center gap-1.5 text-sm font-medium text-danger">
            <ErrorIcon />
            {error}
          </p>
        ) : null}
      </div>
    )
  },
)

function ErrorIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-4 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="8" fill="currentColor" />
      <path d="M10 5.5v5.5M10 13.6v.4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M3 3l18 18M10.6 5.1A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}
