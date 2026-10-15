import { sql } from '@payloadcms/db-postgres'
import type { PayloadHandler, PayloadRequest } from 'payload'
import { z } from 'zod'

import { finalizeAttempt, sqlRows as rows } from '../attempts/service'
import { recordAudit } from '../audit/record'
import { can, type Permission } from '../auth/permissions'
import { JLPT_CODE } from '../catalogue/rules'
import { AppError, toErrorBody } from '../http/errors'

/**
 * Admin actions on a student's level (D-013, LD-R11), exposed as Payload endpoints on the students
 * collection: /api/cms/students/:id/level-check/reset and /api/cms/students/:id/level/override.
 * Each needs its permission, a written reason, and writes an audit event and a level assignment.
 */
const resetSchema = z.strictObject({ reason: z.string().trim().min(5).max(1000) })
const overrideSchema = z.strictObject({
  levelId: z.number().int().positive(),
  reason: z.string().trim().min(5).max(1000),
})

type Snapshot = { determinationStatus: string; assignedLevel: string | null }

async function stateOf(req: PayloadRequest, studentId: number): Promise<Snapshot> {
  const [s] = await rows<{ determination_status: string; code: string | null }>(
    req.payload.db.drizzle,
    sql`SELECT s.determination_status, l.code FROM students s LEFT JOIN levels l ON l.id = s.assigned_level_id
        WHERE s.id = ${studentId}`,
  )
  if (!s) throw new AppError('NOT_FOUND')
  return { determinationStatus: s.determination_status, assignedLevel: s.code }
}

/** Ends any running or completed session (status "reset") and closes its open attempts. */
async function closeSessions(req: PayloadRequest, studentId: number, reason: string) {
  const sessions = await rows<{ id: number }>(
    req.payload.db.drizzle,
    sql`UPDATE level_check_sessions SET status = 'reset', reset_at = now(), reset_by_id = ${req.user!.id},
          reset_reason = ${reason}, updated_at = now()
        WHERE student_id = ${studentId} AND status IN ('in_progress', 'completed') RETURNING id`,
  )
  for (const s of sessions) {
    const open = await rows<{ id: number }>(
      req.payload.db.drizzle,
      sql`SELECT id FROM attempts WHERE determination_session_id = ${s.id} AND status = 'in_progress'`,
    )
    // Scored and kept for the record; a reset session never progresses.
    for (const a of open) await finalizeAttempt(a.id, 'timeout')
  }
}

export async function resetLevelCheck(req: PayloadRequest, studentId: number, reason: string) {
  const before = await stateOf(req, studentId)
  await closeSessions(req, studentId, reason)
  await req.payload.db.drizzle.execute(
    sql`UPDATE students SET determination_status = 'not_started', assigned_level_id = NULL,
          assigned_at = NULL, updated_at = now() WHERE id = ${studentId}`,
  )
  await req.payload.db.drizzle.execute(
    sql`INSERT INTO level_assignments (student_id, level_id, source, reason, actor_id)
        VALUES (${studentId}, NULL, 'reset', ${reason}, ${req.user!.id})`,
  )
  await recordAudit(req.payload, {
    actorType: 'admin',
    actorId: req.user!.id,
    action: 'level_check.reset',
    entityType: 'students',
    entityId: studentId,
    summary: reason,
    before,
    after: await stateOf(req, studentId),
  })
}

export async function overrideLevel(
  req: PayloadRequest,
  studentId: number,
  levelId: number,
  reason: string,
) {
  const [level] = await rows<{ id: number; code: string }>(
    req.payload.db.drizzle,
    sql`SELECT l.id, l.code FROM levels l JOIN exam_types t ON t.id = l.exam_type_id
        WHERE l.id = ${levelId} AND t.code = ${JLPT_CODE}`,
  )
  if (!level) {
    throw new AppError('VALIDATION_FAILED', undefined, [
      { path: 'levelId', message: 'Choose a JLPT level.' },
    ])
  }
  const before = await stateOf(req, studentId)
  await closeSessions(req, studentId, `override: ${reason}`)
  await req.payload.db.drizzle.execute(
    sql`UPDATE students SET determination_status = 'completed', assigned_level_id = ${level.id},
          assigned_at = now(), updated_at = now() WHERE id = ${studentId}`,
  )
  await req.payload.db.drizzle.execute(
    sql`INSERT INTO level_assignments (student_id, level_id, source, reason, actor_id)
        VALUES (${studentId}, ${level.id}, 'override', ${reason}, ${req.user!.id})`,
  )
  await recordAudit(req.payload, {
    actorType: 'admin',
    actorId: req.user!.id,
    action: 'level_check.override',
    entityType: 'students',
    entityId: studentId,
    summary: `${level.code}: ${reason}`,
    before,
    after: await stateOf(req, studentId),
  })
}

/** Wraps an admin endpoint: two-factor-verified admin with the permission, JSON errors. */
function adminEndpoint(
  permission: Permission,
  run: (req: PayloadRequest, studentId: number, body: unknown) => Promise<void>,
): PayloadHandler {
  return async (req) => {
    try {
      if (!can(req.user, permission)) throw new AppError('FORBIDDEN')
      const studentId = Number(req.routeParams?.id)
      if (!Number.isInteger(studentId) || studentId <= 0) throw new AppError('NOT_FOUND')
      const body = (await req.json?.().catch(() => undefined)) as unknown
      await run(req, studentId, body)
      return Response.json({ ok: true })
    } catch (err) {
      const { status, body } = toErrorBody(err, `req_${crypto.randomUUID()}`)
      if (status >= 500) req.payload.logger.error({ err }, 'level admin action failed')
      return Response.json(body, { status })
    }
  }
}

export const levelAdminEndpoints = [
  {
    path: '/:id/level-check/reset',
    method: 'post' as const,
    handler: adminEndpoint('students.reset_determination', async (req, id, body) => {
      const { reason } = resetSchema.parse(body)
      await resetLevelCheck(req, id, reason)
    }),
  },
  {
    path: '/:id/level/override',
    method: 'post' as const,
    handler: adminEndpoint('students.override_level', async (req, id, body) => {
      const { levelId, reason } = overrideSchema.parse(body)
      await overrideLevel(req, id, levelId, reason)
    }),
  },
]
