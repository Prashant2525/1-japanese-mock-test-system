import { expect, test } from '@playwright/test'

import { E2E_ADMIN_EMAIL, E2E_EDITOR_EMAIL } from './admin-account'
import { adminLogin } from './admin-login'
import { fixture } from './fixture'
import { createConfirmedStudent, setStudentLevel, uiEmail, uiPassword } from './ui/helpers'

/** Phase 11 in the admin panel: level-check settings and the student's reset action (D-013). */
test.describe('level check in the admin panel', () => {
  test("a Super Admin resets a student's level check from the student record", async ({ page }) => {
    const email = uiEmail('reset')
    createConfirmedStudent(email, uiPassword())
    setStudentLevel(email, 'N4')
    const { admin } = fixture()
    await adminLogin(page, E2E_ADMIN_EMAIL, admin.pw, admin.totp)

    await page.goto('/admin/collections/students')
    await page.locator('#search-filter-input').fill(email)
    await page.locator('tbody tr', { hasText: email }).locator('a').first().click()
    await page.waitForURL(/\/admin\/collections\/students\/\d+/)

    const panel = page.locator('.nm-level-actions')
    await panel.getByRole('button', { name: 'Reset level check' }).click()
    await panel.getByRole('button', { name: 'Confirm' }).click()
    await expect(panel.getByRole('alert')).toContainText('at least 5 characters')
    await panel.locator('textarea').fill('Student asked to retake the level check')
    await panel.getByRole('button', { name: 'Confirm' }).click()
    await expect(panel.getByRole('status')).toHaveText('Done.')

    await page.reload()
    await expect(page.getByText('Not started').first()).toBeVisible()
  })

  test('the level check settings show the published stages; an editor cannot publish', async ({
    page,
  }) => {
    const { editor } = fixture()
    await adminLogin(page, E2E_EDITOR_EMAIL, editor.pw, editor.totp)
    await page.goto('/admin/globals/level-check-settings')
    await expect(page.getByText('Stage 01')).toBeVisible()
    await expect(page.getByText('Pass mark (%)').first()).toBeVisible()
    // Publishing needs determination.publish, which the Content Editor role does not have.
    const status = await page.evaluate(async () => {
      const res = await fetch('/api/cms/globals/level-check-settings', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ _status: 'published' }),
      })
      return res.status
    })
    expect(status).toBe(403)
  })
})
