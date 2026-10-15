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
 * so the colour never carries meaning on its own. Pass the CMS colour when it is known.
 */
export function StationBadge({
  level,
  color,
  className,
}: {
  level: string
  /** The level's badge colour from the CMS (validated for contrast with white text). */
  color?: string
  className?: string
}) {
  return (
    <span
      style={color ? { backgroundColor: color } : undefined}
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
