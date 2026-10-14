'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Link } from '@/i18n/navigation'
import { emailOnlySchema } from '@/shared/auth-schemas'

import { Alert } from '../components/alert'
import { Button } from '../components/button'
import { Field } from '../components/field'
import { apiRequest, type ApiErrorInfo } from '../lib/api'
import { useMessages } from './use-api-error'

/** Always shows the same confirmation, whether or not the address has an account. */
export function ForgotForm() {
  const { t, fieldError, apiError } = useMessages()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<ApiErrorInfo | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>({ resolver: zodResolver(emailOnlySchema), mode: 'onTouched' })

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null)
    const res = await apiRequest('/api/v1/auth/forgot-password', { body: { email } })
    if (!res.ok) return setError(res.error)
    setSentTo(email)
  })

  if (sentTo) {
    return (
      <div className="grid gap-5">
        <Alert tone="success">{t('auth.forgot.sent', { email: sentTo })}</Alert>
        <Link href="/login" className="text-sm font-bold text-ink underline underline-offset-4">
          {t('auth.forgot.backToLogin')}
        </Link>
      </div>
    )
  }
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {error ? <Alert tone="danger">{apiError(error)}</Alert> : null}
      <Field
        label={t('auth.email')}
        type="email"
        autoComplete="email"
        inputMode="email"
        error={fieldError(errors.email?.message)}
        {...register('email')}
      />
      <Button type="submit" size="lg" loading={isSubmitting}>
        {t('auth.forgot.submit')}
      </Button>
      <Link href="/login" className="text-sm font-bold text-ink underline underline-offset-4">
        {t('auth.forgot.backToLogin')}
      </Link>
    </form>
  )
}
