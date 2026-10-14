import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

import type { Student } from '@/payload-types'

import { AppError } from '../http/errors'

export async function payloadClient(): Promise<Payload> {
  return getPayload({ config })
}

export type SessionStudent = Student & { collection: 'students'; _sid?: string }

/** Resolves the signed-in student from the request cookie (or Authorization header), or null. */
export async function currentStudent(headers: Headers): Promise<SessionStudent | null> {
  const payload = await payloadClient()
  const { user } = await payload.auth({ headers })
  if (!user || user.collection !== 'students') return null
  return user as SessionStudent
}

/** Requires a signed-in, active student. Throws UNAUTHENTICATED or ACCOUNT_DISABLED. */
export async function requireStudent(headers: Headers): Promise<SessionStudent> {
  const student = await currentStudent(headers)
  if (!student) throw new AppError('UNAUTHENTICATED')
  if (student.status === 'suspended') throw new AppError('ACCOUNT_DISABLED')
  return student
}
