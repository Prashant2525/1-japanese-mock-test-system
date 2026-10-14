import { expect, test, type Page } from '@playwright/test'

import { E2E_ADMIN_EMAIL, E2E_EDITOR_EMAIL, E2E_STUDENT_EMAIL } from './admin-account'

/** Calls the API from inside the page, exactly as the site's own code will (real browser fetch). */
async function browserFetch(
  page: Page,
  path: string,
  init: { method?: string; body?: unknown } = {},
) {
  return page.evaluate(
    async ({ path, init }) => {
      const res = await fetch(path, {
        method: init.method ?? 'GET',
        headers: init.body === undefined ? undefined : { 'content-type': 'application/json' },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        credentials: 'same-origin',
      })
      const text = await res.text()
      return { status: res.status, body: text ? JSON.parse(text) : null }
    },
    { path, init },
  )
}

test.describe('Payload student endpoints are closed (only /api/v1/auth is allowed)', () => {
  for (const path of [
    '/api/cms/students/login',
    '/api/cms/students/forgot-password',
    '/api/cms/students',
  ]) {
    test(`POST ${path} → 404`, async ({ request }) => {
      const res = await request.post(path, { data: { email: E2E_STUDENT_EMAIL, password: 'x' } })
      expect(res.status()).toBe(404)
    })
  }

  test('anonymous visitors cannot list students', async ({ request }) => {
    expect((await request.get('/api/cms/students')).status()).toBe(403)
  })
})

test.describe('student session in a real browser', () => {
  test('logs in with an HTTP-only cookie, reads /me, and logs out', async ({ page, context }) => {
    await page.goto('/')
    const login = await browserFetch(page, '/api/v1/auth/login', {
      method: 'POST',
      body: { email: E2E_STUDENT_EMAIL, password: process.env.E2E_STUDENT_PASSWORD },
    })
    expect(login.status).toBe(200)
    expect(login.body.student.email).toBe(E2E_STUDENT_EMAIL)

    const cookie = (await context.cookies()).find((c) => c.name === 'payload-token')
    expect(cookie?.httpOnly).toBe(true)
    expect(cookie?.sameSite).toBe('Lax')
    // JavaScript on the page cannot read the session cookie.
    expect(await page.evaluate(() => document.cookie)).not.toContain('payload-token')

    const me = await browserFetch(page, '/api/v1/me')
    expect(me.status).toBe(200)
    expect(me.body.student.determinationStatus).toBe('not_started')

    const logout = await browserFetch(page, '/api/v1/auth/logout', { method: 'POST', body: {} })
    expect(logout.status).toBe(204)
    expect((await browserFetch(page, '/api/v1/me')).status).toBe(401)
  })

  test('rejects a cross-site login attempt', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      headers: { origin: 'https://evil.example' },
      data: { email: E2E_STUDENT_EMAIL, password: process.env.E2E_STUDENT_PASSWORD },
    })
    expect(res.status()).toBe(403)
  })
})

async function adminLogin(page: Page, email: string, password: string) {
  await page.goto('/admin/login')
  await page.fill('#field-email', email)
  await page.fill('#field-password', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin$/)
}

test.describe('admin roles shape the admin panel', () => {
  test('a Super Admin sees roles, the audit log and email templates', async ({ page }) => {
    await adminLogin(page, E2E_ADMIN_EMAIL, process.env.E2E_ADMIN_PASSWORD!)
    const nav = page.locator('nav')
    for (const label of ['Roles', 'Audit log', 'Email templates', 'Students']) {
      await expect(nav.getByRole('link', { name: label, exact: true }).first()).toBeVisible()
    }
  })

  test('a Content Editor does not see the audit log or email templates', async ({ page }) => {
    await adminLogin(page, E2E_EDITOR_EMAIL, process.env.E2E_EDITOR_PASSWORD!)
    const nav = page.locator('nav')
    await expect(nav.getByRole('link', { name: 'Students', exact: true }).first()).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Audit log', exact: true })).toHaveCount(0)
    await expect(nav.getByRole('link', { name: 'Email templates', exact: true })).toHaveCount(0)
  })
})
