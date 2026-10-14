import { expect, test, type Page } from '@playwright/test'

import { E2E_ADMIN_EMAIL, E2E_NEW_ADMIN_EMAIL } from './admin-account'
import { enterCode, submitPassword, totpCode } from './admin-login'

/** Status of an admin API call made from inside the page (real browser cookies). */
async function apiStatus(page: Page, path: string): Promise<number> {
  return page.evaluate(async (p) => (await fetch(p, { credentials: 'same-origin' })).status, path)
}

test.describe('admin two-factor login (D-058)', () => {
  test('a password alone is not enough: the admin API stays closed until the code is entered', async ({
    page,
  }) => {
    await submitPassword(page, E2E_ADMIN_EMAIL, process.env.E2E_ADMIN_PASSWORD!)
    await page.waitForURL(/\/admin\/verify-totp/)
    expect(await apiStatus(page, '/api/cms/students')).toBe(403)

    await enterCode(page, totpCode(process.env.E2E_ADMIN_TOTP!))
    await page.waitForURL(/\/admin\/?(\?.*)?$/)
    await expect(page.locator('span[title="Dashboard"]').first()).toBeVisible()
    expect(await apiStatus(page, '/api/cms/students')).toBe(200)
  })

  test('a wrong code is rejected and the admin stays on the code page', async ({ page }) => {
    await submitPassword(page, E2E_ADMIN_EMAIL, process.env.E2E_ADMIN_PASSWORD!)
    await page.waitForURL(/\/admin\/verify-totp/)
    const right = totpCode(process.env.E2E_ADMIN_TOTP!)
    const wrong = right === '000000' ? '111111' : '000000'
    await enterCode(page, wrong)
    await page.waitForTimeout(1500)
    await expect(page).toHaveURL(/\/admin\/verify-totp/)
    expect(await apiStatus(page, '/api/cms/students')).toBe(403)
  })

  test('a new admin must set up an authenticator before using the panel', async ({ page }) => {
    await submitPassword(page, E2E_NEW_ADMIN_EMAIL, process.env.E2E_NEW_ADMIN_PASSWORD!)
    await page.waitForURL(/\/admin\/setup-totp/)
    expect(await apiStatus(page, '/api/cms/students')).toBe(403)

    const secret = await page.locator('input[name="secret"]').inputValue()
    expect(secret).toMatch(/^[A-Z2-7]{16,}$/)
    await enterCode(page, totpCode(secret))
    await page.waitForURL(/\/admin\/?(\?.*)?$/)
    await expect(page.locator('span[title="Dashboard"]').first()).toBeVisible()
    // Support role: can read students now that the code is set up and entered.
    expect(await apiStatus(page, '/api/cms/students')).toBe(200)
  })
})
