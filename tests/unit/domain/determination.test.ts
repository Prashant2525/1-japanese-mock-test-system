import { describe, expect, it } from 'vitest'

import {
  acceptsAnswers,
  deadlineFor,
  DeterminationRuleError,
  nextStep,
  scoreAnswers,
  stagePassed,
  type SnapshotQuestion,
} from '@/domain/determination'

const q = (key: string, correct: string, marks = 1): SnapshotQuestion => ({
  key,
  stem: key,
  options: ['A', 'B', 'C', 'D'].map((k) => ({ key: k, text: k })),
  correct,
  explanation: { en: '', ja: '' },
  marks,
})

describe('scoreAnswers (D-009)', () => {
  const questions = [q('Q1', 'A'), q('Q2', 'B'), q('Q3', 'C', 2)]

  it('counts correct, incorrect and unanswered; unanswered is wrong', () => {
    const s = scoreAnswers(questions, { Q1: { o: 'A' }, Q2: { o: 'C', f: true } })
    expect(s).toMatchObject({
      totalQuestions: 3,
      correct: 1,
      incorrect: 1,
      unanswered: 1,
      totalMarks: 4,
      earnedMarks: 1,
      percent: 25,
    })
    expect(s.items.map((i) => [i.questionKey, i.selected, i.isCorrect, i.flagged])).toEqual([
      ['Q1', 'A', true, false],
      ['Q2', 'C', false, true],
      ['Q3', null, false, false],
    ])
  })

  it('weights by marks and ignores answers to questions not in the stage', () => {
    const s = scoreAnswers(questions, { Q3: { o: 'C' }, NOPE: { o: 'A' } })
    expect([s.earnedMarks, s.totalMarks, s.percent]).toEqual([2, 4, 50])
  })

  it('treats an explicit null as unanswered', () => {
    expect(scoreAnswers(questions, { Q1: { o: null } }).unanswered).toBe(3)
  })

  it('shows 2-decimal percentages for display', () => {
    expect(scoreAnswers([q('a', 'A'), q('b', 'A'), q('c', 'A')], { a: { o: 'A' } }).percent).toBe(
      33.33,
    )
  })
})

describe('stagePassed: exact comparison, no rounding (D-009, LD-R04 boundaries)', () => {
  it.each([
    [59, 100, 60, false], // just below
    [60, 100, 60, true], // exactly the threshold
    [61, 100, 60, true], // above
    [2, 3, 66.67, false], // 66.666…% is below 66.67% (rounding would wrongly pass)
    [2, 3, 66.66, true],
    [1, 1, 100, true],
    [0, 5, 0, true],
  ])('%i/%i at %d%% → %s', (earned, total, threshold, expected) => {
    expect(stagePassed({ earnedMarks: earned, totalMarks: total }, threshold)).toBe(expected)
  })

  it('never passes a stage without marks', () => {
    expect(stagePassed({ earnedMarks: 0, totalMarks: 0 }, 0)).toBe(false)
  })
})

describe('nextStep (LD-R04, LD-R05; stages N5 → N4 → N3)', () => {
  const P = (i: number) => ({ stageIndex: i, passed: true })
  const F = (i: number) => ({ stageIndex: i, passed: false })

  it('fail N5 → N5 (Beginner)', () => {
    expect(nextStep(3, [F(0)])).toEqual({
      kind: 'done',
      assignedStageIndex: 0,
      reason: 'failed_first_stage',
    })
  })
  it('pass N5 → start N4', () => {
    expect(nextStep(3, [P(0)])).toEqual({ kind: 'next', stageIndex: 1 })
  })
  it('pass N5, fail N4 → N5', () => {
    expect(nextStep(3, [P(0), F(1)])).toEqual({
      kind: 'done',
      assignedStageIndex: 0,
      reason: 'failed_stage',
    })
  })
  it('pass N5 and N4, fail N3 → N4', () => {
    expect(nextStep(3, [P(0), P(1), F(2)])).toMatchObject({ kind: 'done', assignedStageIndex: 1 })
  })
  it('pass all three → N3 (the highest enabled stage)', () => {
    expect(nextStep(3, [P(0), P(1), P(2)])).toEqual({
      kind: 'done',
      assignedStageIndex: 2,
      reason: 'passed_all',
    })
  })
  it('works with more stages enabled later (N2, N1; LD-R12)', () => {
    expect(nextStep(5, [P(0), P(1), P(2)])).toEqual({ kind: 'next', stageIndex: 3 })
    expect(nextStep(1, [P(0)])).toMatchObject({ kind: 'done', assignedStageIndex: 0 })
  })

  it.each([
    ['skipping a stage', [P(0), P(2)]],
    ['starting above N5', [P(1)]],
    ['continuing after a failure', [F(0), P(1)]],
    ['a stage that does not exist', [P(0), P(1), P(2), P(3)]],
    ['nothing done yet', []],
  ])('refuses %s', (_label, outcomes) => {
    expect(() => nextStep(3, outcomes)).toThrow(DeterminationRuleError)
  })
})

describe('deadlines (D-010)', () => {
  const start = new Date('2026-10-15T10:00:00Z')
  const deadline = deadlineFor(start, 20)

  it('is the start plus the stage duration', () => {
    expect(deadline.toISOString()).toBe('2026-10-15T10:20:00.000Z')
  })

  it('accepts answers until the deadline plus a 3 s grace', () => {
    expect(acceptsAnswers(new Date('2026-10-15T10:20:00Z'), deadline)).toBe(true)
    expect(acceptsAnswers(new Date('2026-10-15T10:20:03Z'), deadline)).toBe(true)
    expect(acceptsAnswers(new Date('2026-10-15T10:20:03.001Z'), deadline)).toBe(false)
  })
})
