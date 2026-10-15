'use client'

import { useState } from 'react'

import { Alert } from '../components/alert'
import { Button } from '../components/button'
import { useMessages } from '../forms/use-api-error'
import { apiRequest, type ApiErrorInfo } from '../lib/api'

/** Starts (or continues) the level check, then opens the stage screen. Starts at N5, always. */
export function StartLevelCheck({
  locale,
  label,
  resume,
}: {
  locale: string
  label: string
  resume: boolean
}) {
  const { apiError } = useMessages()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<ApiErrorInfo | null>(null)
  const start = async () => {
    setBusy(true)
    setError(null)
    if (!resume) {
      const res = await apiRequest('/api/v1/determination/start', { body: {} })
      if (!res.ok) {
        setBusy(false)
        return setError(res.error)
      }
    }
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full load into the calm test screen
    window.location.assign(`/${locale}/app/level-check/stage`)
  }
  return (
    <div className="grid gap-3">
      {error ? <Alert tone="danger">{apiError(error)}</Alert> : null}
      <Button size="lg" loading={busy} onClick={() => void start()} className="justify-self-start">
        {label}
      </Button>
    </div>
  )
}
