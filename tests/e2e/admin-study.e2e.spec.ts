import { randomUUID } from 'node:crypto'

import { expect, test, type Page } from '@playwright/test'

import { PDF } from '../fixtures/files'
import { E2E_ADMIN_EMAIL, E2E_EDITOR_EMAIL } from './admin-account'
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
 * panel, and a student of that level sees it straight away, without a deployment. Phase 12b: a
 * Super Admin then unpublishes and deletes it, and deletes the file once nothing uses it.
 */
test('an editor publishes a study material with a PDF and a student sees it', async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000) // the whole lifecycle across two admins and a student
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
  // No download allowed by default (D-097): no file link, the PDF is drawn in the page.
  await expect(student.getByRole('link', { name: 'Open the PDF' })).toHaveCount(0)
  await expect(student.locator('[role="document"] canvas').first()).toBeVisible()

  // 4. A Super Admin unpublishes, then deletes the material, then the now-unused file (D-092).
  const { admin } = fixture()
  const adminContext = await browser.newContext()
  const sa = await adminContext.newPage()
  await adminLogin(sa, E2E_ADMIN_EMAIL, admin.pw, admin.totp)
  await sa.goto('/admin/collections/study-materials')
  await sa.locator('#search-filter-input').fill(slug)
  await sa.locator('tbody tr', { hasText: title }).locator('a').first().click()
  await sa.waitForURL(/\/admin\/collections\/study-materials\/\d+/)
  const materialUrl = sa.url()

  // While the material uses it, the file cannot be deleted; its page says where it is used.
  await sa.goto('/admin/collections/learning-media')
  await sa.locator('#search-filter-input').fill(slug)
  await sa
    .locator('tbody tr', { hasText: `${slug}.pdf` })
    .locator('a')
    .first()
    .click()
  await sa.waitForURL(/\/admin\/collections\/learning-media\/\d+/)
  const mediaUrl = sa.url()
  await expect(sa.locator('.nm-used-by')).toContainText(title)
  await deleteDocument(sa)
  await expect(sa.getByText(/still used by/i).first()).toBeVisible()

  await sa.goto(materialUrl)
  await documentAction(sa, /^Unpublish$/)
  // The student loses it as soon as the unpublish is saved (no deploy, no cache).
  await expect
    .poll(async () => (await student.goto(`/en/app/study/${slug}`))?.status(), { timeout: 10_000 })
    .toBe(404)

  await deleteDocument(sa)
  await sa.waitForURL(/\/admin\/collections\/study-materials(\?|$)/)

  await sa.goto(mediaUrl)
  await expect(sa.locator('.nm-used-by')).toContainText(/Not used by any material/)
  await deleteDocument(sa)
  await sa.waitForURL(/\/admin\/collections\/learning-media(\?|$)/)
  await sa.goto('/admin/collections/learning-media')
  await sa.locator('#search-filter-input').fill(slug)
  await expect(sa.locator('tbody tr', { hasText: `${slug}.pdf` })).toHaveCount(0)

  await adminContext.close()
  await context.close()
})

/** An action from Payload's document ⋯ menu (Unpublish, Delete), then its confirmation. */
async function documentAction(page: Page, name: RegExp): Promise<void> {
  await page
    .locator('.doc-controls__popup button, button[aria-label="More options"]')
    .first()
    .click()
  await page.getByRole('button', { name }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Confirm/i })
    .click()
}

const deleteDocument = (page: Page) => documentAction(page, /^Delete$/)
