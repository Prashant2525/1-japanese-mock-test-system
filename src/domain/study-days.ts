/**
 * Study days, streaks, the weekly chart, milestones and the calendar grid (D-110, D-111). Pure.
 *
 * - A **study action** is the first time a student marks a material as studied (re-marking the
 *   same material never counts again) or a finished test / level-check stage. Opening pages,
 *   time on a page and repeated toggling never count.
 * - A **study day** is a calendar day in Nepal time (UTC+05:45, no daylight saving) with at
 *   least one study action.
 * - **Current streak** = consecutive study days ending today, or ending yesterday when today
 *   has no action yet (the streak is still alive until the day ends). **Longest** = best run ever.
 *   A missed day resets the streak; there are no "freeze" days.
 * Dates are plain `YYYY-MM-DD` strings in Nepal time.
 */
export const NEPAL_OFFSET_MINUTES = 5 * 60 + 45

/** The Nepal calendar date of an instant. */
export function nepalDate(at: string | Date): string {
  const ms =
    (typeof at === 'string' ? Date.parse(at) : at.getTime()) + NEPAL_OFFSET_MINUTES * 60_000
  return new Date(ms).toISOString().slice(0, 10)
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Whole days from `a` to `b` (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000)
}

export type Streaks = { current: number; longest: number; studiedToday: boolean }

export function streaks(studyDays: Iterable<string>, today: string): Streaks {
  const days = [...new Set(studyDays)].filter((d) => d <= today).sort()
  let longest = 0
  let run = 0
  let prev: string | null = null
  for (const d of days) {
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
    prev = d
  }
  const set = new Set(days)
  const studiedToday = set.has(today)
  let current = 0
  let cursor = studiedToday ? today : addDays(today, -1)
  while (set.has(cursor)) {
    current += 1
    cursor = addDays(cursor, -1)
  }
  return { current, longest, studiedToday }
}

/** The last seven Nepal days, oldest first, with their action counts. */
export function lastSevenDays(
  actionsPerDay: Map<string, number>,
  today: string,
): { date: string; count: number }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6)
    return { date, count: actionsPerDay.get(date) ?? 0 }
  })
}

/** The day a run of `length` consecutive study days was first completed, or null. */
export function firstStreakOf(studyDays: Iterable<string>, length: number): string | null {
  const days = [...new Set(studyDays)].sort()
  let run = 0
  let prev: string | null = null
  for (const d of days) {
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1
    if (run >= length) return d
    prev = d
  }
  return null
}

export type MilestoneKey =
  | 'first-material'
  | 'materials-10'
  | 'materials-25'
  | 'materials-50'
  | 'level-check'
  | 'streak-3'
  | 'streak-7'
  | 'streak-30'
  | 'goal-met'

export type Milestone = {
  key: MilestoneKey
  earnedOn: string | null
  target: number
  value: number
}

/**
 * Milestones from records that only ever grow (DASH-4): first-studied dates, study days and the
 * level check. No points; nothing is earned by repeating an action.
 */
export function milestones(input: {
  firstStudiedDays: string[] // one Nepal date per material, the first time it was marked studied
  studyDays: string[]
  levelCheckCompletedOn: string | null
  goalMetOn: string | null
}): Milestone[] {
  const studied = [...input.firstStudiedDays].sort()
  const nth = (n: number) => studied[n - 1] ?? null
  const best = streaks(input.studyDays, '9999-12-31').longest
  return [
    { key: 'first-material', earnedOn: nth(1), target: 1, value: Math.min(studied.length, 1) },
    { key: 'materials-10', earnedOn: nth(10), target: 10, value: Math.min(studied.length, 10) },
    { key: 'materials-25', earnedOn: nth(25), target: 25, value: Math.min(studied.length, 25) },
    { key: 'materials-50', earnedOn: nth(50), target: 50, value: Math.min(studied.length, 50) },
    {
      key: 'level-check',
      earnedOn: input.levelCheckCompletedOn,
      target: 1,
      value: input.levelCheckCompletedOn ? 1 : 0,
    },
    {
      key: 'streak-3',
      earnedOn: firstStreakOf(input.studyDays, 3),
      target: 3,
      value: Math.min(best, 3),
    },
    {
      key: 'streak-7',
      earnedOn: firstStreakOf(input.studyDays, 7),
      target: 7,
      value: Math.min(best, 7),
    },
    {
      key: 'streak-30',
      earnedOn: firstStreakOf(input.studyDays, 30),
      target: 30,
      value: Math.min(best, 30),
    },
    { key: 'goal-met', earnedOn: input.goalMetOn, target: 1, value: input.goalMetOn ? 1 : 0 },
  ]
}

/** The first day each daily goal was met: the first Nepal day with ≥ goal first-studied materials. */
export function firstGoalMet(firstStudiedDays: string[], goal: number): string | null {
  const perDay = new Map<string, number>()
  for (const d of firstStudiedDays) perDay.set(d, (perDay.get(d) ?? 0) + 1)
  return (
    [...perDay.entries()]
      .filter(([, n]) => n >= goal)
      .map(([d]) => d)
      .sort()[0] ?? null
  )
}

/** `YYYY-MM` of a date; validates a month parameter (falls back to `fallback`). */
export function monthOf(date: string): string {
  return date.slice(0, 7)
}

export function parseMonth(value: string | null | undefined, fallback: string): string {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : fallback
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number) as [number, number]
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return d.toISOString().slice(0, 7)
}

/**
 * The month as weeks starting on Sunday (Nepal and Japan calendars start on Sunday); days outside
 * the month are null.
 */
export function monthGrid(month: string): (string | null)[][] {
  const first = `${month}-01`
  const startDay = new Date(`${first}T00:00:00Z`).getUTCDay()
  const daysInMonth = daysBetween(first, `${addMonths(month, 1)}-01`)
  const cells: (string | null)[] = [
    ...Array<null>(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => addDays(first, i)),
  ]
  while (cells.length % 7) cells.push(null)
  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}
