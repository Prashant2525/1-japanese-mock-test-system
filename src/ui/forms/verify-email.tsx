'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { Link } from '@/i18n/navigation'

import { Alert } from '../components/alert'
import { Button } from '../components/button'
import { Spinner } from '../components/spinner'
import { apiRequest, type ApiErrorInfo } from '../lib/api'
import { ResendForm } from './resend-form'
import { useMessages } from './use-api-error'

type State =
  | { kind: 'working' }
  | { kind: 'success' }
  | { kind: 'error'; error: ApiErrorInfo }
  | { kind: 'missing' }

/** Confirms the email token from the link exactly once, then offers login or a new link. */
export function VerifyEmail() {
  const { t, apiError } = useMessages()
  const token = useSearchParams().get('token')
  const [state, setState] = useState<State>(token ? { kind: 'working' } : { kind: 'missing' })
  const sent = useRef(false)

  useEffect(() => {
    if (!token || sent.current) return
    sent.current = true
    void apiRequest('/api/v1/auth/verify', { body: { token } }).then((res) =>
      setState(res.ok ? { kind: 'success' } : { kind: 'error', error: res.error }),
    )
  }, [token])

  if (state.kind === 'working') {
    return (
      <p role="status" className="flex items-center gap-3 text-muted">
        <Spinner className="size-5" />
        {t('auth.verify.working')}
      </p>
    )
  }
  if (state.kind === 'success') {
    return (
      <div className="grid gap-5">
        <Alert tone="success" title={t('auth.verify.successTitle')}>
          {t('auth.verify.successBody')}
        </Alert>
        <Button asChild size="lg">
          <Link href="/login">{t('auth.verify.goToLogin')}</Link>
        </Button>
      </div>
    )
  }
  return (
    <div className="grid gap-5">
      <Alert tone="danger" title={t('auth.verify.errorTitle')}>
        {state.kind === 'missing'
          ? t('auth.verify.missingToken')
          : state.error.code === 'INVALID_TOKEN'
            ? t('auth.verify.errorBody')
            : apiError(state.error)}
      </Alert>
      <ResendForm submitLabel={t('auth.checkEmail.resend')} />
    </div>
  )
}
