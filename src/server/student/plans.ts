import { z } from 'zod'

import { addDays, nepalDate } from '@/domain/study-days'

import { payloadClient } from '../auth/session'
import { AppError } from '../http/errors'

/**
 * Study plans (D-111): the student's own notes on calendar days. Every query is scoped to the
 * signed-in student; another student's plan answers NOT_FOUND. Plans can be set from a month
 * back to a year ahead (Nepal dates), at most five per day, 80 characters each.
 */
export const MAX_PLANS_PER_DAY = 5
export const PLAN_DAYS_BACK = 31
export const PLAN_DAYS_AHEAD = 366

export type Plan = { id: number; date: string; note: string; done: boolean }

export const createPlanSchema = z.strictObject({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().trim().min(1).max(80),
})
export const updatePlanSchema = z.strictObject({ done: z.boolean() })

const view = (p: { id: number; date: string; note: string; done?: boolean | null }): Plan => ({
  id: p.id,
  date: p.date,
  note: p.note,
  done: p.done === true,
})

export async function plansFor(studentId: number, from: string, to: string): Promise<Plan[]> {
  const payload = await payloadClient()
  const found = await payload.find({
    collection: 'study-plans',
    where: {
      and: [
        { student: { equals: studentId } },
        { date: { greater_than_equal: from } },
        { date: { less_than_equal: to } },
      ],
    },
    sort: ['date', 'createdAt'],
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  return found.docs.map(view)
}

export async function createPlan(
  studentId: number,
  input: z.infer<typeof createPlanSchema>,
  now: Date = new Date(),
): Promise<Plan> {
  const today = nepalDate(now)
  const valid =
    !Number.isNaN(Date.parse(`${input.date}T00:00:00Z`)) &&
    new Date(`${input.date}T00:00:00Z`).toISOString().slice(0, 10) === input.date
  if (
    !valid ||
    input.date < addDays(today, -PLAN_DAYS_BACK) ||
    input.date > addDays(today, PLAN_DAYS_AHEAD)
  ) {
    throw new AppError('VALIDATION_FAILED', undefined, { field: 'date', reason: 'out_of_range' })
  }
  const payload = await payloadClient()
  const sameDay = await payload.count({
    collection: 'study-plans',
    where: { and: [{ student: { equals: studentId } }, { date: { equals: input.date } }] },
    overrideAccess: true,
  })
  if (sameDay.totalDocs >= MAX_PLANS_PER_DAY) {
    throw new AppError('VALIDATION_FAILED', undefined, { field: 'date', reason: 'day_full' })
  }
  const doc = await payload.create({
    collection: 'study-plans',
    data: { student: studentId, date: input.date, note: input.note, done: false },
    overrideAccess: true,
  })
  return view(doc)
}

async function ownPlan(studentId: number, id: number) {
  const payload = await payloadClient()
  const found = await payload.find({
    collection: 'study-plans',
    where: { and: [{ id: { equals: id } }, { student: { equals: studentId } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const plan = found.docs[0]
  if (!plan) throw new AppError('NOT_FOUND')
  return { payload, plan }
}

export async function setPlanDone(studentId: number, id: number, done: boolean): Promise<Plan> {
  const { payload, plan } = await ownPlan(studentId, id)
  return view(
    await payload.update({
      collection: 'study-plans',
      id: plan.id,
      data: { done },
      overrideAccess: true,
    }),
  )
}

export async function deletePlan(studentId: number, id: number): Promise<void> {
  const { payload, plan } = await ownPlan(studentId, id)
  await payload.delete({ collection: 'study-plans', id: plan.id, overrideAccess: true })
}
