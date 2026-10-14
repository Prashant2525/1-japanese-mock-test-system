'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Link, useRouter } from '@/i18n/navigation'
import { registerSchema } from '@/shared/auth-schemas'

import { Alert } from '../components/alert'
import { Button } from '../components/button'
import { Field, PasswordField } from '../components/field'
import { apiRequest, type ApiErrorInfo } from '../lib/api'
import { useMessages } from './use-api-error'

const formSchema = registerSchema.pick({ name: true, email: true, password: true })
type Values = { name: string; email: string; password: string }

export const PENDING_EMAIL_KEY = 'nm-pending-email'

export function SignupForm() {
  const { t, fieldError, apiError } = useMessages()
  const locale = useLocale()
  const router = useRouter()
  const [error, setError] = useState<ApiErrorInfo | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(formSchema), mode: 'onTouched' })

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    const res = await apiRequest('/api/v1/auth/register', {
      body: { ...values, preferredLocale: locale },
    })
    if (!res.ok) return setError(res.error)
    try {
      sessionStorage.setItem(PENDING_EMAIL_KEY, values.email.trim())
    } catch {
      // Private mode: the next page simply doesn't show the address.
    }
    router.push('/check-email')
  })

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {error ? <Alert tone="danger">{apiError(error)}</Alert> : null}
      <Field
        label={t('auth.name')}
        autoComplete="name"
        error={fieldError(errors.name?.message)}
        {...register('name')}
      />
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
        hint={t('auth.passwordHint')}
        autoComplete="new-password"
        showLabel={t('a11y.showPassword')}
        hideLabel={t('a11y.hidePassword')}
        error={fieldError(errors.password?.message)}
        {...register('password')}
      />
      <Button type="submit" size="lg" loading={isSubmitting}>
        {t('auth.signup.submit')}
      </Button>
      <p className="text-sm text-muted">
        {t('auth.signup.haveAccount')}{' '}
        <Link href="/login" className="font-bold text-ink underline underline-offset-4">
          {t('auth.signup.loginLink')}
        </Link>
      </p>
    </form>
  )
}
