import { AppError } from '@/server/http/errors'
import { parseJson, withRoute } from '@/server/http/route'
import { deletePlan, setPlanDone, updatePlanSchema } from '@/server/student/plans'
import { requireStudentWithLevel } from '@/server/student/gate'

export const dynamic = 'force-dynamic'

const planId = (raw: string): number => {
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) throw new AppError('NOT_FOUND')
  return id
}

/** Ticks a plan off (or back on); only the student's own plans (others answer 404). */
export const PATCH = withRoute<{ id: string }>(async (req, { params }) => {
  const student = await requireStudentWithLevel(req.headers)
  const { done } = await parseJson(req, updatePlanSchema)
  return Response.json(await setPlanDone(student.id, planId(params.id), done), {
    headers: { 'Cache-Control': 'no-store' },
  })
})

/** Removes one of the student's own plans. */
export const DELETE = withRoute<{ id: string }>(async (req, { params }) => {
  const student = await requireStudentWithLevel(req.headers)
  await deletePlan(student.id, planId(params.id))
  return new Response(null, { status: 204 })
})
