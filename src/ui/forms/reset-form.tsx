'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Link } from '@/i18n/navigation'
import { resetFormSchema } from '@/shared/auth-schemas'

import { Alert } from '../components/alert'
import { Button } from '../components/button'
import { PasswordField } from '../components/field'
import { apiRequest, type ApiErrorInfo } from '../lib/api'
import { useMessages } from './use-api-error'

type Values = { password: string; confirm: string }

export function ResetForm() {
  const { t, fieldError, apiError } = useMessages()
  const token = useSearchParams().get('token')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<ApiErrorInfo | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(resetFormSchema), mode: 'onTouched' })

  if (!token) {
    return (
      <div className="grid gap-5">
        <Alert tone="danger">{t('auth.reset.missingToken')}</Alert>
        <Link
          href="/forgot-password"
          className="text-sm font-bold text-ink underline underline-offset-4"
        >
          {t('auth.reset.requestNew')}
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="grid gap-5">
        <Alert tone="success">{t('auth.reset.success')}</Alert>
        <Button asChild size="lg">
          <Link href="/login">{t('auth.reset.goToLogin')}</Link>
        </Button>
      </div>
    )
  }

  const onSubmit = handleSubmit(async ({ password }) => {
    setError(null)
    const res = await apiRequest('/api/v1/auth/reset-password', { body: { token, password } })
    if (!res.ok) return setError(res.error)
    setDone(true)
  })

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {error ? (
        <Alert tone="danger">
          {apiError(error)}{' '}
          {error.code === 'INVALID_TOKEN' ? (
            <Link href="/forgot-password" className="font-bold underline underline-offset-4">
              {t('auth.reset.requestNew')}
            </Link>
          ) : null}
        </Alert>
      ) : null}
      <PasswordField
        label={t('auth.newPassword')}
        hint={t('auth.passwordHint')}
        autoComplete="new-password"
        showLabel={t('a11y.showPassword')}
        hideLabel={t('a11y.hidePassword')}
        error={fieldError(errors.password?.message)}
        {...register('password')}
      />
      <PasswordField
        label={t('auth.confirmPassword')}
        autoComplete="new-password"
        showLabel={t('a11y.showPassword')}
        hideLabel={t('a11y.hidePassword')}
        error={fieldError(errors.confirm?.message)}
        {...register('confirm')}
      />
      <Button type="submit" size="lg" loading={isSubmitting}>
        {t('auth.reset.submit')}
      </Button>
    </form>
  )
}
