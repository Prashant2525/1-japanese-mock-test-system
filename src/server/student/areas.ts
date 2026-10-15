import { z } from 'zod'

import { AppError } from '../http/errors'
import { requireStudentWithLevel } from './gate'

/**
 * Student areas behind the level gate (Phase 10). The gate is final here; the data arrives with
 * the phase that creates it: study materials (Phase 12), attempts (Phase 16), results (Phase 17).
 * Until then the honest answers are "nothing published yet", "no results yet" and "no such test"
 * (KI-27: replace each with the real query in its phase).
 */
export type Page<T> = {
  docs: T[]
  totalDocs: number
  page: number
  totalPages: number
}

const emptyPage = <T>(): Page<T> => ({ docs: [], totalDocs: 0, page: 1, totalPages: 0 })

export async function listStudyMaterials(headers: Headers): Promise<Page<never>> {
  await requireStudentWithLevel(headers)
  return emptyPage()
}

export async function listResults(headers: Headers): Promise<Page<never>> {
  await requireStudentWithLevel(headers)
  return emptyPage()
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
