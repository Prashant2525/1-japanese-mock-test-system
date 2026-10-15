/**
 * Level-check rules (D-008..D-011, LD-R03..R05). Pure: plain data in, plain data out
 * (docs/ARCHITECTURE.md §2). Services load and persist; every branch has a unit test.
 */

export type SnapshotOption = { key: string; text: string }

/** A question as frozen into a published level-check version (history never changes, TSR-05). */
export type SnapshotQuestion = {
  key: string
  stem: string
  options: SnapshotOption[]
  correct: string
  explanation: { en: string; ja: string }
  marks: number
}

export type SnapshotStage = {
  levelId: number
  levelCode: string
  levelName: { en: string; ja: string }
  thresholdPercent: number
  durationMinutes: number
  questions: SnapshotQuestion[]
}

export type LevelCheckSnapshot = { stages: SnapshotStage[] }

/** Saved answers: option key (or null) and the "mark for review" flag, per question key. */
export type Answers = Record<string, { o: string | null; f?: boolean }>

export type ScoredItem = {
  order: number
  questionKey: string
  selected: string | null
  correct: string
  isCorrect: boolean
  marks: number
  earned: number
  flagged: boolean
}

export type Score = {
  totalQuestions: number
  correct: number
  incorrect: number
  unanswered: number
  totalMarks: number
  earnedMarks: number
  /** For display only (2 decimals). Pass/fail never uses this rounded value. */
  percent: number
  items: ScoredItem[]
}

/** Scores a stage. Unanswered counts as wrong (D-009). Answers to unknown questions are ignored. */
export function scoreAnswers(questions: SnapshotQuestion[], answers: Answers): Score {
  const items = questions.map((q, i): ScoredItem => {
    const selected = answers[q.key]?.o ?? null
    const isCorrect = selected !== null && selected === q.correct
    return {
      order: i + 1,
      questionKey: q.key,
      selected,
      correct: q.correct,
      isCorrect,
      marks: q.marks,
      earned: isCorrect ? q.marks : 0,
      flagged: answers[q.key]?.f === true,
    }
  })
  const totalMarks = items.reduce((sum, it) => sum + it.marks, 0)
  const earnedMarks = items.reduce((sum, it) => sum + it.earned, 0)
  const unanswered = items.filter((it) => it.selected === null).length
  const correct = items.filter((it) => it.isCorrect).length
  return {
    totalQuestions: items.length,
    correct,
    incorrect: items.length - correct - unanswered,
    unanswered,
    totalMarks,
    earnedMarks,
    percent: totalMarks === 0 ? 0 : Math.round((earnedMarks / totalMarks) * 10000) / 100,
    items,
  }
}

/**
 * Pass if the score is at least the threshold, compared exactly with no rounding (D-009):
 * earned / total ≥ threshold / 100, computed in integers (thresholds have up to 2 decimals).
 */
export function stagePassed(
  score: Pick<Score, 'earnedMarks' | 'totalMarks'>,
  thresholdPercent: number,
): boolean {
  if (score.totalMarks <= 0) return false
  const thresholdBasisPoints = Math.round(thresholdPercent * 100)
  return score.earnedMarks * 10000 >= thresholdBasisPoints * score.totalMarks
}

export type StageOutcome = { stageIndex: number; passed: boolean }

export type NextStep =
  | { kind: 'next'; stageIndex: number }
  | {
      kind: 'done'
      /** Index of the stage whose level is assigned. */
      assignedStageIndex: number
      reason: 'failed_first_stage' | 'failed_stage' | 'passed_all'
    }

export class DeterminationRuleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DeterminationRuleError'
  }
}

/**
 * What happens after a stage (D-008, LD-R04, LD-R05). Outcomes must be the stages in order from the
 * first (N5) with no gaps; a level can never be chosen or skipped.
 * - passed and another stage exists → that next stage
 * - passed the last stage → that level
 * - failed a later stage → the level of the stage before it (the highest passed)
 * - failed the first stage → the first stage's level (N5, "Beginner")
 */
export function nextStep(stageCount: number, outcomes: StageOutcome[]): NextStep {
  if (stageCount < 1) throw new DeterminationRuleError('the level check has no stages')
  if (outcomes.length === 0) throw new DeterminationRuleError('no stage has been completed')
  outcomes.forEach((o, i) => {
    if (o.stageIndex !== i) throw new DeterminationRuleError('stages must be completed in order')
    if (i < outcomes.length - 1 && !o.passed)
      throw new DeterminationRuleError('the level check stops at the first failed stage')
  })
  const last = outcomes[outcomes.length - 1]!
  if (last.stageIndex >= stageCount) throw new DeterminationRuleError('no such stage')
  if (!last.passed) {
    return last.stageIndex === 0
      ? { kind: 'done', assignedStageIndex: 0, reason: 'failed_first_stage' }
      : { kind: 'done', assignedStageIndex: last.stageIndex - 1, reason: 'failed_stage' }
  }
  return last.stageIndex + 1 < stageCount
    ? { kind: 'next', stageIndex: last.stageIndex + 1 }
    : { kind: 'done', assignedStageIndex: last.stageIndex, reason: 'passed_all' }
}

/** Technical default (ARCHITECTURE §5.1): answers are accepted until 3 s after the deadline. */
export const ANSWER_GRACE_MS = 3000

export function deadlineFor(startedAt: Date, durationMinutes: number): Date {
  return new Date(startedAt.getTime() + durationMinutes * 60_000)
}

/** True while answers may still be saved (deadline + grace). */
export function acceptsAnswers(now: Date, deadline: Date, graceMs = ANSWER_GRACE_MS): boolean {
  return now.getTime() <= deadline.getTime() + graceMs
}
