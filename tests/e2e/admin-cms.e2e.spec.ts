import { expect, test, type Page } from '@playwright/test'

import { E2E_ADMIN_EMAIL, E2E_EDITOR_EMAIL, E2E_SUPPORT_EMAIL } from './admin-account'
import { adminLogin } from './admin-login'
import { fixture } from './fixture'

/**
 * Phase 9: the admin shell (branding, role-aware navigation and dashboard) and the exam catalogue
 * module, through the real admin panel on the production build.
 */
async function apiStatus(page: Page, path: string, init?: RequestInit): Promise<number> {
  return page.evaluate(
    async ([p, i]) =>
      (await fetch(p as string, { credentials: 'same-origin', ...(i as RequestInit) })).status,
    [path, init ?? {}] as const,
  )
}

const widget = (page: Page, name: string) => page.getByRole('region', { name })
const nav = (page: Page) => page.locator('nav')

test.describe('admin panel shell and exam catalogue (Phase 9)', () => {
  test('Super Admin: branded panel, every menu group and a dashboard with real numbers', async ({
    page,
  }) => {
    const { admin } = fixture()
    await adminLogin(page, E2E_ADMIN_EMAIL, admin.pw, admin.totp)
    await expect(page).toHaveTitle(/Nihongo Mock Admin/)
    for (const group of ['People', 'Exam catalogue', 'Content', 'Operations', 'Settings']) {
      await expect(nav(page).getByText(group, { exact: true })).toBeVisible()
    }
    await expect(widget(page, 'Setup checklist')).toContainText('Required for every admin.')
    await expect(widget(page, 'Students').locator('.nm-stat__value').first()).toHaveText(/^\d+$/)
    const route = widget(page, 'Exam catalogue').getByRole('list', { name: 'Level check route' })
    await expect(route.getByRole('listitem')).toHaveText(['N5', 'N4', 'N3'])
    await expect(widget(page, 'Recent activity').locator('code').first()).toBeVisible()
  })

  test('Content Editor: lists, searches and edits levels; the server refuses a gap in the level check', async ({
    page,
  }) => {
    const { editor } = fixture()
    await adminLogin(page, E2E_EDITOR_EMAIL, editor.pw, editor.totp)
    // Role-aware: no admin, audit or settings areas for an editor.
    await expect(nav(page).getByText('Settings', { exact: true })).toHaveCount(0)
    await expect(widget(page, 'Recent activity')).toHaveCount(0)

    await page.goto('/admin/collections/levels')
    await expect(page.locator('tbody tr')).toHaveCount(14)
    await page.locator('#search-filter-input').fill('Q')
    await expect(page.locator('tbody tr')).toHaveCount(5)

    // Switch N4 off while N3 is on: refused with a clear message, nothing saved.
    await page.goto('/admin/collections/levels')
    await page.locator('tbody tr', { hasText: 'N4' }).first().locator('a').first().click()
    await page.waitForURL(/\/admin\/collections\/levels\/\d+/)
    await page.locator('#field-enabledForDetermination').uncheck()
    await page.locator('#action-save').click()
    await expect(page.getByText('turn on N4 before N3', { exact: false }).first()).toBeVisible()
    await page.reload()
    await expect(page.locator('#field-enabledForDetermination')).toBeChecked()

    // A normal edit saves, persists and can be undone.
    const name = page.locator('#field-name')
    await name.fill('N4 (edited by E2E)')
    await page.locator('#action-save').click()
    await expect(page.getByText('Updated successfully').first()).toBeVisible()
    await page.reload()
    await expect(name).toHaveValue('N4 (edited by E2E)')
    await name.fill('N4')
    await page.locator('#action-save').click()
    await expect(page.getByText('Updated successfully').first()).toBeVisible()
  })

  test('Support: read-only catalogue; edits are refused by the server, not just hidden', async ({
    page,
  }) => {
    const { support } = fixture()
    await adminLogin(page, E2E_SUPPORT_EMAIL, support.pw, support.totp)
    await expect(widget(page, 'Students')).toBeVisible()
    await expect(widget(page, 'Exam catalogue')).toHaveCount(0)
    await expect(widget(page, 'Setup checklist')).toHaveCount(0)
    await expect(nav(page).getByText('Content', { exact: true })).toHaveCount(0)

    await page.goto('/admin/collections/levels')
    await expect(page.locator('tbody tr').first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Create new/i })).toHaveCount(0)

    const id = await page.evaluate(async () => {
      const res = await fetch('/api/cms/levels?limit=1&where[code][equals]=N2', {
        credentials: 'same-origin',
      })
      return ((await res.json()) as { docs: { id: number }[] }).docs[0]!.id
    })
    expect(
      await apiStatus(page, `/api/cms/levels/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabledForMockTests: false }),
      }),
    ).toBe(403)
    expect(await apiStatus(page, `/api/cms/levels/${id}`, { method: 'DELETE' })).toBe(403)
  })

  test('visitors cannot read the catalogue through the CMS API', async ({ request }) => {
    expect((await request.get('/api/cms/levels')).status()).toBe(403)
    expect((await request.get('/api/cms/exam-types')).status()).toBe(403)
  })
})
