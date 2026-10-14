import { cn } from '../lib/cn'

/** Google's "G" mark, unmodified (sign-in branding guidelines). Decorative: the text names the action. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

/**
 * "Continue with Google" (D-066). A plain link, so it works before JavaScript loads; the server
 * route sends the browser on to Google. Never prefetched (it is not a Next.js Link).
 */
export function GoogleButton({
  locale,
  next,
  label,
  className,
}: {
  locale: string
  next?: string | null
  label: string
  className?: string
}) {
  const params = new URLSearchParams({ locale })
  if (next) params.set('next', next)
  return (
    <a
      href={`/api/v1/auth/google?${params.toString()}`}
      className={cn(
        'inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-card border border-google-stroke bg-surface px-6 text-base font-bold text-google-text',
        'transition-[background-color,transform,box-shadow] duration-200 ease-standard hover:-translate-y-px hover:bg-day active:translate-y-0',
        className,
      )}
    >
      <GoogleMark />
      <span>{label}</span>
    </a>
  )
}

/** "or" separator between Google and the email form. */
export function OrDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
      <span aria-hidden="true">{label}</span>
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
    </div>
  )
}
