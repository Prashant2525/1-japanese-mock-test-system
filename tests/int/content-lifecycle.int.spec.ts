import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import path from 'node:path'

import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { LEARNING_MEDIA_DIR } from '@/payload/collections/LearningMedia'

import { PDF, PNG } from '../fixtures/files'

import { asUser, client, createAdmin } from './helpers'

/**
 * Phase 12b: the content lifecycle (D-091, D-092; LC-R01..R04; KI-39..KI-41). Deleting is allowed
 * only where no history depends on the record, refused while something still uses it, needs its
 * own permission, removes stored files, and is audited. Taking published content offline needs the
 * publish permission.
 */
let payload: Payload
type User = Awaited<ReturnType<typeof asUser>>
let superAdmin: User
let editor: User
let drafter: User
const run = randomUUID().slice(0, 6)
const levelIds = new Map<string, number>()
const categoryIds = new Map<string, number>()
let jlptId: number

const file = (data: Buffer, mimetype: string, name: string) => ({
  data,
  mimetype,
  name,
  size: data.length,
})

const upload = (name: string, data = PDF, mimetype = 'application/pdf') =>
  payload.create({
    collection: 'learning-media',
    data: mimetype.startsWith('image/') ? { alt: 'A picture' } : {},
    file: file(data, mimetype, `lc${run}-${name}`),
    user: editor,
    overrideAccess: false,
  })

const material = (
  name: string,
  opts: { publish?: boolean; media?: number[]; category?: number } = {},
) =>
  payload.create({
    collection: 'study-materials',
    draft: opts.publish === false,
    data: {
      title: `Lifecycle ${name}`,
      slug: `lc${run}-${name}`,
      level: levelIds.get('N5')!,
      category: opts.category ?? categoryIds.get('grammar')!,
      order: 1,
      attachments: (opts.media ?? []).map((m) => ({ media: m })),
      _status: opts.publish === false ? 'draft' : 'published',
    },
    user: editor,
    overrideAccess: false,
  })

const question = (stem: string, publish: boolean) =>
  payload.create({
    collection: 'questions',
    draft: !publish,
    data: {
      examType: jlptId,
      level: levelIds.get('N5')!,
      stem,
      options: [
        { key: 'A', text: 'あ' },
        { key: 'B', text: 'い' },
      ],
      correctOptionKey: 'A',
      explanation: 'Lifecycle test',
      marks: 1,
      rightsConfirmed: true,
      _status: publish ? 'published' : 'draft',
    },
    user: editor,
    overrideAccess: false,
  })

/** Status and message of a refused Payload call. */
async function refusal(p: Promise<unknown>): Promise<{ status: number; message: string }> {
  try {
    await p
  } catch (err) {
    const e = err as { status?: number; message?: string }
    return { status: e.status ?? 500, message: e.message ?? '' }
  }
  throw new Error('expected the call to be refused')
}

beforeAll(async () => {
  payload = await client()
  superAdmin = await asUser((await createAdmin('Super Admin')).admin)
  editor = await asUser((await createAdmin('Content Editor')).admin)
  // A role that may edit drafts but not publish: it must not be able to take content offline.
  const role = await payload.create({
    collection: 'roles',
    data: { name: `Drafter ${run}`, permissions: ['materials.manage', 'questions.manage'] },
  })
  const { admin } = await createAdmin('Content Editor')
  await payload.update({ collection: 'admins', id: admin.id, data: { roles: [role.id] } })
  drafter = await asUser(admin)

  const levels = await payload.find({
    collection: 'levels',
    where: { 'examType.code': { equals: 'JLPT' } },
    pagination: false,
    depth: 0,
  })
  for (const l of levels.docs) levelIds.set(l.code, l.id)
  jlptId = (await payload.find({ collection: 'exam-types', where: { code: { equals: 'JLPT' } } }))
    .docs[0]!.id
  const cats = await payload.find({ collection: 'material-categories', pagination: false })
  for (const c of cats.docs) categoryIds.set(c.key, c.id)
})

describe('taking published content offline needs the publish permission (KI-41)', () => {
  it('a drafter can save a draft of a published material, but cannot unpublish or archive it', async () => {
    const m = await material('offline')
    // A draft save leaves the published version alone.
    await payload.update({
      collection: 'study-materials',
      id: m.id,
      draft: true,
      data: { title: 'Draft title' },
      user: drafter,
      overrideAccess: false,
    })
    const live = await payload.findByID({ collection: 'study-materials', id: m.id })
    expect(live._status).toBe('published')
    expect(live.title).toBe('Lifecycle offline')

    // Unpublishing (a non-draft save with status "draft") and archiving change the live material.
    for (const data of [{ _status: 'draft' as const }, { archived: true }]) {
      const r = await refusal(
        payload.update({
          collection: 'study-materials',
          id: m.id,
          data,
          user: drafter,
          overrideAccess: false,
        }),
      )
      expect(r.status).toBe(403)
    }
    const still = await payload.findByID({ collection: 'study-materials', id: m.id })
    expect(still._status).toBe('published')
    expect(still.archived).toBeFalsy()

    // Someone with the publish permission can.
    const off = await payload.update({
      collection: 'study-materials',
      id: m.id,
      data: { _status: 'draft' },
      user: editor,
      overrideAccess: false,
    })
    expect(off._status).toBe('draft')
  })

  it('a drafter can still edit a material that has never been published', async () => {
    const m = await material('never-live', { publish: false })
    const edited = await payload.update({
      collection: 'study-materials',
      id: m.id,
      data: { title: 'Renamed draft' },
      user: drafter,
      overrideAccess: false,
    })
    expect(edited.title).toBe('Renamed draft')
  })

  it('the same rule protects published questions', async () => {
    const q = await question(`【テスト】${run} published`, true)
    const r = await refusal(
      payload.update({
        collection: 'questions',
        id: q.id,
        data: { archived: true },
        user: drafter,
        overrideAccess: false,
      }),
    )
    expect(r.status).toBe(403)
  })
})

describe('deleting learning media (KI-39)', () => {
  it('an unused file is deleted with its stored file, and the deletion is audited', async () => {
    const doc = await upload('unused.pdf')
    const stored = path.join(LEARNING_MEDIA_DIR, doc.filename!)
    expect(existsSync(stored)).toBe(true)
    await payload.delete({
      collection: 'learning-media',
      id: doc.id,
      user: superAdmin,
      overrideAccess: false,
    })
    expect(existsSync(stored)).toBe(false)
    const gone = await payload.find({
      collection: 'learning-media',
      where: { id: { equals: doc.id } },
    })
    expect(gone.totalDocs).toBe(0)
    const audit = await payload.find({
      collection: 'audit-events',
      where: {
        and: [
          { action: { equals: 'learning_media.deleted' } },
          { entityId: { equals: String(doc.id) } },
        ],
      },
    })
    expect(audit.totalDocs).toBe(1)
  })

  it('a file used by a published material or a draft is refused, naming where it is used', async () => {
    const used = await upload('used.pdf')
    await material('uses-file', { media: [used.id] })
    const draftOnly = await upload('draft-only.png', PNG, 'image/png')
    await material('draft-uses-file', { publish: false, media: [draftOnly.id] })

    for (const [id, title] of [
      [used.id, 'Lifecycle uses-file'],
      [draftOnly.id, 'Lifecycle draft-uses-file'],
    ] as const) {
      const r = await refusal(
        payload.delete({
          collection: 'learning-media',
          id,
          user: superAdmin,
          overrideAccess: false,
        }),
      )
      expect(r.status).toBe(409)
      expect(r.message).toContain(title)
    }
    const stillThere = await payload.findByID({ collection: 'learning-media', id: used.id })
    expect(existsSync(path.join(LEARNING_MEDIA_DIR, stillThere.filename!))).toBe(true)
  })

  it('once the material is deleted the file can go', async () => {
    const f = await upload('freed.pdf')
    const m = await material('frees-file', { media: [f.id] })
    await payload.delete({
      collection: 'study-materials',
      id: m.id,
      user: superAdmin,
      overrideAccess: false,
    })
    await payload.delete({
      collection: 'learning-media',
      id: f.id,
      user: superAdmin,
      overrideAccess: false,
    })
    const gone = await payload.find({
      collection: 'learning-media',
      where: { id: { equals: f.id } },
    })
    expect(gone.totalDocs).toBe(0)
  })

  it('deleting needs media.delete (Content Editors do not have it by default)', async () => {
    const f = await upload('protected.pdf')
    const r = await refusal(
      payload.delete({
        collection: 'learning-media',
        id: f.id,
        user: editor,
        overrideAccess: false,
      }),
    )
    expect(r.status).toBe(403)
  })

  it('an archived file is hidden from the picker but stays attached where it is used', async () => {
    const f = await upload('archived.pdf')
    const m = await material('keeps-archived', { media: [f.id] })
    await payload.update({
      collection: 'learning-media',
      id: f.id,
      data: { archived: true },
      user: editor,
      overrideAccess: false,
    })
    // Re-saving the material that already uses it still works…
    const resaved = await payload.update({
      collection: 'study-materials',
      id: m.id,
      data: { summary: 'Still has its file' },
      user: editor,
      overrideAccess: false,
    })
    expect(resaved.attachments).toHaveLength(1)
    // …but a new material cannot pick it.
    const r = await refusal(material('picks-archived', { media: [f.id] }))
    expect(r.status).toBe(400)
  })
})

describe('deleting study materials and categories (KI-40)', () => {
  it('a Super Admin deletes a material (its versions go too); a Content Editor cannot', async () => {
    const m = await material('to-delete')
    const r = await refusal(
      payload.delete({
        collection: 'study-materials',
        id: m.id,
        user: editor,
        overrideAccess: false,
      }),
    )
    expect(r.status).toBe(403)
    await payload.delete({
      collection: 'study-materials',
      id: m.id,
      user: superAdmin,
      overrideAccess: false,
    })
    const versions = await payload.findVersions({
      collection: 'study-materials',
      where: { parent: { equals: m.id } },
    })
    expect(versions.totalDocs).toBe(0)
    const audit = await payload.find({
      collection: 'audit-events',
      where: {
        and: [
          { action: { equals: 'study_material.deleted' } },
          { entityId: { equals: String(m.id) } },
        ],
      },
    })
    expect(audit.totalDocs).toBe(1)
  })

  it('a category in use is refused with the materials named; an empty one is deleted', async () => {
    const cat = await payload.create({
      collection: 'material-categories',
      data: { key: `lc${run}`, name: 'Lifecycle category', order: 99, enabled: true },
      user: editor,
      overrideAccess: false,
    })
    const m = await material('in-category', { category: cat.id, publish: false })
    const r = await refusal(
      payload.delete({
        collection: 'material-categories',
        id: cat.id,
        user: superAdmin,
        overrideAccess: false,
      }),
    )
    expect(r.status).toBe(409)
    expect(r.message).toContain('Lifecycle in-category')

    await payload.delete({
      collection: 'study-materials',
      id: m.id,
      user: superAdmin,
      overrideAccess: false,
    })
    await payload.delete({
      collection: 'material-categories',
      id: cat.id,
      user: superAdmin,
      overrideAccess: false,
    })
    const gone = await payload.find({
      collection: 'material-categories',
      where: { id: { equals: cat.id } },
    })
    expect(gone.totalDocs).toBe(0)
  })
})

describe('deleting questions (D-092)', () => {
  it('a question that was never published can be deleted', async () => {
    const q = await question(`【テスト】${run} draft`, false)
    await payload.delete({
      collection: 'questions',
      id: q.id,
      user: superAdmin,
      overrideAccess: false,
    })
    const gone = await payload.find({ collection: 'questions', where: { id: { equals: q.id } } })
    expect(gone.totalDocs).toBe(0)
  })

  it('a question that has ever been published is archive-only', async () => {
    const q = await question(`【テスト】${run} was live`, true)
    // Even after going back to draft, its published history stays.
    await payload.update({
      collection: 'questions',
      id: q.id,
      data: { _status: 'draft' },
      user: editor,
      overrideAccess: false,
    })
    const r = await refusal(
      payload.delete({
        collection: 'questions',
        id: q.id,
        user: superAdmin,
        overrideAccess: false,
      }),
    )
    expect(r.status).toBe(409)
  })
})
