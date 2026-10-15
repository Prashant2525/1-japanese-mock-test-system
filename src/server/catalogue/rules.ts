import { AA_LARGE_OR_UI, AA_TEXT, contrastRatio } from '@/ui/lib/contrast'

/**
 * Exam catalogue rules (D-008, D-014, D-020). Pure functions: the Levels collection calls them
 * before saving, and unit tests cover every branch.
 */

/** The exam type whose levels make up the level check and the study library. */
export const JLPT_CODE = 'JLPT'

/** The night background the route lines are drawn on (DESIGN_SYSTEM §3, token `--night`). */
export const NIGHT_BACKGROUND = '#0f2340'

const HEX = /^#[0-9a-fA-F]{6}$/

/**
 * Checks a level colour. Badges carry white text (≥ 4.5:1); route lines are drawn on the night
 * background (≥ 3:1). Returns the measured ratio when it is too low.
 */
export function colourProblem(
  kind: 'line' | 'badge',
  value: unknown,
): { reason: 'format' } | { reason: 'contrast'; ratio: number; minimum: number } | null {
  if (typeof value !== 'string' || !HEX.test(value)) return { reason: 'format' }
  const [against, minimum] =
    kind === 'badge' ? ['#ffffff', AA_TEXT] : [NIGHT_BACKGROUND, AA_LARGE_OR_UI]
  const ratio = contrastRatio(value, against)
  return ratio >= minimum
    ? null
    : { reason: 'contrast', ratio: Math.round(ratio * 100) / 100, minimum }
}

export type LadderLevel = { id: number | string; code: string; order: number; enabled: boolean }

export type LadderProblem =
  | { reason: 'first_level_required'; level: string }
  | { reason: 'gap'; level: string; missing: string }

/**
 * The level check always starts at the easiest JLPT level and moves up one level at a time
 * (D-008, D-020 safety invariant). So the levels enabled for it must be the easiest one plus an
 * unbroken run above it: N5, N5→N4, N5→N4→N3, … Never N5→N3 without N4.
 */
export function ladderProblem(levels: LadderLevel[]): LadderProblem | null {
  const sorted = [...levels].sort((a, b) => a.order - b.order || a.code.localeCompare(b.code))
  const first = sorted[0]
  if (!first) return null
  if (!first.enabled) return { reason: 'first_level_required', level: first.code }
  const firstOff = sorted.findIndex((l) => !l.enabled)
  if (firstOff === -1) return null
  const laterOn = sorted.slice(firstOff + 1).find((l) => l.enabled)
  return laterOn ? { reason: 'gap', level: laterOn.code, missing: sorted[firstOff]!.code } : null
}
