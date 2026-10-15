import type { Student } from '@/payload-types'

import { requireStudent, type SessionStudent } from '../auth/session'
import { AppError } from '../http/errors'

/**
 * The level gate (LD-R01, LD-R02, ARCHITECTURE §4). Study materials, mock tests and results are
 * open only once the level check has assigned a level. Fails closed: "completed" without an
 * assigned level counts as not determined.
 */
type GateFields = Pick<Student, 'determinationStatus' | 'assignedLevel'>

export function hasDeterminedLevel(student: GateFields): boolean {
  return student.determinationStatus === 'completed' && student.assignedLevel != null
}

/** Where a signed-in student belongs: the level check until a level is assigned, then home. */
export type NextStep = 'level_check' | 'home'

export function nextStepFor(student: GateFields): NextStep {
  return hasDeterminedLevel(student) ? 'home' : 'level_check'
}

/** Throws 403 LEVEL_NOT_DETERMINED (with `nextStep`) unless the student has a level. */
export function requireDeterminedLevel(student: GateFields): void {
  if (!hasDeterminedLevel(student)) {
    throw new AppError('LEVEL_NOT_DETERMINED', undefined, { nextStep: 'level_check' })
  }
}

/**
 * Signed-in, active student with an assigned level, from the request cookie only. Every study,
 * mock-test and results route calls this first; nothing in the request body or URL can change
 * the outcome.
 */
export async function requireStudentWithLevel(headers: Headers): Promise<SessionStudent> {
  const student = await requireStudent(headers)
  requireDeterminedLevel(student)
  return student
}
