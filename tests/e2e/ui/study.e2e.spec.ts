import { randomUUID } from 'node:crypto'

import { expect, test, type Page } from '@playwright/test'

import {
  createConfirmedStudent,
  createStudyMaterial,
  expectAccessible,
  open,
  setStudentLevel,
  studentLogin,
  uiEmail,
  uiPassword,
} from './helpers'

/**
 * Phase 12: the study library in the browser (SM-R01..R06, D-041). Materials are created through
 * the fixture (Payload local API, as the E2E Super Admin); the admin-side journey is in
 * admin-study.e2e.spec.ts.
 */
const run = randomUUID().slice(0, 6)

async function studentAt(page: Page, level: string) {
  const email = uiEmail('study')
  const password = uiPassword()
  createConfirmedStudent(email, password)
  setStudentLevel(email, level)
  await studentLogin(page, 'en', email, password)
}

test.describe('study library (Phase 12)', () => {
  test.describe.configure({ mode: 'serial' })
  // One set per browser project (the setup runs once for each).
  let n5 = ''
  let n4 = ''

  test.beforeAll(({}, info) => {
    const tag = info.project.name === 'chromium' ? 'c' : 'w'
    n5 = `e2e-${run}${tag}-n5`
    n4 = `e2e-${run}${tag}-n4`
    createStudyMaterial(n5, 'N5', { download: true })
    createStudyMaterial(n4, 'N4')
  })

  test('an N4 student sees N5 and N4 materials, filters them, and opens one with its files', async ({
    page,
  }, info) => {
    await studentAt(page, 'N4')
    await open(page, '/en/app/study')
    const main = page.getByRole('main')
    await expect(main.locator(`a[href$="/app/study/${n5}"]`)).toHaveCount(1)
    await expect(main.locator(`a[href$="/app/study/${n4}"]`)).toHaveCount(1)
    await expectAccessible(page)

    await page
      .getByRole('navigation', { name: 'Filter materials' })
      .getByRole('link', { name: 'N4', exact: true })
      .click()
    await expect(page).toHaveURL(/level=N4/)
    await expect(main.locator(`a[href$="/app/study/${n5}"]`)).toHaveCount(0)
    await expect(main.locator(`a[href$="/app/study/${n4}"]`)).toHaveCount(1)

    await open(page, `/en/app/study/${n5}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('E2E material N5')
    // Furigana inside the rich text.
    await expect(page.locator('article ruby rt').first()).toHaveText('にほんご')
    // The image, the audio and the PDF are served through signed, access-checked links.
    const image = page.getByRole('img', { name: 'A small test picture' })
    await expect(image).toBeVisible()
    const audioSrc = await page.locator('audio').getAttribute('src')
    const pdfHref = await page.getByRole('link', { name: 'Open the PDF' }).getAttribute('href')
    expect(audioSrc).toMatch(/^\/api\/v1\/media\/\d+\?exp=\d+&sig=/)
    const statuses = await page.evaluate(
      async (urls) => {
        const out: { status: number; type: string | null }[] = []
        for (const u of urls) {
          const r = await fetch(u, { credentials: 'same-origin', headers: { range: 'bytes=0-3' } })
          out.push({ status: r.status, type: r.headers.get('content-type') })
        }
        return out
      },
      [audioSrc!, pdfHref!],
    )
    expect(statuses).toEqual([
      { status: 206, type: 'audio/mpeg' },
      { status: 206, type: 'application/pdf' },
    ])
    // The PDF is drawn in the page (pdf.js), not in the browser's own viewer.
    await expect(page.locator('[role="document"] canvas').first()).toBeVisible()
    if (info.project.name === 'chromium') await expectAccessible(page)

    // Without "Allow download": no open/download links, the audio player hides its download item,
    // and the PDF still shows in the page.
    await open(page, `/en/app/study/${n4}`)
    await expect(page.getByRole('link', { name: 'Open the PDF' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Download' })).toHaveCount(0)
    await expect(page.locator('audio')).toHaveAttribute('controlslist', 'nodownload')
    await expect(page.locator('[role="document"] canvas').first()).toBeVisible()
  })

  test('search finds a material by its address name', async ({ page }) => {
    await studentAt(page, 'N4')
    await open(page, '/en/app/study')
    await page.getByRole('searchbox', { name: 'Search materials' }).fill(n4)
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page).toHaveURL(new RegExp(`q=${n4}`))
    const main = page.getByRole('main')
    await expect(main.locator(`a[href$="/app/study/${n4}"]`)).toHaveCount(1)
    await expect(main.locator(`a[href$="/app/study/${n5}"]`)).toHaveCount(0)
  })

  test('an N5 student does not see the N4 material, even by its address', async ({ page }) => {
    await studentAt(page, 'N5')
    await open(page, '/en/app/study')
    await expect(page.getByRole('main').locator(`a[href$="/app/study/${n5}"]`)).toHaveCount(1)
    await expect(page.getByRole('main').locator(`a[href$="/app/study/${n4}"]`)).toHaveCount(0)
    const res = await page.goto(`/en/app/study/${n4}`)
    expect(res?.status()).toBe(404)
  })

  test('the Japanese study page', async ({ page }) => {
    const email = uiEmail('study-ja')
    const password = uiPassword()
    createConfirmedStudent(email, password)
    setStudentLevel(email, 'N5')
    await studentLogin(page, 'ja', email, password)
    await open(page, '/ja/app/study')
    await expect(page.getByRole('navigation', { name: '教材を絞り込む' })).toBeVisible()
    await expect(page.getByRole('main').locator(`a[href$="/app/study/${n5}"]`)).toHaveCount(1)
  })
})
