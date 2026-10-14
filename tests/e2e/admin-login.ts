import { expect, type Page } from '@playwright/test'
import { Secret, TOTP } from 'otpauth'

/** Same settings as the payload-totp plugin config (src/payload.config.ts). */
export function totpCode(secretBase32: string): string {
  return new TOTP({
    issuer: 'Nihongo Mock',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  }).generate()
}

/**
 * Enters a code the way a phone's one-time-code autofill does: into the plugin's hidden
 * `autocomplete="one-time-code"` input, which spreads it over the six boxes and submits the form.
 * Waits for the page to settle first so React has attached its handlers.
 */
export async function enterCode(page: Page, code: string): Promise<void> {
  await page.waitForLoadState('networkidle')
  const autofill = page.locator('form input[autocomplete="one-time-code"]')
  await autofill.waitFor({ state: 'attached' })
  await autofill.fill(code, { force: true })
}

export async function submitPassword(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/admin/login')
  await page.fill('#field-email', email)
  await page.fill('#field-password', password)
  await page.click('button[type="submit"]')
}

/** Full admin login for an enrolled admin: password, then authenticator code. */
export async function adminLogin(
  page: Page,
  email: string,
  password: string,
  secret: string,
): Promise<void> {
  await submitPassword(page, email, password)
  await page.waitForURL(/\/admin\/verify-totp/)
  await enterCode(page, totpCode(secret))
  await page.waitForURL(/\/admin\/?(\?.*)?$/)
  await expect(page.locator('span[title="Dashboard"]').first()).toBeVisible()
}
