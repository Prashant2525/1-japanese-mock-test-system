'use client'

import { useEffect, useId, useRef, useState } from 'react'

import { Link, usePathname } from '@/i18n/navigation'

import { LogoutButton } from '../forms/logout-button'
import { Button } from './button'

/**
 * Signed-in header actions. Larger screens show "My page" and "Log out" inline; phones have no
 * room, so they get one "Menu" button that opens both (a disclosure: Escape and outside clicks close
 * it, and it closes after navigating).
 */
export function AccountMenu({
  myPageLabel,
  logoutLabel,
  menuLabel,
}: {
  myPageLabel: string
  logoutLabel: string
  menuLabel: string
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const root = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onClick = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <>
      <div className="hidden items-center gap-3 sm:flex">
        <Button asChild variant="ghost" size="sm" className="whitespace-nowrap">
          <Link href="/app">{myPageLabel}</Link>
        </Button>
        <LogoutButton label={logoutLabel} />
      </div>
      <div ref={root} className="relative sm:hidden">
        <Button
          variant="secondary"
          size="sm"
          className="whitespace-nowrap"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
            <path
              d={open ? 'M5 5l10 10M15 5L5 15' : 'M3 6h14M3 10h14M3 14h14'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {menuLabel}
        </Button>
        <div
          id={panelId}
          hidden={!open}
          className="absolute top-full right-0 z-20 mt-2 grid w-48 gap-2 rounded-card border border-line bg-surface p-3 shadow-card"
        >
          <Button asChild variant="ghost" size="md" className="justify-start">
            <Link
              href="/app"
              onClick={() => setOpen(false)}
              aria-current={pathname === '/app' ? 'page' : undefined}
            >
              {myPageLabel}
            </Link>
          </Button>
          <LogoutButton label={logoutLabel} />
        </div>
      </div>
    </>
  )
}
