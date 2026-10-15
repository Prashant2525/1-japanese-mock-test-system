import { payloadClient } from '@/server/auth/session'
import { AppError } from '@/server/http/errors'
import { withRoute } from '@/server/http/route'
import { verifyMediaSignature } from '@/server/media/signing'
import { openLearningFile } from '@/server/media/storage'
import { requireStudentWithLevel } from '@/server/student/gate'
import { accessibleMediaFor } from '@/server/study/service'

export const dynamic = 'force-dynamic'

/**
 * A private learning-media file (D-041). Needs: the student's session and level, a valid unexpired
 * signature for this student and file, and a material the student may open that uses the file.
 * Supports byte ranges so audio can be played and seeked.
 */
export const GET = withRoute<{ id: string }>(async (req, { params }) => {
  const student = await requireStudentWithLevel(req.headers)
  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) throw new AppError('NOT_FOUND')
  const url = new URL(req.url)
  const payload = await payloadClient()
  const valid = verifyMediaSignature(
    payload.secret,
    id,
    student.id,
    Number(url.searchParams.get('exp')),
    url.searchParams.get('sig') ?? '',
  )
  if (!valid) throw new AppError('FORBIDDEN', 'This link has expired or is not yours.')
  const media = await accessibleMediaFor(student, id)
  if (!media?.filename || !media.mimeType) throw new AppError('NOT_FOUND')
  const file = await openLearningFile(media.filename, req.headers.get('range'))
  if (!file) throw new AppError('NOT_FOUND')
  const headers = new Headers({
    'Content-Type': media.mimeType,
    'Content-Length': String(file.end - file.start + 1),
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=600',
    'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(media.filename)}`,
  })
  if (file.partial) headers.set('Content-Range', `bytes ${file.start}-${file.end}/${file.size}`)
  return new Response(file.body, { status: file.partial ? 206 : 200, headers })
})
