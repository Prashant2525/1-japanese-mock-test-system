'use client'

import { Link, usePathname } from '@/i18n/navigation'

import { cn } from '../lib/cn'

/** Student-area tabs (shown only once a level is assigned; the server gates the pages anyway). */
export function StudentNav({
  label,
  items,
}: {
  label: string
  items: { href: string; label: string }[]
}) {
  const pathname = usePathname()
  return (
    <nav aria-label={label} className="border-b border-line bg-surface">
      <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
        {items.map((item) => {
          const active = item.href === '/app' ? pathname === '/app' : pathname.startsWith(item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-11 items-center border-b-[3px] px-3 text-sm font-bold whitespace-nowrap transition-colors',
                  active
                    ? 'border-signal text-ink'
                    : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
