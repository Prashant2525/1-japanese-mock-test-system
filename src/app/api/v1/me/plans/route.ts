import { parseJson, withRoute } from '@/server/http/route'
import { createPlan, createPlanSchema } from '@/server/student/plans'
import { requireStudentWithLevel } from '@/server/student/gate'

export const dynamic = 'force-dynamic'

/** Adds a study plan to one of the signed-in student's calendar days (D-111). */
export const POST = withRoute(async (req) => {
  const student = await requireStudentWithLevel(req.headers)
  const input = await parseJson(req, createPlanSchema)
  return Response.json(await createPlan(student.id, input), {
    status: 201,
    headers: { 'Cache-Control': 'no-store' },
  })
})
