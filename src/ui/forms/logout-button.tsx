'use client'

import { useLocale } from 'next-intl'
import { useState } from 'react'

import { Button } from '../components/button'
import { apiRequest } from '../lib/api'

/** Ends the session on the server, then returns to the login page with a confirmation. */
export function LogoutButton({ label }: { label: string }) {
  const locale = useLocale()
  const [busy, setBusy] = useState(false)
  return (
    <Button
      variant="secondary"
      size="sm"
      className="whitespace-nowrap"
      loading={busy}
      onClick={async () => {
        setBusy(true)
        await apiRequest('/api/v1/auth/logout', { body: {} })
        // Full page load so nothing rendered for the old session survives (same reason as login).
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional
        window.location.assign(`/${locale}/login?loggedOut=1`)
      }}
    >
      {label}
    </Button>
  )
}
