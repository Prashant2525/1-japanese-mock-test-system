import { z } from 'zod'

import { payloadClient } from '../auth/session'
import { AppError } from '../http/errors'
import { requireStudentWithLevel } from './gate'

/**
 * Student areas behind the level gate (Phase 10). The gate is final here; the data arrives with
 * the phase that creates it. Real since Phase 11: results (level-check stages); since Phase 12:
 * study materials (src/server/study). Still a placeholder: starting a mock-test attempt (Phase 16,
 * KI-27).
 */
export type Page<T> = {
  docs: T[]
  totalDocs: number
  page: number
  totalPages: number
}

export type ResultListItem = {
  id: number
  kind: 'determination' | 'mock'
  levelCode: string | null
  title: { en: string; ja: string } | null
  percent: number
  passed: boolean
  createdAt: string
}

/** The student's own results, newest first (level-check stages now; mock tests from Phase 16). */
export async function listResults(
  headers: Headers,
  page = 1,
  limit = 20,
): Promise<Page<ResultListItem>> {
  const student = await requireStudentWithLevel(headers)
  const payload = await payloadClient()
  const found = await payload.find({
    collection: 'results',
    where: { student: { equals: student.id } },
    sort: '-createdAt',
    page,
    limit,
    depth: 0,
    overrideAccess: true,
  })
  return {
    docs: found.docs.map((r) => ({
      id: r.id,
      kind: r.kind,
      levelCode: r.levelCode ?? null,
      title: (r.titleSnapshot as { en: string; ja: string } | null) ?? null,
      percent: r.percent,
      passed: r.passed,
      createdAt: r.createdAt,
    })),
    totalDocs: found.totalDocs,
    page: found.page ?? page,
    totalPages: found.totalPages,
  }
}

export const startAttemptSchema = z.strictObject({ mockTestId: z.number().int().positive() })

/** The gate runs before the body is even read, so a forged body learns nothing. */
export async function startAttempt(
  headers: Headers,
  readBody: () => Promise<unknown>,
): Promise<never> {
  await requireStudentWithLevel(headers)
  startAttemptSchema.parse(await readBody())
  throw new AppError('NOT_FOUND', 'This mock test does not exist.')
}
