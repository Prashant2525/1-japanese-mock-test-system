import { describe, expect, it } from 'vitest'

import {
  addMonths,
  firstGoalMet,
  firstStreakOf,
  lastSevenDays,
  milestones,
  monthGrid,
  nepalDate,
  parseMonth,
  streaks,
} from '@/domain/study-days'

/** D-110, D-111: study days, streaks, week, milestones and the calendar grid. */
describe('Nepal days', () => {
  it('turns at 00:00 Nepal time (18:15 UTC the day before)', () => {
    expect(nepalDate('2026-10-15T18:14:59Z')).toBe('2026-10-15')
    expect(nepalDate('2026-10-15T18:15:00Z')).toBe('2026-10-16')
    expect(nepalDate('2026-12-31T20:00:00Z')).toBe('2027-01-01')
  })
})

describe('streaks', () => {
  const today = '2026-10-16'

  it('a new student has no streak', () => {
    expect(streaks([], today)).toEqual({ current: 0, longest: 0, studiedToday: false })
  })

  it('counts consecutive days ending today', () => {
    expect(streaks(['2026-10-14', '2026-10-15', '2026-10-16'], today)).toEqual({
      current: 3,
      longest: 3,
      studiedToday: true,
    })
  })

  it('stays alive until today ends when yesterday was a study day', () => {
    expect(streaks(['2026-10-14', '2026-10-15'], today).current).toBe(2)
  })

  it('a missed day resets it; the longest run is kept', () => {
    const s = streaks(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-15'], today)
    expect(s.current).toBe(1)
    expect(s.longest).toBe(4)
    expect(streaks(['2026-10-13', '2026-10-14'], today).current).toBe(0) // gap yesterday
  })

  it('ignores duplicates, order and future dates; runs across months and years', () => {
    expect(streaks(['2026-10-16', '2026-10-15', '2026-10-15', '2026-10-17'], today).current).toBe(2)
    expect(streaks(['2026-12-31', '2027-01-01'], '2027-01-01').current).toBe(2)
    expect(streaks(['2026-09-30', '2026-10-01'], '2026-10-01').current).toBe(2)
  })

  it('the day a streak length was first reached', () => {
    expect(
      firstStreakOf(['2026-10-01', '2026-10-02', '2026-10-04', '2026-10-05', '2026-10-06'], 3),
    ).toBe('2026-10-06')
    expect(firstStreakOf(['2026-10-01'], 3)).toBeNull()
  })
})

describe('the last seven days', () => {
  it('oldest first, zero-filled, ending today', () => {
    const week = lastSevenDays(
      new Map([
        ['2026-10-16', 2],
        ['2026-10-10', 1],
        ['2026-10-09', 5], // eight days ago: outside
      ]),
      '2026-10-16',
    )
    expect(week.map((d) => d.date)).toEqual([
      '2026-10-10',
      '2026-10-11',
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
    ])
    expect(week.map((d) => d.count)).toEqual([1, 0, 0, 0, 0, 0, 2])
  })
})

describe('milestones', () => {
  it('earned from first-studied materials, study days, the level check and the goal', () => {
    const studied = Array.from(
      { length: 10 },
      (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`,
    )
    const m = milestones({
      firstStudiedDays: studied,
      studyDays: studied,
      levelCheckCompletedOn: '2026-09-30',
      goalMetOn: '2026-10-01',
    })
    const by = Object.fromEntries(m.map((x) => [x.key, x]))
    expect(by['first-material']!.earnedOn).toBe('2026-10-01')
    expect(by['materials-10']!.earnedOn).toBe('2026-10-10')
    expect(by['materials-25']).toMatchObject({ earnedOn: null, value: 10, target: 25 })
    expect(by['streak-7']!.earnedOn).toBe('2026-10-07')
    expect(by['streak-30']).toMatchObject({ earnedOn: null, value: 10 })
    expect(by['level-check']!.earnedOn).toBe('2026-09-30')
    expect(by['goal-met']!.earnedOn).toBe('2026-10-01')
  })

  it('the first day a daily goal was met', () => {
    const days = [
      '2026-10-01',
      '2026-10-02',
      '2026-10-02',
      '2026-10-03',
      '2026-10-03',
      '2026-10-03',
    ]
    expect(firstGoalMet(days, 1)).toBe('2026-10-01')
    expect(firstGoalMet(days, 2)).toBe('2026-10-02')
    expect(firstGoalMet(days, 3)).toBe('2026-10-03')
    expect(firstGoalMet(days, 4)).toBeNull()
  })
})

describe('calendar grid', () => {
  it('weeks start on Sunday; days outside the month are empty', () => {
    const grid = monthGrid('2026-10') // 1 October 2026 is a Thursday
    expect(grid[0]).toEqual([null, null, null, null, '2026-10-01', '2026-10-02', '2026-10-03'])
    expect(grid.flat().filter(Boolean)).toHaveLength(31)
    expect(grid.every((w) => w.length === 7)).toBe(true)
    expect(monthGrid('2027-02').flat().filter(Boolean)).toHaveLength(28)
  })

  it('month parameters are validated and moved across years', () => {
    expect(parseMonth('2026-13', '2026-10')).toBe('2026-10')
    expect(parseMonth('evil', '2026-10')).toBe('2026-10')
    expect(parseMonth('2027-01', '2026-10')).toBe('2027-01')
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
  })
})
