import { describe, expect, it } from 'vitest'

import { studyLevelIds, type StudyLevel } from '@/domain/study'

const jlpt = (id: number, order: number, enabledForStudy: boolean): StudyLevel => ({
  id,
  examCode: 'JLPT',
  order,
  enabledForStudy,
})
// N5..N1 = ids 1..5; launch: study on for N5–N3.
const LEVELS = [
  jlpt(1, 1, true),
  jlpt(2, 2, true),
  jlpt(3, 3, true),
  jlpt(4, 4, false),
  jlpt(5, 5, false),
]
const at = (order: number) => ({ examCode: 'JLPT', order })

describe('study eligibility: current and lower levels, only levels open for study', () => {
  it.each([
    ['N5', 1, [1]],
    ['N4', 2, [1, 2]],
    ['N3', 3, [1, 2, 3]],
    ['N2 (override): nothing above N3 at launch', 4, [1, 2, 3]],
    ['N1 (override)', 5, [1, 2, 3]],
  ])('%s', (_label, order, expected) => {
    expect(studyLevelIds(at(order), LEVELS)).toEqual(expected)
  })

  it('opens N2 materials only when N2 is switched on for study and the student is N2 or above', () => {
    const later = LEVELS.map((l) => (l.id === 4 ? { ...l, enabledForStudy: true } : l))
    expect(studyLevelIds(at(4), later)).toEqual([1, 2, 3, 4])
    expect(studyLevelIds(at(3), later)).toEqual([1, 2, 3])
  })

  it('a switched-off lower level stays hidden', () => {
    const noN4 = LEVELS.map((l) => (l.id === 2 ? { ...l, enabledForStudy: false } : l))
    expect(studyLevelIds(at(3), noN4)).toEqual([1, 3])
  })

  it('no level, or a non-JLPT level, sees nothing; other exam types never count', () => {
    expect(studyLevelIds(null, LEVELS)).toEqual([])
    expect(studyLevelIds({ examCode: 'NAT', order: 5 }, LEVELS)).toEqual([])
    expect(
      studyLevelIds(at(5), [
        ...LEVELS,
        { id: 9, examCode: 'NAT', order: 1, enabledForStudy: true },
      ]),
    ).toEqual([1, 2, 3])
  })
})
