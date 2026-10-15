import { expect, test } from '@playwright/test'

import { E2E_ADMIN_EMAIL, E2E_STUDENT_EMAIL } from './admin-account'
import { adminLogin } from './admin-login'
import { fixture } from './fixture'

/**
 * Student and admin sessions never mix (owner report, KI-32, D-077). Before the fix a student who
 * opened /admin was asked to set up an authenticator for the student account.
 */
async function studentLogin(page: import('@playwright/test').Page) {
  await page.goto('/en/login')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Email').fill(E2E_STUDENT_EMAIL)
  await page.getByLabel('Password', { exact: true }).fill(fixture().student.pw)
  await page.getByRole('button', { name: 'Log in' }).click()
  await page.waitForURL(/\/en\/app\/level-check$/)
}

test.describe('separate student and admin sessions', () => {
  test('a signed-in student who opens /admin gets the admin login, not an authenticator setup', async ({
    page,
    context,
  }) => {
    await studentLogin(page)
    const names = (await context.cookies()).map((c) => c.name)
    expect(names).toContain('nm_student_session')
    expect(names).not.toContain('payload-token')

    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)
    await expect(page.locator('#field-email')).toBeVisible()
    await expect(page.getByText(/authenticator|QR/i)).toHaveCount(0)
  })

  test('an admin and a student can be signed in in the same browser without affecting each other', async ({
    page,
  }) => {
    await studentLogin(page)
    const { admin } = fixture()
    await adminLogin(page, E2E_ADMIN_EMAIL, admin.pw, admin.totp)

    // The student is still signed in on the website…
    await page.goto('/en/app')
    await expect(page).toHaveURL(/\/en\/app\/level-check$/)
    // …and the admin is still signed in to the panel.
    await page.goto('/admin')
    await expect(page.locator('span[title="Dashboard"]').first()).toBeVisible()
    // The student API sees the student, never the admin.
    const me = await page.evaluate(async () => {
      const res = await fetch('/api/v1/me', { credentials: 'same-origin' })
      return { status: res.status, body: (await res.json()) as { student?: { email?: string } } }
    })
    expect(me.status).toBe(200)
    expect(me.body.student?.email).toBe('e2e-student@e2e.nihongo-mock.test')
  })

  test('a leftover student token in the admin cookie is removed', async ({
    page,
    context,
    baseURL,
  }) => {
    const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url')
    await context.addCookies([
      {
        name: 'payload-token',
        value: `${b64({ alg: 'HS256' })}.${b64({ collection: 'students', id: 1 })}.signature`,
        url: baseURL!,
      },
    ])
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)
    expect((await context.cookies()).map((c) => c.name)).not.toContain('payload-token')
  })
})
