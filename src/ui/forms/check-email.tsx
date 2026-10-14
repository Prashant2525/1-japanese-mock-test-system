'use client'

import { useState, useSyncExternalStore } from 'react'

import { Link } from '@/i18n/navigation'

import { Alert } from '../components/alert'
import { Button } from '../components/button'
import { useToast } from '../components/toast'
import { apiRequest, type ApiErrorInfo } from '../lib/api'
import { ResendForm } from './resend-form'
import { PENDING_EMAIL_KEY } from './signup-form'
import { useMessages } from './use-api-error'

const noSubscribe = () => () => {}

function readPendingEmail(): string | null {
  try {
    return sessionStorage.getItem(PENDING_EMAIL_KEY)
  } catch {
    return null
  }
}

/** "Check your email" after sign-up. The address is kept in sessionStorage, never in the URL. */
export function CheckEmail() {
  const { t, apiError } = useMessages()
  const toast = useToast()
  const email = useSyncExternalStore(noSubscribe, readPendingEmail, () => null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<ApiErrorInfo | null>(null)

  async function resend() {
    if (!email) return
    setBusy(true)
    setError(null)
    const res = await apiRequest('/api/v1/auth/resend-verification', { body: { email } })
    setBusy(false)
    if (!res.ok) return setError(res.error)
    toast.show(t('auth.checkEmail.resent'))
  }

  return (
    <div className="grid gap-5">
      <p className="text-muted">
        {email ? t('auth.checkEmail.body', { email }) : t('auth.checkEmail.bodyNoEmail')}
      </p>
      <p className="text-sm text-muted">{t('auth.checkEmail.resendPrompt')}</p>
      {error ? <Alert tone="danger">{apiError(error)}</Alert> : null}
      {email ? (
        <Button variant="secondary" loading={busy} onClick={resend}>
          {t('auth.checkEmail.resend')}
        </Button>
      ) : (
        <ResendForm submitLabel={t('auth.checkEmail.resend')} />
      )}
      <Link href="/login" className="text-sm font-bold text-ink underline underline-offset-4">
        {t('auth.checkEmail.backToLogin')}
      </Link>
    </div>
  )
}
