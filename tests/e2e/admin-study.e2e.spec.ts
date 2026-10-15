import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

import { PDF } from '../fixtures/files'
import { E2E_EDITOR_EMAIL } from './admin-account'
import { adminLogin } from './admin-login'
import { fixture } from './fixture'
import {
  createConfirmedStudent,
  open,
  setStudentLevel,
  studentLogin,
  uiEmail,
  uiPassword,
} from './ui/helpers'

/**
 * Phase 12 acceptance: a Content Editor uploads a PDF and publishes a study material in the admin
 * panel, and a student of that level sees it straight away, without a deployment.
 */
test('an editor publishes a study material with a PDF and a student sees it', async ({
  page,
  browser,
}) => {
  const run = randomUUID().slice(0, 6)
  const slug = `e2e-${run}-admin`
  const title = `Admin-made material ${run}`
  const { editor } = fixture()
  await adminLogin(page, E2E_EDITOR_EMAIL, editor.pw, editor.totp)

  // 1. Upload the PDF to the learning media library.
  await page.goto('/admin/collections/learning-media/create')
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: `${slug}.pdf`, mimeType: 'application/pdf', buffer: PDF })
  await page.locator('#action-save').click()
  await page.waitForURL(/\/admin\/collections\/learning-media\/\d+/)

  // 2. Create the material: N5, Grammar, a short body and the PDF attached; then publish.
  await page.goto('/admin/collections/study-materials/create')
  await page.locator('#field-title').fill(title)
  await page.locator('#field-level').click()
  await page.locator('.rs__option', { hasText: /^N5/ }).first().click()
  await page.locator('#field-category').click()
  await page.locator('.rs__option', { hasText: 'Grammar' }).first().click()
  await page.locator('#field-slug').fill(slug)
  await page.locator('#field-summary').fill('Made in the admin panel by the browser tests.')
  const body = page.locator('[data-lexical-editor="true"]').first()
  await body.click()
  await body.pressSequentially('A paragraph written in the editor.')

  await page.getByRole('button', { name: /Add Attachment/i }).click()
  await page
    .getByRole('button', { name: /Choose from existing/i })
    .first()
    .click()
  const drawer = page.locator('.drawer__content, [role="dialog"]').last()
  await drawer.getByText(`${slug}.pdf`).first().click()
  await expect(page.getByText(`${slug}.pdf`).first()).toBeVisible()

  await page.locator('#action-save').click()
  await expect(page.getByText(/published|successfully/i).first()).toBeVisible()

  // 3. A student at N5 sees it in the library and can open the PDF.
  const context = await browser.newContext()
  const student = await context.newPage()
  const email = uiEmail('study-admin')
  const password = uiPassword()
  createConfirmedStudent(email, password)
  setStudentLevel(email, 'N5')
  await studentLogin(student, 'en', email, password)
  await open(student, '/en/app/study')
  await student.getByRole('main').locator(`a[href$="/app/study/${slug}"]`).click()
  await expect(student.getByRole('heading', { level: 1 })).toHaveText(title)
  await expect(student.getByText('A paragraph written in the editor.')).toBeVisible()
  const href = await student.getByRole('link', { name: 'Open the PDF' }).getAttribute('href')
  // Fetched from the page: the API's session check wants the browser's fetch metadata (KI-29).
  const res = await student.evaluate(async (url) => {
    const r = await fetch(url, { credentials: 'same-origin' })
    return { status: r.status, type: r.headers.get('content-type') }
  }, href!)
  expect(res).toEqual({ status: 200, type: 'application/pdf' })
  await context.close()
})
