import { withRoute } from '@/server/http/route'
import { requireStudentWithLevel } from '@/server/student/gate'
import { studyMaterialFor } from '@/server/study/service'

export const dynamic = 'force-dynamic'

/** One study material with signed media links. 404 unless published and open to this student. */
export const GET = withRoute<{ slug: string }>(async (req, { params }) => {
  const student = await requireStudentWithLevel(req.headers)
  const locale = new URL(req.url).searchParams.get('locale') === 'ja' ? 'ja' : 'en'
  return Response.json(await studyMaterialFor(student, params.slug, locale), {
    headers: { 'Cache-Control': 'no-store' },
  })
})
