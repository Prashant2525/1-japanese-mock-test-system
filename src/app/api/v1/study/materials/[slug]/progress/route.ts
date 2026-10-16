import { z } from 'zod'

import { parseJson, withRoute } from '@/server/http/route'
import { requireStudentWithLevel } from '@/server/student/gate'
import { setStudied } from '@/server/study/progress'

export const dynamic = 'force-dynamic'

const progressSchema = z.strictObject({ studied: z.boolean() })

/**
 * Marks a material as studied (or not) for the signed-in student (RV-12). The level gate runs
 * before the body is read; materials the student may not open answer 404.
 */
export const PUT = withRoute<{ slug: string }>(async (req, { params }) => {
  const student = await requireStudentWithLevel(req.headers)
  const { studied } = await parseJson(req, progressSchema)
  return Response.json(await setStudied(student, params.slug, studied), {
    headers: { 'Cache-Control': 'no-store' },
  })
})
