import { expect, test } from '@playwright/test'

import { expectNoHorizontalScroll } from './helpers'

test.describe('language routing (D-028)', () => {
  test('first-time visitors get English, never the browser language', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'ja-JP',
      extraHTTPHeaders: { 'accept-language': 'ja' },
    })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page).toHaveURL(/\/en$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await context.close()
  })

  test('the navbar switch moves to Japanese, keeps the page, and is remembered', async ({
    page,
  }) => {
    await page.goto('/en/login')
    await page.getByRole('link', { name: '日本語' }).first().click()
    await expect(page).toHaveURL(/\/ja\/login$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('ログイン')
    await page.goto('/')
    await expect(page).toHaveURL(/\/ja$/)
  })

  test('seeing the language switch does not change the remembered language (prefetch)', async ({
    page,
    context,
  }) => {
    await page.goto('/en/login')
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: '日本語' }).first().hover()
    await page.waitForTimeout(500)
    const cookie = (await context.cookies()).find((c) => c.name === 'NEXT_LOCALE')
    expect(cookie?.value).toBe('en')
    await page.goto('/')
    await expect(page).toHaveURL(/\/en$/)
  })

  test('unknown pages show a translated 404', async ({ page }) => {
    const res = await page.goto('/ja/does-not-exist')
    expect(res?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'このページは路線図にありません',
    )
  })

  test('the student area requires a session and remembers where to return', async ({ page }) => {
    await page.goto('/en/app')
    await expect(page).toHaveURL(/\/en\/login\?next=%2Fen%2Fapp$/)
  })

  test('pages fit the screen without sideways scrolling', async ({ page }) => {
    for (const path of ['/en', '/ja', '/en/login', '/ja/signup', '/en/forgot-password']) {
      await page.goto(path)
      await expectNoHorizontalScroll(page)
    }
  })
})
