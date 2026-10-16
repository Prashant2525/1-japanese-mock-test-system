import { z } from 'zod'

import { parseJson, withRoute } from '@/server/http/route'
import { setDailyGoal } from '@/server/student/activity'
import { requireStudentWithLevel } from '@/server/student/gate'

export const dynamic = 'force-dynamic'

const goalSchema = z.strictObject({ dailyGoal: z.number().int().min(1).max(5) })

/** The signed-in student's daily goal in materials (D-110, DASH-3). */
export const PUT = withRoute(async (req) => {
  const student = await requireStudentWithLevel(req.headers)
  const { dailyGoal } = await parseJson(req, goalSchema)
  return Response.json(
    { dailyGoal: await setDailyGoal(student.id, dailyGoal) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
})
