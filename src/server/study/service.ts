import type { Payload, Where } from 'payload'

import { studyLevelIds } from '@/domain/study'
import type { LearningMedia, Level, MaterialCategory, StudyMaterial } from '@/payload-types'

import { payloadClient } from '../auth/session'
import { AppError } from '../http/errors'
import { signedMediaPath } from '../media/signing'
import type { SessionStudent } from '../auth/session'

/**
 * The study library for students (SM-R01..R06): published, non-archived materials of the
 * student's level and below (levels switched on for study only), in enabled categories.
 * Everything else, including drafts and higher levels, is indistinguishable from "not found".
 */
type Locale = 'en' | 'ja'
type Student = Pick<SessionStudent, 'id' | 'assignedLevel'>

const idOf = (v: unknown): number | null =>
  v && typeof v === 'object' && 'id' in v
    ? Number((v as { id: unknown }).id)
    : v == null
      ? null
      : Number(v)

async function eligibility(payload: Payload, student: Student, locale: Locale) {
  const levels = await payload.find({
    collection: 'levels',
    where: { 'examType.code': { equals: 'JLPT' } },
    pagination: false,
    depth: 1,
    locale,
    overrideAccess: true,
  })
  const studentLevelId = idOf(student.assignedLevel)
  const own = levels.docs.find((l) => l.id === studentLevelId)
  const ids = studyLevelIds(
    own ? { examCode: 'JLPT', order: own.order } : null,
    levels.docs.map((l) => ({
      id: l.id,
      examCode: 'JLPT',
      order: l.order,
      enabledForStudy: l.enabledForStudy === true,
    })),
  )
  const categories = await payload.find({
    collection: 'material-categories',
    where: { enabled: { equals: true } },
    sort: 'order',
    pagination: false,
    depth: 0,
    locale,
    overrideAccess: true,
  })
  return {
    levels: levels.docs.filter((l) => ids.includes(l.id)).sort((a, b) => a.order - b.order),
    categories: categories.docs,
  }
}

/** The base rule every student query starts from. */
function visibleWhere(levelIds: number[], categoryIds: number[]): Where[] {
  return [
    { _status: { equals: 'published' } },
    { archived: { not_equals: true } },
    { level: { in: levelIds.length ? levelIds : [-1] } },
    { category: { in: categoryIds.length ? categoryIds : [-1] } },
  ]
}

export type StudyLevelOption = { code: string; name: string; badgeColor: string }
export type StudyCategoryOption = { key: string; name: string; symbol: string | null }
export type StudyListItem = {
  slug: string
  title: string
  summary: string | null
  level: StudyLevelOption
  category: StudyCategoryOption
  media: { image: number; audio: number; pdf: number }
}

const levelOption = (l: Level): StudyLevelOption => ({
  code: l.code,
  name: l.name,
  badgeColor: l.badgeColor,
})
const categoryOption = (c: MaterialCategory): StudyCategoryOption => ({
  key: c.key,
  name: c.name,
  symbol: c.symbol ?? null,
})

export async function listStudyMaterialsFor(
  student: Student,
  options: {
    locale: Locale
    level?: string | null
    category?: string | null
    page?: number
    limit?: number
  },
) {
  const payload = await payloadClient()
  const { levels, categories } = await eligibility(payload, student, options.locale)
  const levelIds = levels.filter((l) => !options.level || l.code === options.level).map((l) => l.id)
  const categoryIds = categories
    .filter((c) => !options.category || c.key === options.category)
    .map((c) => c.id)
  const found = await payload.find({
    collection: 'study-materials',
    where: { and: visibleWhere(levelIds, categoryIds) },
    sort: ['order', 'createdAt'],
    page: options.page ?? 1,
    limit: options.limit ?? 24,
    depth: 2,
    locale: options.locale,
    overrideAccess: true,
  })
  const docs: StudyListItem[] = found.docs.map((m) => {
    const media = { image: 0, audio: 0, pdf: 0 }
    for (const a of m.attachments ?? []) {
      const kind = typeof a.media === 'object' ? a.media?.kind : null
      if (kind) media[kind] += 1
    }
    return {
      slug: m.slug,
      title: m.title,
      summary: m.summary ?? null,
      level: levelOption(m.level as Level),
      category: categoryOption(m.category as MaterialCategory),
      media,
    }
  })
  return {
    docs,
    totalDocs: found.totalDocs,
    page: found.page ?? 1,
    totalPages: found.totalPages,
    filters: { levels: levels.map(levelOption), categories: categories.map(categoryOption) },
  }
}

export type StudyAttachment = {
  kind: 'image' | 'audio' | 'pdf'
  title: string | null
  alt: string | null
  caption: string | null
  filename: string
  mimeType: string
  url: string
}

export type StudyMaterialView = {
  slug: string
  title: string
  summary: string | null
  body: StudyMaterial['body']
  level: StudyLevelOption
  category: StudyCategoryOption
  attachments: StudyAttachment[]
}

export async function studyMaterialFor(
  student: Student,
  slug: string,
  locale: Locale,
): Promise<StudyMaterialView> {
  const payload = await payloadClient()
  const { levels, categories } = await eligibility(payload, student, locale)
  const found = await payload.find({
    collection: 'study-materials',
    where: {
      and: [
        { slug: { equals: slug } },
        ...visibleWhere(
          levels.map((l) => l.id),
          categories.map((c) => c.id),
        ),
      ],
    },
    limit: 1,
    depth: 2,
    locale,
    overrideAccess: true,
  })
  const m = found.docs[0]
  if (!m) throw new AppError('NOT_FOUND')
  return {
    slug: m.slug,
    title: m.title,
    summary: m.summary ?? null,
    body: m.body,
    level: levelOption(m.level as Level),
    category: categoryOption(m.category as MaterialCategory),
    attachments: (m.attachments ?? [])
      .map((a) => ({ a, media: typeof a.media === 'object' ? (a.media as LearningMedia) : null }))
      .filter(({ media }) => media?.kind && media.mimeType && media.filename)
      .map(({ a, media }) => ({
        kind: media!.kind!,
        title: a.title ?? null,
        alt: media!.alt ?? null,
        caption: media!.caption ?? null,
        filename: media!.filename!,
        mimeType: media!.mimeType!,
        url: signedMediaPath(payload.secret, media!.id, student.id),
      })),
  }
}

/**
 * The media item, if this student may open it: it is attached to at least one material they can
 * see right now. Re-checked on every request, so unpublishing or archiving a material, or a level
 * reset, closes its files at once.
 */
export async function accessibleMediaFor(
  student: Student,
  mediaId: number,
): Promise<LearningMedia | null> {
  const payload = await payloadClient()
  const { levels, categories } = await eligibility(payload, student, 'en')
  const found = await payload.find({
    collection: 'study-materials',
    where: {
      and: [
        { 'attachments.media': { equals: mediaId } },
        ...visibleWhere(
          levels.map((l) => l.id),
          categories.map((c) => c.id),
        ),
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (!found.docs.length) return null
  return payload.findByID({
    collection: 'learning-media',
    id: mediaId,
    depth: 0,
    overrideAccess: true,
  })
}
