'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { emailOnlySchema } from '@/shared/auth-schemas'

import { Alert } from '../components/alert'
import { Button } from '../components/button'
import { Field } from '../components/field'
import { apiRequest, type ApiErrorInfo } from '../lib/api'
import { useMessages } from './use-api-error'

/** Asks for a new verification link. The answer never reveals whether the address has an account. */
export function ResendForm({
  defaultEmail = '',
  submitLabel,
}: {
  defaultEmail?: string
  submitLabel: string
}) {
  const { t, fieldError, apiError } = useMessages()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<ApiErrorInfo | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: defaultEmail },
  })

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null)
    const res = await apiRequest('/api/v1/auth/resend-verification', { body: { email } })
    if (!res.ok) return setError(res.error)
    setDone(true)
  })

  if (done) return <Alert tone="success">{t('auth.checkEmail.resent')}</Alert>
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      {error ? <Alert tone="danger">{apiError(error)}</Alert> : null}
      <Field
        label={t('auth.email')}
        type="email"
        autoComplete="email"
        inputMode="email"
        error={fieldError(errors.email?.message)}
        {...register('email')}
      />
      <Button type="submit" variant="secondary" loading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  )
}
