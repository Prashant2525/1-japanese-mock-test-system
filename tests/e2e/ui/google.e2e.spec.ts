import { expect, test } from '@playwright/test'

import { expectAccessible, open, setGoogleSignIn } from './helpers'

/**
 * "Continue with Google" up to Google's door. Google's own pages are never loaded in tests: the
 * redirect to Google is captured and replaced with a local page (Playwright cannot intercept the
 * second hop of a redirect in Chromium). The return leg (code exchange, linking, session) is
 * covered by tests/int/google-auth.int.spec.ts.
 */
test.describe('Continue with Google', () => {
  test('the login button sends the visitor to Google with this site as the return address', async ({
    page,
  }) => {
    let redirect: { status: number; location: string; setCookie: string } | undefined
    await page.route('**/api/v1/auth/google?**', async (route) => {
      const response = await route.fetch({ maxRedirects: 0 })
      redirect = {
        status: response.status(),
        location: response.headers()['location'] ?? '',
        setCookie: response.headers()['set-cookie'] ?? '',
      }
      await route.fulfill({ contentType: 'text/html', body: '<title>Google (stub)</title>' })
    })

    await open(page, '/en/login?next=/en/app/results')
    const button = page.getByRole('link', { name: 'Continue with Google' })
    await expect(button).toBeVisible()
    await expect(page.getByRole('separator', { name: 'or' })).toBeVisible()
    await button.click()
    await expect(page).toHaveTitle('Google (stub)')

    expect(redirect?.status).toBe(303)
    const target = new URL(redirect!.location)
    expect(target.origin).toBe('https://accounts.google.com')
    const q = target.searchParams
    expect(q.get('client_id')).toBe('e2e-test.apps.googleusercontent.com')
    expect(q.get('redirect_uri')).toBe('http://localhost:3100/api/v1/auth/google/callback')
    expect(q.get('code_challenge_method')).toBe('S256')
    expect(q.get('hl')).toBe('en')
    // The attempt is remembered in an HTTP-only cookie scoped to the Google routes.
    expect(redirect!.setCookie).toMatch(/^nm_google_flow=[^;]+; Path=\/api\/v1\/auth\/google;/)
    expect(redirect!.setCookie).toContain('HttpOnly')
  })

  test('sign-up offers Google first, in Japanese', async ({ page }) => {
    await open(page, '/ja/signup')
    await expect(page.getByRole('link', { name: 'Google で続ける' })).toBeVisible()
    await expect(page.getByRole('separator', { name: 'または' })).toBeVisible()
    await expectAccessible(page)
  })

  test('explains what happened when the visitor comes back without signing in', async ({
    page,
  }) => {
    await open(page, '/en/login?oauth=cancelled')
    await expect(page.getByRole('main').getByRole('status')).toContainText(
      'Google sign-in was cancelled',
    )
    await open(page, '/ja/login?oauth=failed')
    await expect(page.getByRole('main').getByRole('alert')).toContainText(
      'Google でログインできませんでした',
    )
  })

  test('a stale return from Google lands on the login page with a message', async ({ page }) => {
    await open(page, '/api/v1/auth/google/callback?state=stale&code=x')
    await expect(page).toHaveURL(/\/en\/login\?oauth=expired$/)
    await expect(page.getByRole('main').getByRole('alert')).toContainText('took too long')
  })

  test('switching it off in the CMS hides the button at once (pages are not frozen at build time)', async ({
    page,
  }) => {
    setGoogleSignIn('off')
    try {
      await open(page, '/en/login')
      await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Continue with Google' })).toHaveCount(0)
      await open(page, '/api/v1/auth/google?locale=en')
      await expect(page).toHaveURL(/\/en\/login\?oauth=unavailable$/)
    } finally {
      setGoogleSignIn('on')
    }
    await open(page, '/en/login')
    await expect(page.getByRole('link', { name: 'Continue with Google' })).toBeVisible()
  })
})
