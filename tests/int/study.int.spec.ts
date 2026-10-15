import { randomUUID } from 'node:crypto'

import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { POST as loginRoute } from '@/app/api/v1/auth/login/route'
import { GET as mediaRoute } from '@/app/api/v1/media/[id]/route'
import { GET as detailRoute } from '@/app/api/v1/study/materials/[slug]/route'
import { GET as listRoute } from '@/app/api/v1/study/materials/route'
import { signedMediaPath } from '@/server/media/signing'

import { MP3, PDF, PNG } from '../fixtures/files'

import {
  asUser,
  call,
  client,
  cookieFrom,
  createAdmin,
  createStudent,
  resetRateLimits,
  uniqueIp,
} from './helpers'

/**
 * Phase 12: the study library and private media (SM-R01..R06, D-041, PB §11.13), through the
 * real routes, Payload access rules, upload validation and the database.
 */
let payload: Payload
let editor: Awaited<ReturnType<typeof asUser>>
let support: Awaited<ReturnType<typeof asUser>>
const levelIds = new Map<string, number>()
const categoryIds = new Map<string, number>()
const run = randomUUID().slice(0, 6)
const slug = (name: string) => `t${run}-${name}`

const file = (data: Buffer, mimetype: string, name: string) => ({
  data,
  mimetype,
  name,
  size: data.length,
})

async function upload(
  data: Buffer,
  mimetype: string,
  name: string,
  extra: Record<string, unknown> = {},
) {
  return payload.create({
    collection: 'learning-media',
    data: { alt: 'A test image', ...extra },
    file: file(data, mimetype, `${run}-${name}`),
    user: editor,
    overrideAccess: false,
  })
}

async function material(
  name: string,
  level: string,
  opts: { publish?: boolean; archived?: boolean; category?: string; media?: number[] } = {},
) {
  return payload.create({
    collection: 'study-materials',
    draft: opts.publish === false,
    data: {
      title: `Material ${name}`,
      slug: slug(name),
      level: levelIds.get(level)!,
      category: categoryIds.get(opts.category ?? 'grammar')!,
      summary: `Summary ${name}`,
      order: 1,
      archived: opts.archived ?? false,
      attachments: (opts.media ?? []).map((m) => ({ media: m })),
      _status: opts.publish === false ? 'draft' : 'published',
    },
    user: editor,
    overrideAccess: false,
  })
}

async function student(level: string | null) {
  const { student: s, email, password } = await createStudent()
  if (level) {
    await payload.db.updateOne({
      collection: 'students',
      id: s.id,
      data: {
        determinationStatus: 'completed',
        assignedLevel: levelIds.get(level),
        assignedAt: new Date().toISOString(),
      },
      returning: false,
    })
  }
  const res = await call(loginRoute, '/api/v1/auth/login', {
    body: { email, password },
    ip: uniqueIp(),
  })
  return { id: s.id, cookie: cookieFrom(res) }
}

async function listed(cookie: string, query = '') {
  const res = await call(listRoute, `/api/v1/study/materials?limit=50${query}`, { cookie })
  expect(res.status).toBe(200)
  const body = (await res.json()) as { docs: { slug: string }[] }
  return body.docs.map((d) => d.slug).filter((s) => s.startsWith(`t${run}-`))
}

const callWith = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- route handlers differ in param shape
  handler: (req: Request, c: any) => Promise<Response>,
  path: string,
  params: Record<string, string>,
  cookie: string,
  headers: Record<string, string> = {},
) =>
  handler(
    new Request(`http://localhost:3000${path}`, {
      headers: { cookie, 'sec-fetch-site': 'same-origin', ...headers },
    }),
    { params: Promise.resolve(params) },
  )

let png: number
let pdf: number
let mp3: number

beforeAll(async () => {
  payload = await client()
  editor = await asUser((await createAdmin('Content Editor')).admin)
  support = await asUser((await createAdmin('Support')).admin)
  // Earlier runs' materials and files go first: the list is paged and oldest-first, so leftovers
  // would eventually push this run's materials off the first page.
  for (const [collection, field, pattern] of [
    ['study-materials', 'slug', /^t[0-9a-f]{6}-/],
    ['learning-media', 'filename', /^[0-9a-f]{6}-/],
  ] as const) {
    const old = await payload.find({ collection, pagination: false, depth: 0, draft: true })
    const ids = old.docs
      .filter((d) => pattern.test(String((d as unknown as Record<string, unknown>)[field] ?? '')))
      .map((d) => d.id)
    if (ids.length) await payload.delete({ collection, where: { id: { in: ids } } })
  }
  const levels = await payload.find({
    collection: 'levels',
    where: { 'examType.code': { equals: 'JLPT' } },
    pagination: false,
    depth: 0,
  })
  for (const l of levels.docs) levelIds.set(l.code, l.id)
  const cats = await payload.find({
    collection: 'material-categories',
    pagination: false,
    depth: 0,
  })
  for (const c of cats.docs) categoryIds.set(c.key, c.id)
  png = (await upload(PNG, 'image/png', 'pic.png')).id
  pdf = (await upload(PDF, 'application/pdf', 'doc.pdf', { alt: undefined })).id
  mp3 = (await upload(MP3, 'audio/mpeg', 'sound.mp3', { alt: undefined })).id
})

beforeEach(async () => {
  await resetRateLimits()
})

describe('learning media uploads (rule 10, D-041)', () => {
  it('stores allowed files and records their kind', async () => {
    const docs = await Promise.all(
      [png, pdf, mp3].map((id) => payload.findByID({ collection: 'learning-media', id })),
    )
    expect(docs.map((d) => d.kind)).toEqual(['image', 'pdf', 'audio'])
  })

  it.each([
    [
      'an SVG image',
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      'image/svg+xml',
      'x.svg',
    ],
    [
      'a web page disguised as a PDF',
      Buffer.from('<html><script>alert(1)</script>'),
      'application/pdf',
      'x.pdf',
    ],
    [
      'an oversized image',
      Buffer.concat([PNG, Buffer.alloc(6 * 1024 * 1024)]),
      'image/png',
      'big.png',
    ],
  ])('refuses %s', async (_label, data, mime, name) => {
    await expect(upload(data, mime, name)).rejects.toMatchObject({ status: 400 })
  })

  it('an image needs alternative text', async () => {
    await expect(upload(PNG, 'image/png', 'noalt.png', { alt: '' })).rejects.toMatchObject({
      status: 400,
    })
  })

  it('Support cannot upload, and nobody can delete media', async () => {
    await expect(
      payload.create({
        collection: 'learning-media',
        data: { alt: 'x' },
        file: file(PNG, 'image/png', `${run}-s.png`),
        user: support,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      payload.delete({
        collection: 'learning-media',
        id: png,
        user: editor,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })
})

describe('who sees which materials (SM-R02, SM-R03)', () => {
  beforeAll(async () => {
    await material('n5', 'N5', { media: [pdf, mp3, png] })
    await material('n4', 'N4')
    await material('n3', 'N3')
    await material('draft', 'N5', { publish: false })
    await material('archived', 'N5', { archived: true })
    const hidden = await payload.create({
      collection: 'material-categories',
      locale: 'en',
      data: { key: `hidden-${run}`, name: 'Hidden', order: 99, enabled: false },
      user: editor,
      overrideAccess: false,
    })
    categoryIds.set('hidden', hidden.id)
    await material('hidden-cat', 'N5', { category: 'hidden' })
  })

  it.each([
    ['N5', ['n5']],
    ['N4', ['n4', 'n5']],
    ['N3', ['n3', 'n4', 'n5']],
    ['N2 (override): nothing above N3 at launch', ['n3', 'n4', 'n5']],
  ])('a student at %s sees their level and below', async (level, expected) => {
    const s = await student(level.slice(0, 2))
    expect((await listed(s.cookie)).sort()).toEqual(expected.map(slug).sort())
  })

  it('drafts, archived materials and disabled categories never appear, even by address', async () => {
    const s = await student('N3')
    for (const name of ['draft', 'archived', 'hidden-cat']) {
      const res = await callWith(detailRoute, `/x`, { slug: slug(name) }, s.cookie)
      expect(res.status, name).toBe(404)
    }
  })

  it('a higher-level material is not found by a lower-level student', async () => {
    const s = await student('N5')
    expect((await callWith(detailRoute, '/x', { slug: slug('n4') }, s.cookie)).status).toBe(404)
  })

  it('a material cannot be put on a level that is closed for study (N2)', async () => {
    await expect(material('n2', 'N2')).rejects.toMatchObject({ status: 400 })
  })

  it('students without a level are refused (LD-R02)', async () => {
    const s = await student(null)
    expect((await call(listRoute, '/api/v1/study/materials', { cookie: s.cookie })).status).toBe(
      403,
    )
    expect((await callWith(detailRoute, '/x', { slug: slug('n5') }, s.cookie)).status).toBe(403)
  })

  it('filters by level and category', async () => {
    const s = await student('N3')
    expect(await listed(s.cookie, '&level=N4')).toEqual([slug('n4')])
    expect(await listed(s.cookie, '&category=kanji')).toEqual([])
  })

  it('publishing makes a material visible at once; a later draft edit keeps the published text', async () => {
    const s = await student('N5')
    const m = await material('late', 'N5', { publish: false })
    expect(await listed(s.cookie)).not.toContain(slug('late'))
    await payload.update({
      collection: 'study-materials',
      id: m.id,
      data: { _status: 'published' },
      user: editor,
      overrideAccess: false,
    })
    expect(await listed(s.cookie)).toContain(slug('late'))
    await payload.update({
      collection: 'study-materials',
      id: m.id,
      draft: true,
      data: { title: 'Unfinished new title' },
      user: editor,
      overrideAccess: false,
    })
    const detail = (await (
      await callWith(detailRoute, '/x', { slug: slug('late') }, s.cookie)
    ).json()) as { title: string }
    expect(detail.title).toBe('Material late')
  })

  it('Support can read but not write materials; nobody deletes them', async () => {
    await expect(
      payload.create({
        collection: 'study-materials',
        data: {
          title: 'x',
          slug: slug('s'),
          level: levelIds.get('N5')!,
          category: categoryIds.get('grammar')!,
          order: 1,
        },
        user: support,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
    const any = await payload.find({
      collection: 'study-materials',
      where: { slug: { equals: slug('n5') } },
    })
    await expect(
      payload.delete({
        collection: 'study-materials',
        id: any.docs[0]!.id,
        user: editor,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })
})

describe('private media links (D-041)', () => {
  async function detailOf(cookie: string, name = 'n5') {
    const res = await callWith(detailRoute, '/x', { slug: slug(name) }, cookie)
    return (await res.json()) as { attachments: { kind: string; url: string }[]; body: unknown }
  }
  const fetchMedia = (cookie: string, url: string, headers: Record<string, string> = {}) => {
    const u = new URL(url, 'http://localhost:3000')
    return callWith(
      mediaRoute,
      `${u.pathname}${u.search}`,
      { id: u.pathname.split('/').pop()! },
      cookie,
      headers,
    )
  }

  it('the material lists its files with signed links that serve the bytes, with byte ranges', async () => {
    const s = await student('N4')
    const d = await detailOf(s.cookie)
    expect(d.attachments.map((a) => a.kind)).toEqual(['pdf', 'audio', 'image'])
    const res = await fetchMedia(s.cookie, d.attachments[0]!.url)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/pdf')
    expect(Buffer.from(await res.arrayBuffer()).equals(PDF)).toBe(true)
    const part = await fetchMedia(s.cookie, d.attachments[1]!.url, { range: 'bytes=0-2' })
    expect(part.status).toBe(206)
    expect(part.headers.get('content-range')).toBe(`bytes 0-2/${MP3.length}`)
    expect(Buffer.from(await part.arrayBuffer()).toString()).toBe('ID3')
  })

  it('a link is refused when tampered with, used by another student, or expired', async () => {
    const owner = await student('N5')
    const other = await student('N5')
    const url = (await detailOf(owner.cookie)).attachments[0]!.url
    expect((await fetchMedia(owner.cookie, url.replace(/sig=./, 'sig=X'))).status).toBe(403)
    expect((await fetchMedia(other.cookie, url)).status).toBe(403)
    const expired = signedMediaPath(
      payload.secret,
      pdf,
      owner.id,
      Math.floor(Date.now() / 1000) - 3 * 60 * 60,
    )
    expect((await fetchMedia(owner.cookie, expired)).status).toBe(403)
  })

  it('a file is closed as soon as its material is archived', async () => {
    const s = await student('N5')
    const extra = await upload(PDF, 'application/pdf', 'extra.pdf', { alt: undefined })
    const m = await material('closing', 'N5', { media: [extra.id] })
    const url = (await detailOf(s.cookie, 'closing')).attachments[0]!.url
    expect((await fetchMedia(s.cookie, url)).status).toBe(200)
    await payload.update({
      collection: 'study-materials',
      id: m.id,
      data: { archived: true },
      user: editor,
      overrideAccess: false,
    })
    expect((await fetchMedia(s.cookie, url)).status).toBe(404)
  })

  it('a correctly signed link to a file of a higher level still finds nothing', async () => {
    const s = await student('N5')
    const extra = await upload(PDF, 'application/pdf', 'n4only.pdf', { alt: undefined })
    await material('n4-file', 'N4', { media: [extra.id] })
    const url = signedMediaPath(payload.secret, extra.id, s.id)
    expect((await fetchMedia(s.cookie, url)).status).toBe(404)
  })
})
