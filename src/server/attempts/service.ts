import { randomUUID } from 'node:crypto'

import { sql } from '@payloadcms/db-postgres'
import { z } from 'zod'

import {
  acceptsAnswers,
  ANSWER_GRACE_MS,
  type Answers,
  type LevelCheckSnapshot,
  nextStep,
  scoreAnswers,
  type SnapshotStage,
  stagePassed,
} from '@/domain/determination'

import { recordAudit } from '../audit/record'
import { payloadClient, requireStudent, type SessionStudent } from '../auth/session'
import { AppError } from '../http/errors'
import { requireDeterminedLevel } from '../student/gate'

/**
 * Attempts (ARCHITECTURE §5.1): reading a running attempt, saving answers, submitting, and the
 * single finalize path used by manual submits and by deadline expiry. Hot paths are plain SQL so
 * each step is one atomic statement or one locked transaction (no double results, no lost saves).
 */
export const SCORING_VERSION = 'determination-v1'

type Db = Awaited<ReturnType<typeof payloadClient>>['db']['drizzle']
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]
type Runner = Db | Tx

export type AttemptRow = {
  id: number
  student_id: number
  kind: 'determination' | 'mock'
  determination_session_id: number | null
  stage_index: number | null
  status: 'in_progress' | 'submitted'
  started_at: Date
  deadline_at: Date
  submitted_at: Date | null
  submit_reason: 'manual' | 'timeout' | null
  session_id: string | null
  answers: Answers | null
  last_seq: number
}

const ATTEMPT_COLUMNS = sql`id, student_id, kind, determination_session_id, stage_index::int AS stage_index,
  status, started_at, deadline_at, submitted_at, submit_reason, session_id, answers, last_seq::float8 AS last_seq`

async function rows<T>(db: Runner, query: ReturnType<typeof sql>): Promise<T[]> {
  const result = await db.execute(query)
  return result.rows as T[]
}

async function drizzle(): Promise<Db> {
  return (await payloadClient()).db.drizzle
}

/** The stage of a level-check attempt, from the version its session started with. */
export async function stageOf(db: Runner, attempt: AttemptRow) {
  const [session] = await rows<{
    id: number
    status: 'in_progress' | 'completed' | 'reset'
    current_stage_index: number
    stage_outcomes: StoredOutcome[] | null
    snapshot: LevelCheckSnapshot
  }>(
    db,
    sql`SELECT s.id, s.status, s.current_stage_index::int AS current_stage_index, s.stage_outcomes, v.snapshot
        FROM level_check_sessions s JOIN level_check_versions v ON v.id = s.config_version_id
        WHERE s.id = ${attempt.determination_session_id}`,
  )
  if (!session) throw new AppError('NOT_FOUND')
  const stage = session.snapshot.stages[attempt.stage_index ?? -1]
  if (!stage) throw new AppError('NOT_FOUND')
  return { session, stage }
}

export type StoredOutcome = {
  stageIndex: number
  levelId: number
  levelCode: string
  attemptId: number
  resultId: number
  percent: number
  passed: boolean
}

/** Own attempt or 404 (another student's attempt is indistinguishable from a missing one). */
async function ownAttempt(db: Runner, student: SessionStudent, id: number): Promise<AttemptRow> {
  const [row] = await rows<AttemptRow>(
    db,
    sql`SELECT ${ATTEMPT_COLUMNS} FROM attempts WHERE id = ${id} AND student_id = ${student.id}`,
  )
  if (!row) throw new AppError('NOT_FOUND')
  if (row.kind === 'mock') requireDeterminedLevel(student)
  return row
}

const expired = (row: AttemptRow, now = new Date()) =>
  row.status === 'in_progress' && !acceptsAnswers(now, new Date(row.deadline_at))

export type AttemptView = {
  id: number
  kind: 'determination' | 'mock'
  status: 'in_progress' | 'submitted'
  stageIndex: number | null
  levelCode: string
  levelName: { en: string; ja: string }
  startedAt: string
  deadlineAt: string
  serverNow: string
  submitReason: 'manual' | 'timeout' | null
  /** Questions WITHOUT correct answers or explanations (never exposed during an attempt). */
  questions: { key: string; stem: string; options: { key: string; text: string }[] }[]
  answers: Answers
}

function view(row: AttemptRow, stage: SnapshotStage): AttemptView {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    stageIndex: row.stage_index,
    levelCode: stage.levelCode,
    levelName: stage.levelName,
    startedAt: new Date(row.started_at).toISOString(),
    deadlineAt: new Date(row.deadline_at).toISOString(),
    serverNow: new Date().toISOString(),
    submitReason: row.submit_reason,
    questions: stage.questions.map((q) => ({
      key: q.key,
      stem: q.stem,
      options: q.options.map((o) => ({ key: o.key, text: o.text })),
    })),
    answers: row.answers ?? {},
  }
}

/** GET /attempts/{id}. An attempt past its deadline is finalized first (lazy expiry). */
export async function getAttempt(headers: Headers, id: number): Promise<AttemptView> {
  const student = await requireStudent(headers)
  const db = await drizzle()
  let row = await ownAttempt(db, student, id)
  if (expired(row)) {
    await finalizeAttempt(row.id, 'timeout')
    row = await ownAttempt(db, student, id)
  }
  const { stage } = await stageOf(db, row)
  return view(row, stage)
}

/**
 * POST /attempts/{id}/resume: the opening tab takes over (D-027, latest tab wins). Older tabs'
 * saves then get 409 STALE_SESSION.
 */
export async function resumeAttempt(headers: Headers, id: number): Promise<{ sessionId: string }> {
  const student = await requireStudent(headers)
  const db = await drizzle()
  const row = await ownAttempt(db, student, id)
  if (expired(row)) await finalizeAttempt(row.id, 'timeout')
  const sessionId = randomUUID()
  const updated = await rows<{ id: number }>(
    db,
    sql`UPDATE attempts SET session_id = ${sessionId}, updated_at = now()
        WHERE id = ${id} AND student_id = ${student.id} AND status = 'in_progress' RETURNING id`,
  )
  if (!updated.length) throw new AppError('ATTEMPT_CLOSED')
  return { sessionId }
}

export const saveAnswerSchema = z.strictObject({
  optionKey: z.string().min(1).max(4).nullable(),
  flagged: z.boolean().default(false),
  seq: z.number().int().positive(),
  sessionId: z.uuid(),
})

/**
 * PUT /attempts/{id}/answers/{questionKey}. One atomic UPDATE that only succeeds for the current
 * tab, while the attempt is open (deadline + grace), and for a newer save than the last one.
 */
export async function saveAnswer(
  headers: Headers,
  id: number,
  questionKey: string,
  input: z.infer<typeof saveAnswerSchema>,
): Promise<{ saved: boolean }> {
  const student = await requireStudent(headers)
  const db = await drizzle()
  const row = await ownAttempt(db, student, id)
  const { stage } = await stageOf(db, row)
  const question = stage.questions.find((q) => q.key === questionKey)
  if (!question) throw new AppError('NOT_FOUND', 'No such question in this attempt.')
  if (input.optionKey !== null && !question.options.some((o) => o.key === input.optionKey)) {
    throw new AppError('VALIDATION_FAILED', undefined, [
      { path: 'optionKey', message: 'Not an option of this question.' },
    ])
  }
  const value = JSON.stringify({
    o: input.optionKey,
    f: input.flagged,
    t: new Date().toISOString(),
  })
  const graceSeconds = ANSWER_GRACE_MS / 1000
  const updated = await rows<{ id: number }>(
    db,
    sql`UPDATE attempts
        SET answers = jsonb_set(coalesce(answers, '{}'::jsonb), ARRAY[${questionKey}], ${value}::jsonb, true),
            last_seq = ${input.seq}, updated_at = now()
        WHERE id = ${id} AND student_id = ${student.id} AND status = 'in_progress'
          AND session_id = ${input.sessionId} AND coalesce(last_seq, 0) < ${input.seq}
          AND now() <= deadline_at + make_interval(secs => ${graceSeconds})
        RETURNING id`,
  )
  if (updated.length) return { saved: true }
  const current = await ownAttempt(db, student, id)
  if (current.status !== 'in_progress' || expired(current)) {
    if (expired(current)) await finalizeAttempt(id, 'timeout')
    throw new AppError('ATTEMPT_CLOSED')
  }
  if (current.session_id !== input.sessionId) throw new AppError('STALE_SESSION')
  return { saved: false } // an older save arriving late; the newer one already counts
}

export type SubmitResult = {
  resultId: number
  percent: number
  passed: boolean
  /** What happens next in the level check. */
  next: { kind: 'next'; stageIndex: number } | { kind: 'done'; levelCode: string } | null
}

/** POST /attempts/{id}/submit. Idempotent: submitting again returns the same result. */
export async function submitAttempt(headers: Headers, id: number): Promise<SubmitResult> {
  const student = await requireStudent(headers)
  const db = await drizzle()
  const row = await ownAttempt(db, student, id)
  return finalizeAttempt(row.id, expired(row) ? 'timeout' : 'manual')
}

/**
 * The one way an attempt ends (manual submit or deadline). Locks the attempt, scores it from the
 * frozen snapshot, writes the result and its items, and advances or completes the level check, all
 * in one transaction. A second call (double click, two tabs, timeout racing a submit) waits for the
 * lock, sees the attempt is already final and returns the same result.
 */
export async function finalizeAttempt(
  attemptId: number,
  reason: 'manual' | 'timeout',
): Promise<SubmitResult> {
  const payload = await payloadClient()
  const outcome = await payload.db.drizzle.transaction(async (tx) => {
    const [row] = await rows<AttemptRow>(
      tx,
      sql`SELECT ${ATTEMPT_COLUMNS} FROM attempts WHERE id = ${attemptId} FOR UPDATE`,
    )
    if (!row) throw new AppError('NOT_FOUND')
    const existing = await rows<{ id: number; percent: string; passed: boolean }>(
      tx,
      sql`SELECT id, percent, passed FROM results WHERE attempt_id = ${attemptId}`,
    )
    if (existing[0]) {
      return {
        audit: null,
        result: {
          resultId: existing[0].id,
          percent: Number(existing[0].percent),
          passed: existing[0].passed,
          next: await nextOf(tx, row),
        },
      }
    }

    // Lock the session before reading it, so progress is decided on its latest state.
    await tx.execute(
      sql`SELECT id FROM level_check_sessions WHERE id = ${row.determination_session_id} FOR UPDATE`,
    )
    const { session, stage } = await stageOf(tx, row)
    const score = scoreAnswers(stage.questions, row.answers ?? {})
    const passed = stagePassed(score, stage.thresholdPercent)

    await tx.execute(
      sql`UPDATE attempts SET status = 'submitted', submitted_at = now(), submit_reason = ${reason},
          updated_at = now() WHERE id = ${attemptId}`,
    )
    const [result] = await rows<{ id: number }>(
      tx,
      sql`INSERT INTO results (attempt_id, student_id, kind, exam_code, level_code, title_snapshot,
            total_questions, correct, incorrect, unanswered, total_marks, earned_marks, percent, passed,
            threshold_percent, scoring_version)
          VALUES (${attemptId}, ${row.student_id}, ${row.kind}, 'JLPT', ${stage.levelCode},
            ${JSON.stringify(stage.levelName)}::jsonb, ${score.totalQuestions}, ${score.correct},
            ${score.incorrect}, ${score.unanswered}, ${score.totalMarks}, ${score.earnedMarks},
            ${score.percent}, ${passed}, ${stage.thresholdPercent}, ${SCORING_VERSION})
          RETURNING id`,
    )
    const resultId = result!.id
    for (const item of score.items) {
      await tx.execute(
        sql`INSERT INTO result_items (result_id, "order", question_key, selected_option_key,
              correct_option_key, is_correct, marks, earned, flagged)
            VALUES (${resultId}, ${item.order}, ${item.questionKey}, ${item.selected},
              ${item.correct}, ${item.isCorrect}, ${item.marks}, ${item.earned}, ${item.flagged})`,
      )
    }

    // Progress the level check only for the session's current stage of a running session.
    let next: SubmitResult['next'] = null
    let completedLevel: { id: number; code: string } | null = null
    if (session.status === 'in_progress' && row.stage_index === session.current_stage_index) {
      const outcomes: StoredOutcome[] = [
        ...(session.stage_outcomes ?? []),
        {
          stageIndex: row.stage_index,
          levelId: stage.levelId,
          levelCode: stage.levelCode,
          attemptId,
          resultId,
          percent: score.percent,
          passed,
        },
      ]
      const step = nextStep(session.snapshot.stages.length, outcomes)
      if (step.kind === 'next') {
        await tx.execute(
          sql`UPDATE level_check_sessions SET stage_outcomes = ${JSON.stringify(outcomes)}::jsonb,
                current_stage_index = ${step.stageIndex}, updated_at = now() WHERE id = ${session.id}`,
        )
        next = { kind: 'next', stageIndex: step.stageIndex }
      } else {
        const assigned = session.snapshot.stages[step.assignedStageIndex]!
        await tx.execute(
          sql`UPDATE level_check_sessions SET stage_outcomes = ${JSON.stringify(outcomes)}::jsonb,
                status = 'completed', assigned_level_id = ${assigned.levelId}, completed_at = now(),
                updated_at = now() WHERE id = ${session.id}`,
        )
        await tx.execute(
          sql`UPDATE students SET determination_status = 'completed', assigned_level_id = ${assigned.levelId},
                assigned_at = now(), updated_at = now() WHERE id = ${row.student_id}`,
        )
        await tx.execute(
          sql`INSERT INTO level_assignments (student_id, level_id, source, session_id)
              VALUES (${row.student_id}, ${assigned.levelId}, 'determination', ${session.id})`,
        )
        next = { kind: 'done', levelCode: assigned.levelCode }
        completedLevel = { id: assigned.levelId, code: assigned.levelCode }
      }
    }
    return {
      audit: { row, stage, score, passed, resultId, completedLevel, sessionId: session.id },
      result: { resultId, percent: score.percent, passed, next },
    }
  })

  if (outcome.audit) {
    const { row, stage, score, passed, resultId, completedLevel, sessionId } = outcome.audit
    await recordAudit(payload, {
      actorType: reason === 'timeout' ? 'system' : 'student',
      actorId: reason === 'timeout' ? undefined : row.student_id,
      action: 'attempt.submitted',
      entityType: 'attempts',
      entityId: row.id,
      summary: `${stage.levelCode} ${score.earnedMarks}/${score.totalMarks} (${score.percent}%) ${passed ? 'passed' : 'not passed'}; ${reason}; result ${resultId}`,
    })
    if (completedLevel) {
      await recordAudit(payload, {
        actorType: 'system',
        action: 'level_check.completed',
        entityType: 'students',
        entityId: row.student_id,
        summary: `assigned ${completedLevel.code} (session ${sessionId})`,
        after: { assignedLevel: completedLevel.code },
      })
    }
  }
  return outcome.result
}

/** For an already-final attempt: what the level check did after it. */
async function nextOf(db: Runner, row: AttemptRow): Promise<SubmitResult['next']> {
  if (row.kind !== 'determination' || row.determination_session_id === null) return null
  const { session } = await stageOf(db, row)
  if (session.status === 'completed') {
    const last = session.stage_outcomes?.[session.stage_outcomes.length - 1]
    const [assigned] = await rows<{ code: string }>(
      db,
      sql`SELECT l.code FROM level_check_sessions s JOIN levels l ON l.id = s.assigned_level_id WHERE s.id = ${session.id}`,
    )
    return assigned && last ? { kind: 'done', levelCode: assigned.code } : null
  }
  if (session.status === 'in_progress' && session.current_stage_index > (row.stage_index ?? 0)) {
    return { kind: 'next', stageIndex: session.current_stage_index }
  }
  return null
}

export { rows as sqlRows, type AttemptRow as AttemptRecord }
