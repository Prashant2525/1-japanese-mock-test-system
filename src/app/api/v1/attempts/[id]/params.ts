import { AppError } from '@/server/http/errors'

/** Route IDs are positive integers; anything else is simply not found. */
export function attemptId(raw: string): number {
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) throw new AppError('NOT_FOUND')
  return id
}
