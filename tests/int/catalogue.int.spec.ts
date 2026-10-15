import type { Payload } from 'payload'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  ActivityWidget,
  CatalogueWidget,
  SetupWidget,
  StudentsWidget,
} from '@/payload/admin/widgets'
import type { Level } from '@/payload-types'

import { asUser, client, createAdmin } from './helpers'

/**
 * Phase 9 representative module: the exam catalogue, end to end through Payload's access rules,
 * validation hooks, database and audit log (the same path the admin panel and REST API use).
 */
let payload: Payload
let editor: Awaited<ReturnType<typeof asUser>>
let support: Awaited<ReturnType<typeof asUser>>
let superAdmin: Awaited<ReturnType<typeof asUser>>
const levelIds = new Map<string, number>()
const typeIds = new Map<string, number>()
const created: number[] = []

beforeAll(async () => {
  payload = await client()
  editor = await asUser((await createAdmin('Content Editor')).admin)
  support = await asUser((await createAdmin('Support')).admin)
  superAdmin = await asUser((await createAdmin('Super Admin')).admin)
  const types = await payload.find({ collection: 'exam-types', limit: 10, depth: 0 })
  for (const t of types.docs) typeIds.set(t.code, t.id)
  const levels = await payload.find({ collection: 'levels', pagination: false, depth: 1 })
  for (const l of levels.docs) {
    const exam = typeof l.examType === 'object' ? l.examType.code : ''
    levelIds.set(`${exam}:${l.code}`, l.id)
  }
})

/** Puts the seeded JLPT switches back and removes levels a test created. */
afterEach(async () => {
  for (const id of created.splice(0)) {
    await payload.delete({ collection: 'levels', id, overrideAccess: true })
  }
  for (const [code, on] of [
    ['N5', true],
    ['N4', true],
    ['N3', true],
    ['N2', false],
    ['N1', false],
  ] as const) {
    await payload.db.updateOne({
      collection: 'levels',
      id: levelIds.get(`JLPT:${code}`)!,
      data: { enabledForDetermination: on },
      returning: false,
    })
  }
})

const id = (key: string) => levelIds.get(key)!

/** The field paths of a rejected save. */
async function rejectedPaths(action: Promise<unknown>): Promise<string[]> {
  try {
    await action
  } catch (err) {
    const errors = (err as { data?: { errors?: { path: string }[] } }).data?.errors ?? []
    return errors.map((e) => e.path)
  }
  throw new Error('expected the save to be rejected')
}

function asEditor<T extends object>(args: T) {
  return { ...args, user: editor, overrideAccess: false }
}

describe('seeded catalogue (D-014)', () => {
  it('has JLPT, NAT and JFT in order with 14 levels', async () => {
    const types = await payload.find({ collection: 'exam-types', sort: 'order', depth: 0 })
    expect(types.docs.map((t) => t.code)).toEqual(['JLPT', 'NAT', 'JFT'])
    expect(levelIds.size).toBe(14)
  })

  it('maps NAT levels to JLPT and stores both languages', async () => {
    const q5 = await payload.findByID({ collection: 'levels', id: id('NAT:5Q'), depth: 1 })
    expect((q5.equivalentJlpt as Level).code).toBe('N5')
    const ja = await payload.findByID({
      collection: 'levels',
      id: id('NAT:5Q'),
      locale: 'ja',
      depth: 0,
    })
    expect(ja.name).toBe('5級')
  })
})

describe('list behaviour: pagination, sort, search', () => {
  it('pages through levels in display order', async () => {
    const page2 = await payload.find({
      collection: 'levels',
      where: { examType: { equals: typeIds.get('JLPT') } },
      sort: 'order',
      limit: 2,
      page: 2,
      depth: 0,
      user: support,
      overrideAccess: false,
    })
    expect(page2.totalDocs).toBe(5)
    expect(page2.totalPages).toBe(3)
    expect(page2.docs.map((l) => l.code)).toEqual(['N3', 'N2'])
  })

  it('finds levels by code, the way the admin search box does', async () => {
    const found = await payload.find({
      collection: 'levels',
      where: { or: [{ code: { like: 'Q' } }, { name: { like: 'Q' } }] },
      limit: 50,
      depth: 0,
    })
    expect(found.docs.map((l) => l.code).sort()).toEqual(['1Q', '2Q', '3Q', '4Q', '5Q'])
  })
})

describe('permissions are enforced on the server', () => {
  it('a Content Editor can create and edit levels; the change persists in both languages', async () => {
    const level = await payload.create(
      asEditor({
        collection: 'levels' as const,
        locale: 'en' as const,
        data: {
          examType: typeIds.get('JFT')!,
          code: 'B1',
          order: 9,
          name: 'B1 (trial)',
          lineColor: '#2B6BD8',
          badgeColor: '#1F56B8',
          enabledForMockTests: false,
        },
      }),
    )
    created.push(level.id)
    await payload.update(
      asEditor({
        collection: 'levels' as const,
        id: level.id,
        locale: 'ja' as const,
        data: { name: 'B1（試行）' },
      }),
    )
    const en = await payload.findByID({ collection: 'levels', id: level.id, locale: 'en' })
    const ja = await payload.findByID({ collection: 'levels', id: level.id, locale: 'ja' })
    expect([en.name, ja.name]).toEqual(['B1 (trial)', 'B1（試行）'])
  })

  it('Support can read but not create or change', async () => {
    const read = await payload.find({
      collection: 'levels',
      limit: 1,
      user: support,
      overrideAccess: false,
    })
    expect(read.docs).toHaveLength(1)
    await expect(
      payload.update({
        collection: 'levels',
        id: id('JLPT:N2'),
        data: { enabledForMockTests: false },
        user: support,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      payload.create({
        collection: 'exam-types',
        data: { code: 'XYZ', name: 'X', order: 9 },
        user: support,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('visitors and students cannot read the catalogue through the CMS API', async () => {
    await expect(
      payload.find({ collection: 'levels', overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('nobody can delete a level or an exam type, not even a Super Admin', async () => {
    await expect(
      payload.delete({
        collection: 'levels',
        id: id('JFT:A1'),
        user: superAdmin,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      payload.delete({
        collection: 'exam-types',
        id: typeIds.get('JFT')!,
        user: superAdmin,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('the database itself refuses to delete an exam type that has levels', async () => {
    await expect(
      payload.delete({ collection: 'exam-types', id: typeIds.get('JFT')!, overrideAccess: true }),
    ).rejects.toThrow()
    expect(
      (await payload.find({ collection: 'levels', where: { code: { equals: 'A1' } } })).totalDocs,
    ).toBe(1)
  })
})

describe('validation', () => {
  const newLevel = (examType: string, extra: Record<string, unknown> = {}) =>
    payload
      .create(
        asEditor({
          collection: 'levels' as const,
          data: {
            examType: typeIds.get(examType)!,
            code: 'Z9',
            order: 20,
            name: 'Z9',
            lineColor: '#2B6BD8',
            badgeColor: '#1F56B8',
            ...extra,
          },
        }),
      )
      .then((doc) => {
        created.push(doc.id)
        return doc
      })

  it('one code per exam type, but the same code may exist in another exam type', async () => {
    expect(await rejectedPaths(newLevel('JLPT', { code: 'N5' }))).toEqual(['code'])
    await expect(newLevel('JFT', { code: 'N5' })).resolves.toMatchObject({ code: 'N5' })
  })

  it('rejects malformed codes and colours with a message per field', async () => {
    expect(await rejectedPaths(newLevel('JFT', { code: 'has space' }))).toContain('code')
    expect(await rejectedPaths(newLevel('JFT', { lineColor: 'blue' }))).toContain('lineColor')
    expect(await rejectedPaths(newLevel('JFT', { badgeColor: '#FFD166' }))).toContain('badgeColor')
  })

  it('the level check and study library use JLPT levels only', async () => {
    const paths = await rejectedPaths(
      payload.update(
        asEditor({
          collection: 'levels' as const,
          id: id('NAT:5Q'),
          data: { enabledForDetermination: true, enabledForStudy: true },
        }),
      ),
    )
    expect(paths.sort()).toEqual(['enabledForDetermination', 'enabledForStudy'])
  })

  it('an equivalent level must be a JLPT level, and JLPT levels have none', async () => {
    expect(
      await rejectedPaths(
        payload.update(
          asEditor({
            collection: 'levels' as const,
            id: id('NAT:4Q'),
            data: { equivalentJlpt: id('NAT:5Q') },
          }),
        ),
      ),
    ).toEqual(['equivalentJlpt'])
    expect(
      await rejectedPaths(
        payload.update(
          asEditor({
            collection: 'levels' as const,
            id: id('JLPT:N4'),
            data: { equivalentJlpt: id('JLPT:N5') },
          }),
        ),
      ),
    ).toEqual(['equivalentJlpt'])
  })

  describe('the level check starts at N5 and climbs without gaps (D-008)', () => {
    const setLevelCheck = (code: string, on: boolean) =>
      payload.update(
        asEditor({
          collection: 'levels' as const,
          id: id(`JLPT:${code}`),
          data: { enabledForDetermination: on },
        }),
      )

    it('N5 cannot be switched off', async () => {
      expect(await rejectedPaths(setLevelCheck('N5', false))).toEqual(['enabledForDetermination'])
    })

    it('N4 cannot be switched off while N3 is on', async () => {
      expect(await rejectedPaths(setLevelCheck('N4', false))).toEqual(['enabledForDetermination'])
    })

    it('N1 cannot be switched on before N2', async () => {
      expect(await rejectedPaths(setLevelCheck('N1', true))).toEqual(['enabledForDetermination'])
    })

    it('extending to N2, then N1, and shrinking back from the top works', async () => {
      await setLevelCheck('N2', true)
      await setLevelCheck('N1', true)
      await setLevelCheck('N1', false)
      await setLevelCheck('N2', false)
      await setLevelCheck('N3', false)
      const n3 = await payload.findByID({ collection: 'levels', id: id('JLPT:N3') })
      expect(n3.enabledForDetermination).toBe(false)
    })

    it('reordering cannot create a gap either', async () => {
      // Moving N2 (off) below N3 (on) would leave N3 above a switched-off level.
      expect(
        await rejectedPaths(
          payload.update(
            asEditor({ collection: 'levels' as const, id: id('JLPT:N2'), data: { order: 2.5 } }),
          ),
        ),
      ).toEqual(['enabledForDetermination'])
    })
  })

  it('an exam type code cannot be changed after creation', async () => {
    const updated = await payload.update(
      asEditor({
        collection: 'exam-types' as const,
        id: typeIds.get('NAT')!,
        data: { code: 'NATX' },
      }),
    )
    expect(updated.code).toBe('NAT')
  })
})

describe('audit trail', () => {
  it('records who changed which fields, with old and new values', async () => {
    await payload.update(
      asEditor({
        collection: 'levels' as const,
        id: id('JLPT:N2'),
        data: { badgeColor: '#5B37A0' },
      }),
    )
    await payload.update(
      asEditor({
        collection: 'levels' as const,
        id: id('JLPT:N2'),
        data: { badgeColor: '#6A42B5' },
      }),
    )
    const events = await payload.find({
      collection: 'audit-events',
      where: {
        and: [
          { action: { equals: 'level.updated' } },
          { entityId: { equals: String(id('JLPT:N2')) } },
        ],
      },
      sort: '-createdAt',
      limit: 2,
    })
    expect(events.docs[1]).toMatchObject({
      actorType: 'admin',
      actorId: String(editor.id),
      before: { badgeColor: '#6A42B5' },
      after: { badgeColor: '#5B37A0' },
    })
    expect(events.docs[1]?.summary).toBe('N2 [en]')
  })

  it('does not record saves that change nothing', async () => {
    const count = async () =>
      (
        await payload.count({
          collection: 'audit-events',
          where: { entityId: { equals: String(id('JLPT:N1')) } },
        })
      ).totalDocs
    const before = await count()
    await payload.update(
      asEditor({ collection: 'levels' as const, id: id('JLPT:N1'), data: { code: 'N1' } }),
    )
    expect(await count()).toBe(before)
  })
})

describe('dashboard widgets show real data to the right people', () => {
  const reqFor = (user: unknown, language = 'en') =>
    ({ payload, user, i18n: { language } }) as never

  it('the students widget counts from the database', async () => {
    const total = (await payload.count({ collection: 'students' })).totalDocs
    const html = renderToStaticMarkup(await StudentsWidget({ req: reqFor(support) }))
    expect(html).toContain(`<span class="nm-stat__value">${total}</span>`)
  })

  it('the catalogue widget draws the level-check route from the CMS switches', async () => {
    const html = renderToStaticMarkup(await CatalogueWidget({ req: reqFor(editor, 'ja') }))
    expect(html).toContain('レベルチェックの順路')
    expect(html.match(/nm-route__stop/g)).toHaveLength(3)
    expect(html).toMatch(/N5[\s\S]*N4[\s\S]*N3/)
  })

  it('widgets refuse people without the permission', async () => {
    const html = renderToStaticMarkup(await CatalogueWidget({ req: reqFor(support) }))
    expect(html).toContain('You do not have access')
    expect(html).not.toContain('nm-route')
    expect(renderToStaticMarkup(await ActivityWidget({ req: reqFor(editor) }))).toContain(
      'You do not have access',
    )
  })

  it('the setup checklist shows states, never secret values', async () => {
    const html = renderToStaticMarkup(await SetupWidget({ req: reqFor(superAdmin) }))
    expect(html).toContain('Email delivery')
    expect(html).toContain('Required for every admin.')
    expect(html).not.toContain(process.env.GOOGLE_CLIENT_SECRET!)
    expect(html).not.toContain(process.env.PAYLOAD_SECRET!)
  })

  it('the activity widget lists recent audit events with the admin’s name', async () => {
    const html = renderToStaticMarkup(await ActivityWidget({ req: reqFor(superAdmin) }))
    expect(html).toContain('<code>')
  })
})
