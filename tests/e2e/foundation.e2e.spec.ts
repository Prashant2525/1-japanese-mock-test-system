import { expect, test } from '@playwright/test'

import { E2E_ADMIN_EMAIL } from './admin-account'

test.describe('platform endpoints', () => {
  test('liveness responds with request ID and baseline security headers', async ({ request }) => {
    const res = await request.get('/healthz')
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
    const headers = res.headers()
    expect(headers['x-request-id']).toMatch(/^req_/)
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['x-powered-by']).toBeUndefined()
  })

  test('readiness confirms database and migrations', async ({ request }) => {
    const res = await request.get('/readyz')
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({
      status: 'ready',
      checks: { database: 'ok', migrations: 'ok' },
    })
  })

  test('home page renders', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: 'Nihongo Mock' })).toBeVisible()
  })
})

test.describe('CMS API is closed by default', () => {
  test('anonymous requests cannot list admins', async ({ request }) => {
    const res = await request.get('/api/cms/admins')
    expect(res.status()).toBe(403)
  })

  test('GraphQL is disabled', async ({ request }) => {
    const res = await request.post('/api/cms/graphql', { data: { query: '{ __typename }' } })
    expect(res.status()).toBe(404)
  })
})

test.describe('admin panel', () => {
  test('redirects anonymous visitors to login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('rejects a wrong password', async ({ page }) => {
    await page.goto('/admin/login')
    await page.fill('#field-email', E2E_ADMIN_EMAIL)
    await page.fill('#field-password', 'definitely-not-the-password')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin\/login/)
    await expect(page.locator('span[title="Dashboard"]')).toHaveCount(0)
  })

  test('lets an admin log in and see the dashboard', async ({ page }) => {
    const password = process.env.E2E_ADMIN_PASSWORD
    expect(password, 'global setup must create the E2E admin').toBeTruthy()
    await page.goto('/admin/login')
    await page.fill('#field-email', E2E_ADMIN_EMAIL)
    await page.fill('#field-password', password!)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin$/)
    await expect(page.locator('span[title="Dashboard"]').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Admins' }).first()).toBeVisible()
  })
})
