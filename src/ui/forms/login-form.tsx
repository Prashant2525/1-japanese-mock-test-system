'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Link } from '@/i18n/navigation'
import { loginSchema } from '@/shared/auth-schemas'

import { Alert } from '../components/alert'
import { Button } from '../components/button'
import { Field, PasswordField } from '../components/field'
import { GoogleButton, OrDivider } from '../components/google-button'
import { apiRequest, type ApiErrorInfo } from '../lib/api'
import { safeNextPath } from '../lib/safe-next'
import { ResendForm } from './resend-form'
import { useMessages } from './use-api-error'

type Values = { email: string; password: string }

/** Reasons the Google route can send back as ?oauth=… (see server/services/google-auth.ts). */
const GOOGLE_FAILURES = new Set([
  'cancelled',
  'expired',
  'failed',
  'disabled',
  'unavailable',
  'rate_limited',
])

export function LoginForm({ google = false }: { google?: boolean }) {
  const { t, fieldError, apiError } = useMessages()
  const locale = useLocale()
  const search = useSearchParams()
  const [error, setError] = useState<ApiErrorInfo | null>(null)
  const [leaving, setLeaving] = useState(false)
  const oauth = search.get('oauth')
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(loginSchema), mode: 'onTouched' })

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    const res = await apiRequest('/api/v1/auth/login', { body: values })
    if (!res.ok) return setError(res.error)
    // A full page load, not a client-side transition: the whole page (header included) is rendered
    // with the new session, and a refresh can't race the navigation and leave the visitor here.
    setLeaving(true)
    window.location.assign(safeNextPath(search.get('next'), locale))
  })

  // The not-verified notice holds its own form, so it sits outside the login form (no nested forms).
  return (
    <div className="grid gap-5">
      {search.get('loggedOut') ? <Alert tone="success">{t('app.loggedOut')}</Alert> : null}
      {oauth && GOOGLE_FAILURES.has(oauth) && !error ? (
        <Alert tone={oauth === 'cancelled' ? 'info' : 'danger'}>
          {t(`auth.google.errors.${oauth}` as never)}
        </Alert>
      ) : null}
      {error && error.code !== 'EMAIL_NOT_VERIFIED' ? (
        <Alert tone="danger">{apiError(error)}</Alert>
      ) : null}
      {error?.code === 'EMAIL_NOT_VERIFIED' ? (
        <Alert tone="warning" title={t('errors.EMAIL_NOT_VERIFIED')}>
          <p>{t('auth.login.notVerified')}</p>
          <div className="mt-2">
            <ResendForm
              defaultEmail={getValues('email')}
              submitLabel={t('auth.login.resendVerification')}
            />
          </div>
        </Alert>
      ) : null}
      {google ? (
        <>
          <GoogleButton
            locale={locale}
            next={search.get('next')}
            label={t('auth.google.continue')}
          />
          <OrDivider label={t('auth.google.or')} />
        </>
      ) : null}
      <form onSubmit={onSubmit} noValidate className="grid gap-5">
        <Field
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          inputMode="email"
          error={fieldError(errors.email?.message)}
          {...register('email')}
        />
        <PasswordField
          label={t('auth.password')}
          autoComplete="current-password"
          showLabel={t('a11y.showPassword')}
          hideLabel={t('a11y.hidePassword')}
          error={fieldError(errors.password?.message)}
          labelAside={
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-ink underline underline-offset-4"
            >
              {t('auth.login.forgot')}
            </Link>
          }
          {...register('password')}
        />
        <Button type="submit" size="lg" loading={isSubmitting || leaving}>
          {t('auth.login.submit')}
        </Button>
        <p className="text-sm text-muted">
          {t('auth.login.noAccount')}{' '}
          <Link href="/signup" className="font-bold text-ink underline underline-offset-4">
            {t('auth.login.signupLink')}
          </Link>
        </p>
      </form>
    </div>
  )
}
