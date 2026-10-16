import { describe, expect, it } from 'vitest'

import { percentOf, studySummary, type ProgressMaterial } from '@/domain/study-progress'

/** RV-12, D-107: how the dashboard's study figures are calculated. */
const m = (
  id: number,
  categoryKey: string,
  levelOrder: number,
  order = 1,
  categoryOrder = categoryKey === 'kanji' ? 1 : 2,
): ProgressMaterial => ({ id, categoryKey, categoryOrder, levelOrder, order })

// Student at N4 (order 2): N5 = 1, N4 = 2.
const materials = [
  m(1, 'kanji', 1),
  m(2, 'kanji', 2),
  m(3, 'grammar', 2),
  m(4, 'grammar', 1, 2),
  m(5, 'grammar', 1, 1),
]

describe('study progress (dashboard)', () => {
  it('rounds down, so 100 % only when everything is studied; nothing available = 0 %', () => {
    expect(percentOf(2, 3)).toBe(66)
    expect(percentOf(3, 3)).toBe(100)
    expect(percentOf(0, 0)).toBe(0)
  })

  it('counts only materials marked as studied, per category, among the visible ones', () => {
    const s = studySummary(
      materials,
      [
        { materialId: 1, lastOpenedAt: '2026-10-01T00:00:00Z', studiedAt: '2026-10-01T01:00:00Z' },
        { materialId: 3, lastOpenedAt: '2026-10-02T00:00:00Z', studiedAt: null }, // opened only
        { materialId: 99, lastOpenedAt: '2026-10-03T00:00:00Z', studiedAt: '2026-10-03T00:00:00Z' }, // hidden now
      ],
      2,
    )
    expect(s.total).toEqual({ available: 5, studied: 1, percent: 20 })
    expect(s.byCategory.kanji).toEqual({ available: 2, studied: 1, percent: 50 })
    expect(s.byCategory.grammar).toEqual({ available: 3, studied: 0, percent: 0 })
    expect(s.lastStudiedAt).toBe('2026-10-01T01:00:00Z') // the hidden material does not count
  })

  it('continue = the most recently opened material not yet studied', () => {
    const s = studySummary(
      materials,
      [
        { materialId: 4, lastOpenedAt: '2026-10-05T00:00:00Z', studiedAt: null },
        { materialId: 3, lastOpenedAt: '2026-10-06T00:00:00Z', studiedAt: null },
        { materialId: 2, lastOpenedAt: '2026-10-07T00:00:00Z', studiedAt: '2026-10-07T00:00:00Z' },
      ],
      2,
    )
    expect(s.continueId).toBe(3)
  })

  it('recommends unstudied materials: own level first, then lower; category order, then display order', () => {
    const s = studySummary(materials, [], 2, 5)
    expect(s.continueId).toBeNull()
    expect(s.recommendedIds).toEqual([2, 3, 1, 5, 4])
  })

  it('never recommends what is studied or already offered as "continue", and respects the limit', () => {
    const s = studySummary(
      materials,
      [
        { materialId: 2, lastOpenedAt: '2026-10-01T00:00:00Z', studiedAt: '2026-10-01T00:00:00Z' },
        { materialId: 3, lastOpenedAt: '2026-10-02T00:00:00Z', studiedAt: null },
      ],
      2,
    )
    expect(s.continueId).toBe(3)
    expect(s.recommendedIds).toEqual([1, 5, 4])
  })

  it('a new student sees zero progress and the default recommendations', () => {
    const s = studySummary(materials, [], 2)
    expect(s.total.studied).toBe(0)
    expect(s.lastStudiedAt).toBeNull()
    expect(s.recommendedIds).toHaveLength(3)
  })
})
