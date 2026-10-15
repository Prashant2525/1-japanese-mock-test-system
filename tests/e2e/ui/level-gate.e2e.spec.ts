import { expect, test, type Page } from '@playwright/test'

import {
  createConfirmedStudent,
  expectAccessible,
  logOut,
  open,
  setStudentLevel,
  studentLogin,
  uiEmail,
  uiPassword,
} from './helpers'

/**
 * Phase 10: the level gate in the browser (LD-R01, LD-R02, PB §16.2 #1–3 and "refresh/relogin
 * after completion"). The Phase 11 level-check service is stood in for by the fixture, which sets
 * the stored state; everything else is the real app.
 */
const AREAS = ['/en/app', '/en/app/study', '/en/app/mock-tests', '/en/app/results']

async function apiStatus(page: Page, path: string, init?: RequestInit) {
  return page.evaluate(
    async ([p, i]) => {
      const res = await fetch(p as string, { credentials: 'same-origin', ...(i as RequestInit) })
      const body = (await res.json().catch(() => null)) as { error?: { code?: string } } | null
      return { status: res.status, code: body?.error?.code ?? null }
    },
    [path, init ?? {}] as const,
  )
}

async function newStudent(page: Page, level?: string) {
  const email = uiEmail('gate')
  const password = uiPassword()
  createConfirmedStudent(email, password)
  if (level) setStudentLevel(email, level)
  await studentLogin(page, 'en', email, password)
  return email
}

test.describe('level gate (Phase 10)', () => {
  test('a new student lands on the level check, and every other area sends them back', async ({
    page,
  }) => {
    await newStudent(page)
    await expect(page).toHaveURL(/\/en\/app\/level-check$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find your level')
    await expect(
      page.getByRole('list', { name: /Level-check route/ }).getByRole('listitem'),
    ).toHaveText(['N5', 'N4', 'N3'])
    await expect(page.getByRole('button', { name: 'Start the level check' })).toBeEnabled()
    // No study/test/results tabs before a level exists.
    await expect(page.getByRole('navigation', { name: 'Student area' })).toHaveCount(0)

    for (const path of AREAS) {
      await open(page, path)
      await expect(page, `direct URL ${path}`).toHaveURL(/\/en\/app\/level-check$/)
    }
  })

  test('the APIs refuse too, whatever the request claims or the browser stores', async ({
    page,
  }) => {
    await newStudent(page)
    await page.waitForURL(/\/level-check$/)
    await page.evaluate(() => {
      localStorage.setItem('determinationStatus', 'completed')
      localStorage.setItem('assignedLevel', 'N1')
    })
    expect(await apiStatus(page, '/api/v1/study/materials')).toEqual({
      status: 403,
      code: 'LEVEL_NOT_DETERMINED',
    })
    expect(await apiStatus(page, '/api/v1/results')).toEqual({
      status: 403,
      code: 'LEVEL_NOT_DETERMINED',
    })
    expect(
      await apiStatus(page, '/api/v1/attempts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mockTestId: 1, determinationStatus: 'completed', level: 'N1' }),
      }),
    ).toEqual({ status: 403, code: 'LEVEL_NOT_DETERMINED' })
    await open(page, '/en/app/study')
    await expect(page).toHaveURL(/\/en\/app\/level-check$/)
  })

  test('a returning student with a level goes home; the level check is closed to them', async ({
    page,
  }) => {
    await newStudent(page, 'N4')
    await expect(page).toHaveURL(/\/en\/app$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome, UI Student')
    await expect(page.getByText('Your level', { exact: true })).toBeVisible()
    await expect(page.getByRole('main').getByText('N4', { exact: true })).toBeVisible()
    const tabs = page.getByRole('navigation', { name: 'Student area' })
    await tabs.getByRole('link', { name: 'Study' }).click()
    await expect(page).toHaveURL(/\/en\/app\/study$/)
    await expect(tabs.getByRole('link', { name: 'Study' })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByText('No study materials have been published yet.')).toBeVisible()
    expect((await apiStatus(page, '/api/v1/study/materials')).status).toBe(200)

    await open(page, '/en/app/level-check')
    await expect(page).toHaveURL(/\/en\/app$/)
  })

  test('an open tab follows the stored state on the next request', async ({ page }) => {
    const email = await newStudent(page, 'N5')
    await open(page, '/en/app/results')
    await expect(page).toHaveURL(/\/en\/app\/results$/)
    setStudentLevel(email, 'none') // e.g. an admin reset (D-013)
    await page.reload()
    await expect(page).toHaveURL(/\/en\/app\/level-check$/)
    setStudentLevel(email, 'N3')
    await page.reload()
    await expect(page).toHaveURL(/\/en\/app$/)
  })

  test('the gate redirects after login keep the language, and both pages are accessible', async ({
    page,
  }) => {
    const email = uiEmail('gate-ja')
    const password = uiPassword()
    createConfirmedStudent(email, password)
    await studentLogin(page, 'ja', email, password)
    await expect(page).toHaveURL(/\/ja\/app\/level-check$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'あなたのレベルを確認しましょう',
    )
    await expectAccessible(page)
    setStudentLevel(email, 'N4')
    await open(page, '/ja/app')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('UI Student さん、ようこそ')
    await expectAccessible(page)
  })

  test('arriving from another site keeps the student signed in (the return from Google, KI-29)', async ({
    page,
    baseURL,
  }) => {
    await newStudent(page, 'N4')
    await page.route('http://other-site.test/**', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: `<a id="go" href="${baseURL}/en/app/study">Open my study page</a>`,
      }),
    )
    await page.goto('http://other-site.test/')
    await page.click('#go')
    await expect(page).toHaveURL(/\/en\/app\/study$/)
    await expect(page.getByRole('banner').getByRole('link', { name: 'Log in' })).toHaveCount(0)
  })

  test('log out ends on the login page, signed out', async ({ page }) => {
    await newStudent(page, 'N5')
    await logOut(page)
    await expect(page).toHaveURL(/\/en\/login\?loggedOut=1$/)
    await expect(page.getByRole('main').getByText("You've been logged out.")).toBeVisible()
    await open(page, '/en/app')
    await expect(page).toHaveURL(/\/en\/login/)
  })
})
