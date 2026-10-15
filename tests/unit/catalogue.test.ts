import { describe, expect, it } from 'vitest'

import { changedFields } from '@/payload/hooks/auditTrail'
import { colourProblem, ladderProblem, type LadderLevel } from '@/server/catalogue/rules'
import { SEED_EXAM_TYPES, SEED_LEVELS } from '@/server/catalogue/seed'

const level = (code: string, order: number, enabled: boolean): LadderLevel => ({
  id: code,
  code,
  order,
  enabled,
})

describe('level-check ladder (D-008: starts at N5, no gaps)', () => {
  it.each([
    ['N5 only', [true, false, false, false, false]],
    ['N5 → N4 → N3 (launch)', [true, true, true, false, false]],
    ['all five', [true, true, true, true, true]],
  ])('accepts %s', (_label, flags) => {
    const levels = ['N5', 'N4', 'N3', 'N2', 'N1'].map((c, i) => level(c, i + 1, flags[i]!))
    expect(ladderProblem(levels)).toBeNull()
  })

  it('requires the easiest level', () => {
    const levels = [level('N5', 1, false), level('N4', 2, true)]
    expect(ladderProblem(levels)).toEqual({ reason: 'first_level_required', level: 'N5' })
  })

  it('rejects a gap and names the missing level', () => {
    const levels = [level('N5', 1, true), level('N4', 2, false), level('N3', 3, true)]
    expect(ladderProblem(levels)).toEqual({ reason: 'gap', level: 'N3', missing: 'N4' })
  })

  it('uses the configured order, not the input order', () => {
    const levels = [level('N3', 3, true), level('N5', 1, true), level('N4', 2, true)]
    expect(ladderProblem(levels)).toBeNull()
  })

  it('accepts an empty catalogue', () => {
    expect(ladderProblem([])).toBeNull()
  })
})

describe('level colours', () => {
  it('accepts the design-system colours', () => {
    expect(colourProblem('line', '#2B6BD8')).toBeNull()
    expect(colourProblem('badge', '#1F56B8')).toBeNull()
  })

  it('rejects malformed values', () => {
    expect(colourProblem('line', 'blue')).toEqual({ reason: 'format' })
    expect(colourProblem('line', '#12345')).toEqual({ reason: 'format' })
    expect(colourProblem('badge', undefined)).toEqual({ reason: 'format' })
  })

  it('rejects a badge white text cannot be read on, and a line invisible on night', () => {
    expect(colourProblem('badge', '#FFD166')).toMatchObject({ reason: 'contrast', minimum: 4.5 })
    expect(colourProblem('line', '#16294A')).toMatchObject({ reason: 'contrast', minimum: 3 })
  })
})

describe('audit diff', () => {
  it('lists only the fields that changed', () => {
    expect(
      changedFields(
        { name: 'N5', order: 1, updatedAt: 'a', enabledForStudy: true },
        { name: 'N5 Basic', order: 1, updatedAt: 'b', enabledForStudy: true },
      ),
    ).toEqual({ before: { name: 'N5' }, after: { name: 'N5 Basic' } })
  })

  it('compares relationships by ID whether populated or not', () => {
    expect(changedFields({ examType: { id: 1, code: 'JLPT' } }, { examType: 1 })).toEqual({
      before: {},
      after: {},
    })
    expect(changedFields({ examType: 1 }, { examType: { id: 2 } })).toEqual({
      before: { examType: 1 },
      after: { examType: 2 },
    })
  })

  it('treats a new document as all fields added', () => {
    expect(changedFields(undefined, { code: 'N5', id: 3 })).toEqual({
      before: { code: null },
      after: { code: 'N5' },
    })
  })
})

describe('seed catalogue (D-014)', () => {
  it('has JLPT N5–N1, NAT 5Q–1Q mapped to JLPT, and JFT tiers', () => {
    const codes = (exam: string) =>
      SEED_LEVELS.filter((l) => l.examType === exam).map((l) => l.code)
    expect(SEED_EXAM_TYPES.map((t) => t.code)).toEqual(['JLPT', 'NAT', 'JFT'])
    expect(codes('JLPT')).toEqual(['N5', 'N4', 'N3', 'N2', 'N1'])
    expect(codes('NAT')).toEqual(['5Q', '4Q', '3Q', '2Q', '1Q'])
    expect(codes('JFT')).toEqual(['A1', 'A2.1', 'A2.2', 'A2'])
    expect(SEED_LEVELS.filter((l) => l.examType === 'NAT').map((l) => l.equivalentJlpt)).toEqual([
      'N5',
      'N4',
      'N3',
      'N2',
      'N1',
    ])
  })

  it('enables the level check and study library for N5–N3 only, mock tests everywhere', () => {
    const on = (flag: 'enabledForDetermination' | 'enabledForStudy') =>
      SEED_LEVELS.filter((l) => l[flag]).map((l) => l.code)
    expect(on('enabledForDetermination')).toEqual(['N5', 'N4', 'N3'])
    expect(on('enabledForStudy')).toEqual(['N5', 'N4', 'N3'])
    expect(SEED_LEVELS.every((l) => l.enabledForMockTests)).toBe(true)
  })

  it('passes the same colour and ladder rules the admin panel enforces', () => {
    for (const l of SEED_LEVELS) {
      expect(colourProblem('line', l.lineColor), `${l.code} line`).toBeNull()
      expect(colourProblem('badge', l.badgeColor), `${l.code} badge`).toBeNull()
    }
    const jlpt = SEED_LEVELS.filter((l) => l.examType === 'JLPT').map((l) =>
      level(l.code, l.order, l.enabledForDetermination),
    )
    expect(ladderProblem(jlpt)).toBeNull()
  })

  it('has English and Japanese text for every name', () => {
    for (const item of [...SEED_EXAM_TYPES, ...SEED_LEVELS]) {
      expect(item.name.en.trim()).not.toBe('')
      expect(item.name.ja.trim()).not.toBe('')
    }
  })
})
