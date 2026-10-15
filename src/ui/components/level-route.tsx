import type { CSSProperties } from 'react'

import { cn } from '../lib/cn'

/**
 * The level-check route drawn from the CMS catalogue (DESIGN_SYSTEM §2): one station per stage,
 * in each level's own line colour. Read as an ordered list by screen readers.
 */
export function LevelRoute({
  stops,
  label,
  className,
}: {
  stops: { code: string; lineColor: string }[]
  label: string
  className?: string
}) {
  return (
    <ol aria-label={label} className={cn('flex flex-wrap items-start', className)}>
      {stops.map((s, i) => (
        <li
          key={s.code}
          className="relative flex min-w-20 flex-col items-center gap-2 font-sign text-lg font-bold"
          style={{ '--stop': s.lineColor } as CSSProperties}
        >
          {i < stops.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute top-[0.85rem] left-[calc(50%+1rem)] h-1.5 w-[calc(100%-2rem)] rounded-full"
              style={{
                background: `linear-gradient(90deg, ${s.lineColor}, ${stops[i + 1]!.lineColor})`,
              }}
            />
          ) : null}
          <span
            aria-hidden="true"
            className="size-8 rounded-full border-[6px] bg-surface"
            style={{ borderColor: 'var(--stop)' }}
          />
          {s.code}
        </li>
      ))}
    </ol>
  )
}
