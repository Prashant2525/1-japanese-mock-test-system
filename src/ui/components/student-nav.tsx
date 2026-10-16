'use client'

import type { ReactNode } from 'react'

import { Link, usePathname } from '@/i18n/navigation'

import { cn } from '../lib/cn'
import { StationBadge } from './station-badge'

export type StudentNavIcon = 'home' | 'study' | 'tests' | 'results' | 'profile'
export type StudentNavItem = { href: string; label: string; icon: StudentNavIcon }

/** Simple line icons (decorative: every item also has its visible label). */
const ICONS: Record<StudentNavIcon, ReactNode> = {
  home: <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" />,
  study: (
    <path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5V19c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5zM12 6v13.5" />
  ),
  tests: (
    <path d="M7 4h10a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm2 5h6m-6 4h6m-6 4h3" />
  ),
  results: <path d="M5 20V10m5 10V5m5 15v-7m5 7V8M3 20h18" />,
  profile: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0" />,
}

function Icon({ name }: { name: StudentNavIcon }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name]}
    </svg>
  )
}

function useActive() {
  const pathname = usePathname()
  return (href: string) => (href === '/app' ? pathname === '/app' : pathname.startsWith(href))
}

/**
 * The signed-in student area's navigation (D-098): a left sidebar on large screens and a bottom
 * tab bar on phones and tablets. Only one is visible at a time; both carry the same label.
 * Shown only once a level is assigned — the server gates every page anyway.
 */
export function StudentSidebar({
  label,
  items,
  level,
  levelLabel,
}: {
  label: string
  items: StudentNavItem[]
  level: { code: string; name: string; badgeColor: string } | null
  levelLabel: string
}) {
  const isActive = useActive()
  return (
    <aside className="hidden bg-night text-on-night lg:block">
      <div className="sticky top-0 grid gap-6 px-4 py-6">
        {level ? (
          <div className="grid gap-2 rounded-card border border-white/15 p-4">
            <span className="text-xs font-bold tracking-wider text-muted-on-night uppercase">
              {levelLabel}
            </span>
            <span className="flex items-center gap-3">
              <StationBadge level={level.code} color={level.badgeColor} className="text-lg" />
              {level.name !== level.code ? <span className="font-bold">{level.name}</span> : null}
            </span>
          </div>
        ) : null}
        <nav aria-label={label}>
          <ul className="grid gap-1">
            {items.map((item) => {
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-11 items-center gap-3 rounded-input px-3 text-sm font-bold transition-colors',
                      active
                        ? 'bg-white/12 text-white shadow-[inset_3px_0_0_var(--signal)]'
                        : 'text-muted-on-night hover:bg-white/8 hover:text-white',
                    )}
                  >
                    <Icon name={item.icon} />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </aside>
  )
}

export function StudentTabBar({ label, items }: { label: string; items: StudentNavItem[] }) {
  const isActive = useActive()
  return (
    <nav
      aria-label={label}
      className="sticky bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {items.map((item) => {
          const active = isActive(item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[0.7rem] leading-tight font-bold',
                  active ? 'text-ink' : 'text-muted',
                )}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-4 top-0 h-[3px] rounded-b bg-signal"
                  />
                ) : null}
                <Icon name={item.icon} />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
