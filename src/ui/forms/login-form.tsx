'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale } from 'next-intl'
import { useRouter as useAbsoluteRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Link } from '@/i18n/navigation'
import { loginSchema } from '@/shared/auth-schemas'

import { Alert } from '../components/alert'
import { Button } from '../components/button'
import { Field, PasswordField } from '../components/field'
import { apiRequest, type ApiErrorInfo } from '../lib/api'
import { safeNextPath } from '../lib/safe-next'
import { ResendForm } from './resend-form'
import { useMessages } from './use-api-error'

type Values = { email: string; password: string }

export function LoginForm() {
  const { t, fieldError, apiError } = useMessages()
  const locale = useLocale()
  const search = useSearchParams()
  const router = useAbsoluteRouter()
  const [error, setError] = useState<ApiErrorInfo | null>(null)
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
    router.replace(safeNextPath(search.get('next'), locale))
    router.refresh()
  })

  // The not-verified notice holds its own form, so it sits outside the login form (no nested forms).
  return (
    <div className="grid gap-5">
      {search.get('loggedOut') ? <Alert tone="success">{t('app.loggedOut')}</Alert> : null}
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
        <Button type="submit" size="lg" loading={isSubmitting}>
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
