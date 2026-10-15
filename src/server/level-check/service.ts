import { randomUUID } from 'node:crypto'

import { sql } from '@payloadcms/db-postgres'
import { z } from 'zod'

import { deadlineFor, type LevelCheckSnapshot } from '@/domain/determination'

import {
  type AttemptRecord,
  finalizeAttempt,
  sqlRows as rows,
  type StoredOutcome,
} from '../attempts/service'
import { recordAudit } from '../audit/record'
import { payloadClient, requireStudent } from '../auth/session'
import { AppError } from '../http/errors'

/**
 * The level check (D-008..D-012, ARCHITECTURE §5.2): start at the first stage (N5), one attempt per
 * stage, sequential progression decided by the server after each submit.
 * Nothing here accepts a level, stage or result from the client.
 */
type SessionRow = {
  id: number
  status: 'in_progress' | 'completed' | 'reset'
  current_stage_index: number
  stage_outcomes: StoredOutcome[] | null
  config_version_id: number
  completed_at: Date | null
  snapshot: LevelCheckSnapshot
}

async function db() {
  return (await payloadClient()).db.drizzle
}

async function latestVersion(): Promise<{ id: number; snapshot: LevelCheckSnapshot } | null> {
  const [v] = await rows<{ id: number; snapshot: LevelCheckSnapshot }>(
    await db(),
    sql`SELECT id, snapshot FROM level_check_versions ORDER BY version_no DESC LIMIT 1`,
  )
  return v ?? null
}

/** The student's running or completed session (a reset one no longer counts). */
async function currentSession(studentId: number): Promise<SessionRow | null> {
  const [s] = await rows<SessionRow>(
    await db(),
    sql`SELECT s.id, s.status, s.current_stage_index::int AS current_stage_index, s.stage_outcomes,
          s.config_version_id, s.completed_at, v.snapshot
        FROM level_check_sessions s JOIN level_check_versions v ON v.id = s.config_version_id
        WHERE s.student_id = ${studentId} AND s.status IN ('in_progress', 'completed')
        ORDER BY s.id DESC LIMIT 1`,
  )
  return s ?? null
}

async function stageAttempt(sessionId: number, stageIndex: number) {
  const [a] = await rows<AttemptRecord>(
    await db(),
    sql`SELECT id, status, deadline_at, started_at FROM attempts
        WHERE determination_session_id = ${sessionId} AND stage_index = ${stageIndex} AND kind = 'determination'`,
  )
  return a ?? null
}

export type LevelCheckState = {
  /** Whether a published level check exists (otherwise Start is unavailable). */
  available: boolean
  status: 'not_started' | 'in_progress' | 'completed'
  stages: {
    levelCode: string
    levelName: { en: string; ja: string }
    durationMinutes: number
    questionCount: number
  }[]
  currentStageIndex: number | null
  currentAttempt: { id: number; status: 'in_progress' | 'submitted'; deadlineAt: string } | null
  outcomes: { levelCode: string; percent: number; passed: boolean }[]
  assignedLevelCode: string | null
  serverNow: string
}

const publicStages = (snapshot: LevelCheckSnapshot) =>
  snapshot.stages.map((s) => ({
    levelCode: s.levelCode,
    levelName: s.levelName,
    durationMinutes: s.durationMinutes,
    questionCount: s.questions.length,
  }))

/** GET /determination. A stage attempt past its deadline is finalized first (lazy expiry). */
export async function levelCheckState(headers: Headers): Promise<LevelCheckState> {
  return levelCheckStateFor(await requireStudent(headers))
}

/** The same, for a page that has already identified the student (see `studentPage`). */
export async function levelCheckStateFor(student: { id: number }): Promise<LevelCheckState> {
  let session = await currentSession(student.id)
  if (session?.status === 'in_progress') {
    const attempt = await stageAttempt(session.id, session.current_stage_index)
    if (
      attempt?.status === 'in_progress' &&
      new Date(attempt.deadline_at).getTime() + 3000 < Date.now()
    ) {
      await finalizeAttempt(attempt.id, 'timeout')
      session = await currentSession(student.id)
    }
  }
  const latest = await latestVersion()
  const snapshot = session?.snapshot ?? latest?.snapshot ?? { stages: [] }
  let currentAttempt: LevelCheckState['currentAttempt'] = null
  if (session?.status === 'in_progress') {
    const a = await stageAttempt(session.id, session.current_stage_index)
    if (a)
      currentAttempt = {
        id: a.id,
        status: a.status,
        deadlineAt: new Date(a.deadline_at).toISOString(),
      }
  }
  const assigned =
    session?.status === 'completed'
      ? snapshot.stages.find((_, i) => i === assignedStageIndexOf(session!))
      : undefined
  return {
    available: latest !== null,
    status: session && session.status !== 'reset' ? session.status : 'not_started',
    stages: publicStages(snapshot),
    currentStageIndex: session?.status === 'in_progress' ? session.current_stage_index : null,
    currentAttempt,
    outcomes: (session?.stage_outcomes ?? []).map((o) => ({
      levelCode: o.levelCode,
      percent: o.percent,
      passed: o.passed,
    })),
    assignedLevelCode: assigned?.levelCode ?? null,
    serverNow: new Date().toISOString(),
  }
}

/** Index of the assigned stage of a completed session (from its outcomes, D-008 rules). */
function assignedStageIndexOf(session: SessionRow): number {
  const outcomes = session.stage_outcomes ?? []
  const last = outcomes[outcomes.length - 1]
  if (!last) return 0
  return last.passed ? last.stageIndex : Math.max(0, last.stageIndex - 1)
}

/** Starting accepts no body fields at all: no level, no stage (LD-R03, PB §16.2 #4). */
export const startSchema = z.strictObject({})

/** POST /determination/start. Idempotent; always begins at the first stage (N5). */
export async function startLevelCheck(headers: Headers): Promise<LevelCheckState> {
  const student = await requireStudent(headers)
  if (student.determinationStatus === 'completed' && student.assignedLevel != null) {
    throw new AppError('ALREADY_FINALIZED', 'The level check is already complete.')
  }
  const existing = await currentSession(student.id)
  if (!existing) {
    const latest = await latestVersion()
    if (!latest) throw new AppError('NOT_FOUND', 'The level check is not available yet.')
    const drizzle = await db()
    // The partial unique index allows one running session per student, even under a race.
    const inserted = await rows<{ id: number }>(
      drizzle,
      sql`INSERT INTO level_check_sessions (student_id, config_version_id, status, current_stage_index, stage_outcomes)
          VALUES (${student.id}, ${latest.id}, 'in_progress', 0, '[]'::jsonb)
          ON CONFLICT (student_id) WHERE status = 'in_progress' DO NOTHING
          RETURNING id`,
    )
    await drizzle.execute(
      sql`UPDATE students SET determination_status = 'in_progress', updated_at = now()
          WHERE id = ${student.id} AND determination_status = 'not_started'`,
    )
    if (inserted[0]) {
      await recordAudit(await payloadClient(), {
        actorType: 'student',
        actorId: student.id,
        action: 'level_check.started',
        entityType: 'level-check-sessions',
        entityId: inserted[0].id,
      })
    }
  }
  return levelCheckState(headers)
}

/**
 * POST /determination/stages/current/attempt. Creates (or returns) the attempt for the session's
 * current stage. The stage comes from the server's session, never from the request.
 */
export async function currentStageAttempt(
  headers: Headers,
): Promise<{ attemptId: number; deadlineAt: string }> {
  const student = await requireStudent(headers)
  const session = await currentSession(student.id)
  if (!session || session.status !== 'in_progress') {
    throw new AppError('STAGE_OUT_OF_ORDER', 'There is no level-check stage to take now.')
  }
  const stage = session.snapshot.stages[session.current_stage_index]
  if (!stage) throw new AppError('STAGE_OUT_OF_ORDER')
  const startedAt = new Date()
  const deadline = deadlineFor(startedAt, stage.durationMinutes)
  const drizzle = await db()
  await drizzle.execute(
    sql`INSERT INTO attempts (student_id, kind, determination_session_id, stage_index, status,
          started_at, deadline_at, session_id, answers, last_seq)
        VALUES (${student.id}, 'determination', ${session.id}, ${session.current_stage_index},
          'in_progress', ${startedAt.toISOString()}, ${deadline.toISOString()}, ${randomUUID()}, '{}'::jsonb, 0)
        ON CONFLICT (determination_session_id, stage_index) WHERE kind = 'determination' DO NOTHING`,
  )
  const attempt = await stageAttempt(session.id, session.current_stage_index)
  if (!attempt) throw new AppError('INTERNAL')
  // The deadline is the original one if the attempt already existed (D-010: no pausing).
  return { attemptId: attempt.id, deadlineAt: new Date(attempt.deadline_at).toISOString() }
}

export type LevelCheckSummary = {
  assignedLevel: { code: string; name: { en: string; ja: string } }
  completedAt: string
  stages: {
    levelCode: string
    levelName: { en: string; ja: string }
    percent: number
    passed: boolean
  }[]
}

/** GET /determination/summary: the "Your level" screen (D-012). */
export async function levelCheckSummary(headers: Headers): Promise<LevelCheckSummary> {
  return levelCheckSummaryFor(await requireStudent(headers))
}

/** The same, for a page; null when there is no completed level check (e.g. a level override). */
export async function levelCheckSummaryOrNull(student: {
  id: number
}): Promise<LevelCheckSummary | null> {
  try {
    return await levelCheckSummaryFor(student)
  } catch {
    return null
  }
}

async function levelCheckSummaryFor(student: { id: number }): Promise<LevelCheckSummary> {
  const session = await currentSession(student.id)
  if (!session || session.status !== 'completed') throw new AppError('NOT_FOUND')
  const assignedIndex = assignedStageIndexOf(session)
  const assigned = session.snapshot.stages[assignedIndex]!
  return {
    assignedLevel: { code: assigned.levelCode, name: assigned.levelName },
    completedAt: new Date(session.completed_at ?? Date.now()).toISOString(),
    stages: (session.stage_outcomes ?? []).map((o) => ({
      levelCode: o.levelCode,
      levelName: session.snapshot.stages[o.stageIndex]?.levelName ?? {
        en: o.levelCode,
        ja: o.levelCode,
      },
      percent: o.percent,
      passed: o.passed,
    })),
  }
}
