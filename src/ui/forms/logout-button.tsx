'use client'

import { useState } from 'react'

import { useRouter } from '@/i18n/navigation'

import { Button } from '../components/button'
import { apiRequest } from '../lib/api'

/** Ends the session on the server, then returns to the login page with a confirmation. */
export function LogoutButton({ label }: { label: string }) {
  const router = useRouter()
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
        router.replace({ pathname: '/login', query: { loggedOut: '1' } })
        router.refresh()
      }}
    >
      {label}
    </Button>
  )
}
