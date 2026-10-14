import { cn } from '../lib/cn'

const LEVEL_CLASSES: Record<string, string> = {
  N5: 'bg-badge-n5',
  N4: 'bg-badge-n4',
  N3: 'bg-badge-n3',
  N2: 'bg-badge-n2',
  N1: 'bg-badge-n1',
}

/**
 * "Station" badge for a level (DESIGN_SYSTEM §2): the level code is always written out,
 * so the colour never carries meaning on its own. Colours become CMS-editable per level later.
 */
export function StationBadge({ level, className }: { level: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-11 items-center justify-center rounded-full px-2.5 py-0.5 font-sign text-lg font-bold leading-none text-white',
        LEVEL_CLASSES[level] ?? 'bg-night',
        className,
      )}
    >
      {level}
    </span>
  )
}
