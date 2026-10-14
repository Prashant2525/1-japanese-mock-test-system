import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { mergeOverrides, type Messages } from '@/i18n/labels'
import en from '@/i18n/messages/en.json'
import { getLabelOverrides, invalidateLabelOverrides } from '@/server/i18n/label-overrides'

import { asUser, client, createAdmin } from './helpers'

let payload: Payload

beforeAll(async () => {
  payload = await client()
})

afterAll(async () => {
  // Leave the test database with no overrides.
  await payload.updateGlobal({
    slug: 'labels-accounts',
    locale: 'en',
    data: { auth: { login: { title: '' } } } as never,
  })
  invalidateLabelOverrides()
})

describe('UI labels from the CMS (D-030)', () => {
  it('an override replaces the default on the website, and clearing it restores the default', async () => {
    const { admin } = await createAdmin('Content Editor')
    await payload.updateGlobal({
      slug: 'labels-accounts',
      locale: 'en',
      overrideAccess: false,
      user: await asUser(admin),
      data: { auth: { login: { title: 'Sign in to Nihongo Mock' } } } as never,
    })
    const merged = mergeOverrides(en as Messages, await getLabelOverrides('en'))
    expect((merged.auth as Messages).login).toMatchObject({
      title: 'Sign in to Nihongo Mock',
      submit: 'Log in',
    })

    await payload.updateGlobal({
      slug: 'labels-accounts',
      locale: 'en',
      data: { auth: { login: { title: '' } } } as never,
    })
    const restored = mergeOverrides(en as Messages, await getLabelOverrides('en'))
    expect(((restored.auth as Messages).login as Messages).title).toBe('Log in')
  })

  it('an English override does not leak into Japanese', async () => {
    await payload.updateGlobal({
      slug: 'labels-accounts',
      locale: 'en',
      data: { auth: { login: { title: 'English only' } } } as never,
    })
    const jaOverrides = (await getLabelOverrides('ja')) as {
      auth?: { login?: { title?: string | null } }
    }
    expect(jaOverrides.auth?.login?.title ?? null).toBeNull()
  })

  it('saving records an audit event', async () => {
    const events = await payload.find({
      collection: 'audit-events',
      where: { action: { equals: 'ui_labels.updated' } },
    })
    expect(events.totalDocs).toBeGreaterThan(0)
  })

  it('only admins with content.manage can edit labels', async () => {
    const { admin } = await createAdmin('Support')
    await expect(
      payload.updateGlobal({
        slug: 'labels-site',
        overrideAccess: false,
        user: await asUser(admin),
        data: { nav: { login: 'x' } } as never,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })
})
