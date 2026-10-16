import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

import {
  createConfirmedStudent,
  createStudyMaterial,
  expectAccessible,
  expectNoHorizontalScroll,
  open,
  setStudentLevel,
  studentLogin,
  uiEmail,
  uiPassword,
} from './helpers'

/**
 * Phase 13b: the student shell (sidebar on desktop, tab bar on phones), the dashboard from real
 * data, "Mark as studied", the profile and the results list (D-098, D-106, D-107).
 */
const run = randomUUID().slice(0, 6)

test.describe('student dashboard and shell (Phase 13b)', () => {
  test.describe.configure({ mode: 'serial' })
  let material = ''

  test.beforeAll(({}, info) => {
    material = `e2e-${run}${info.project.name === 'chromium' ? 'c' : 'w'}-dash`
    createStudyMaterial(material, 'N4')
  })

  test('the dashboard shows real figures, and "Mark as studied" moves them', async ({
    page,
  }, info) => {
    const email = uiEmail('dash')
    const password = uiPassword()
    createConfirmedStudent(email, password)
    setStudentLevel(email, 'N4')
    await studentLogin(page, 'en', email, password)
    await open(page, '/en/app')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome back, UI Student')
    // The navigation that fits the screen: sidebar on desktop, bottom tab bar on the phone.
    const nav = page.getByRole('navigation', { name: 'Student area' })
    await expect(nav).toHaveCount(1)
    await expect(nav.getByRole('link', { name: 'Profile' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')

    const figures = page.getByRole('region', { name: 'Your figures' })
    const studied = figures.getByRole('listitem').filter({ hasText: 'Materials studied' })
    const before = (await studied.locator('p').nth(1).textContent())!.trim()
    expect(before).toMatch(/^0 \/ \d+$/)
    await expect(figures.getByText('Not yet')).toBeVisible()
    await expectNoHorizontalScroll(page)
    if (info.project.name === 'chromium') await expectAccessible(page)

    // Mark the test material as studied on its page.
    await open(page, `/en/app/study/${material}`)
    await page.getByRole('button', { name: 'Mark as studied' }).click()
    await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible() // saved on the server

    await open(page, '/en/app')
    await expect(studied.locator('p').nth(1)).toHaveText(before.replace(/^0 /, '1 '))
    await expect(figures.getByText('Not yet')).toHaveCount(0)
  })

  test('profile, results and the Japanese dashboard', async ({ page }, info) => {
    const email = uiEmail('dash-profile')
    const password = uiPassword()
    createConfirmedStudent(email, password)
    setStudentLevel(email, 'N5')
    await studentLogin(page, 'en', email, password)

    await page
      .getByRole('navigation', { name: 'Student area' })
      .getByRole('link', { name: 'Profile' })
      .click()
    await expect(page).toHaveURL(/\/en\/app\/profile$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Your profile' })).toBeVisible()
    await expect(page.getByText('Email and password', { exact: true })).toBeVisible()
    await expect(page.getByText(/It cannot be changed here/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Change password' })).toHaveAttribute(
      'href',
      '/en/forgot-password',
    )
    if (info.project.name === 'chromium') await expectAccessible(page)

    await open(page, '/en/app/results')
    await expect(page.getByText(/don't have any results yet/)).toBeVisible()

    await open(page, '/ja/app')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'UI Studentさん、おかえりなさい',
    )
    await expect(
      page
        .getByRole('navigation', { name: '受講者メニュー' })
        .getByRole('link', { name: 'プロフィール' }),
    ).toBeVisible()
  })

  test('the sidebar fills the height on every student page and screen size', async ({
    page,
  }, info) => {
    test.skip(info.project.name !== 'chromium', 'the sidebar is the desktop/tablet navigation')
    const email = uiEmail('dash-sidebar')
    const password = uiPassword()
    createConfirmedStudent(email, password)
    setStudentLevel(email, 'N5')
    await studentLogin(page, 'en', email, password)
    const pages = [
      '/en/app',
      '/en/app/study',
      '/en/app/mock-tests',
      '/en/app/results',
      '/en/app/profile',
    ]
    for (const size of [
      { width: 1024, height: 768 },
      { width: 1280, height: 800 },
      { width: 1600, height: 1000 },
    ]) {
      await page.setViewportSize(size)
      for (const path of pages) {
        await open(page, path)
        const sidebar = await page.locator('[data-student-shell] > aside').boundingBox()
        const header = await page.getByRole('banner').boundingBox()
        const footer = await page.locator('[data-student-shell] footer').boundingBox()
        const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight)
        expect(sidebar, path).not.toBeNull()
        // From right under the header to the very bottom of the page, never stopping halfway…
        expect(Math.abs(sidebar!.y - (header!.y + header!.height)), path).toBeLessThan(2)
        expect(Math.abs(sidebar!.y + sidebar!.height - pageHeight), path).toBeLessThan(2)
        // …so on a short page it fills the screen below the header.
        expect(sidebar!.height, path).toBeGreaterThanOrEqual(size.height - header!.height - 1)
        // The footer sits in the content column, beside the sidebar, at the bottom.
        expect(footer!.x, path).toBeGreaterThanOrEqual(sidebar!.x + sidebar!.width - 1)
        expect(Math.abs(footer!.y + footer!.height - pageHeight), path).toBeLessThan(2)
        await expect(
          page
            .locator('[data-student-shell] footer')
            .getByText(/not affiliated with the organisers/),
        ).toBeVisible()
        await expect(page.locator('body footer').filter({ visible: true })).toHaveCount(1)
        await expectNoHorizontalScroll(page)
      }
    }
    // Tablet portrait and phones use the bottom tab bar instead.
    await page.setViewportSize({ width: 820, height: 1180 })
    await open(page, '/en/app')
    await expect(page.locator('[data-student-shell] > aside')).toBeHidden()
    await expect(page.getByRole('navigation', { name: 'Student area' })).toBeVisible()
  })
})
