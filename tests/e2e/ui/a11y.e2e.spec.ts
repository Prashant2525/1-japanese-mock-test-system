import { expect, test } from '@playwright/test'

import { expectAccessible } from './helpers'

const PAGES = [
  '/en',
  '/ja',
  '/en/login',
  '/ja/login',
  '/en/signup',
  '/ja/signup',
  '/en/forgot-password',
  '/en/reset-password',
  '/en/check-email',
  '/en/verify-email',
  '/ja/does-not-exist',
]

test.describe('accessibility (WCAG 2.2 AA, axe)', () => {
  for (const path of PAGES) {
    test(`${path} has no serious or critical violations`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expectAccessible(page)
    })
  }

  test('form errors are announced and linked to their fields', async ({ page }) => {
    await page.goto('/en/signup')
    await page.getByRole('button', { name: 'Create account' }).click()
    const email = page.getByLabel('Email')
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    const describedBy = await email.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    await expect(page.locator(`[id="${describedBy}"]`)).toHaveText('This field is required.')
  })

  test('the skip link moves focus to the main content', async ({ page, isMobile }) => {
    test.skip(
      isMobile,
      'Phones have no Tab key; Safari on iOS does not move focus with Tab by default.',
    )
    await page.goto('/en/login')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Skip to main content' })
    await expect(skip).toBeFocused()
    await skip.press('Enter')
    await expect(page).toHaveURL(/#main$/)
  })

  test('with reduced motion, entrance animations are switched off', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/en')
    const animation = await page
      .locator('.nm-reveal')
      .first()
      .evaluate((el) => getComputedStyle(el).animationName)
    expect(animation).toBe('none')
    await context.close()
  })
})
