import { expect, test, type Page } from '@playwright/test'

import { SAMPLE_LEVEL_CHECK } from '../../../scripts/sample-level-check-data'
import {
  createConfirmedStudent,
  expectAccessible,
  open,
  studentLogin,
  uiEmail,
  uiPassword,
} from './helpers'

/**
 * Phase 11: the level check in the browser, on the sample level check published by global setup
 * (N5 → N4 → N3, 5 questions each, 60% to pass). Correct answers come from the sample data.
 */
async function newStudent(page: Page, locale: 'en' | 'ja' = 'en') {
  const email = uiEmail('lc')
  const password = uiPassword()
  createConfirmedStudent(email, password)
  await studentLogin(page, locale, email, password)
  return email
}

/** Answers every question of the current stage: correctly for the first `right`, wrong otherwise. */
async function answerStage(page: Page, level: 'N5' | 'N4' | 'N3', right: number) {
  const samples = SAMPLE_LEVEL_CHECK[level]
  for (const [i, sample] of samples.entries()) {
    await expect(page.getByText(`Question ${i + 1} of ${samples.length}`)).toBeVisible()
    const wrong = (['A', 'B', 'C', 'D'] as const).find((k) => k !== sample.correct)!
    const key = i < right ? sample.correct : wrong
    await page.getByRole('radio', { name: new RegExp(`^Answer ${key}:`) }).check()
    if (i < samples.length - 1)
      await page.getByRole('button', { name: 'Next', exact: true }).click()
  }
  await expect(page.getByText('All answers saved')).toBeVisible()
}

async function submitStage(page: Page) {
  await page.getByRole('complementary').getByRole('button', { name: 'Review and submit' }).click()
  const dialog = page.getByRole('dialog', { name: 'Ready to submit this stage?' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Submit stage' }).click()
}

test.describe('the level check (Phase 11)', () => {
  test('N5 passed, N4 not passed → "Your level" is N5, and the student area opens', async ({
    page,
  }) => {
    await newStudent(page)
    await expect(page).toHaveURL(/\/en\/app\/level-check$/)
    await expect(page.getByText('5 questions · 10 minutes').first()).toBeVisible()
    await page.getByRole('button', { name: 'Start the level check' }).click()

    await expect(page).toHaveURL(/\/en\/app\/level-check\/stage$/)
    await expect(page.getByText('Level check · N5')).toBeVisible()
    await expect(page.getByRole('timer')).toHaveText(/^Time left 0?9:\d\d|^Time left 10:00/)
    // Furigana is shown as ruby text.
    await expect(page.locator('legend ruby rt').first()).toHaveText('ほん')
    await answerStage(page, 'N5', 5)
    await submitStage(page)

    await expect(page.getByRole('heading', { name: 'Stage N5 passed' })).toBeVisible()
    await page.getByRole('button', { name: 'Start N4' }).click()
    await expect(page.getByText('Level check · N4')).toBeVisible()
    await answerStage(page, 'N4', 1)
    await submitStage(page)

    await expect(page).toHaveURL(/\/en\/app\/your-level$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your level')
    await expect(
      page.getByRole('main').getByText('N5', { exact: true }).filter({ visible: true }).first(),
    ).toBeVisible()
    const stages = page.getByRole('region', { name: 'Your level check' })
    await expect(stages.getByRole('listitem')).toHaveCount(2)
    await expect(stages.getByRole('listitem').nth(0)).toContainText('100%')
    await expect(stages.getByRole('listitem').nth(0)).toContainText('Passed')
    await expect(stages.getByRole('listitem').nth(1)).toContainText('20%')
    await expect(stages.getByRole('listitem').nth(1)).toContainText('Not passed')
    await expectAccessible(page)

    await page.getByRole('link', { name: 'Go to my page' }).click()
    await expect(page).toHaveURL(/\/en\/app$/)
    expect(new URL(page.url()).pathname).toBe('/en/app')
    // No second run: both the intro and the stage screen send them on.
    await open(page, '/en/app/level-check')
    expect(new URL(page.url()).pathname).toBe('/en/app')
    await open(page, '/en/app/level-check/stage')
    expect(new URL(page.url()).pathname).toBe('/en/app/your-level')
  })

  test('reloading keeps the answers and the original deadline', async ({ page }) => {
    await newStudent(page)
    await page.getByRole('button', { name: 'Start the level check' }).click()
    await expect(page.getByText('Level check · N5')).toBeVisible()
    const samples = SAMPLE_LEVEL_CHECK.N5
    await page.getByRole('radio', { name: new RegExp(`^Answer ${samples[0]!.correct}:`) }).check()
    await page.getByRole('button', { name: /Mark for review/ }).click()
    await expect(page.getByText('All answers saved')).toBeVisible()
    const before = await page.getByRole('timer').textContent()

    await page.reload()
    await expect(page.getByText('Level check · N5')).toBeVisible()
    // It reopens at the first unanswered question; question 1 keeps its answer and mark.
    await page.getByRole('button', { name: /^Question 1, answered, marked for review$/ }).click()
    await expect(
      page.getByRole('radio', { name: new RegExp(`^Answer ${samples[0]!.correct}:`) }),
    ).toBeChecked()
    const after = await page.getByRole('timer').textContent()
    expect(after! <= before!).toBe(true) // the clock kept running; it did not restart
  })

  test('a second tab takes over and the first one says so (D-027)', async ({ page, context }) => {
    await newStudent(page)
    await page.getByRole('button', { name: 'Start the level check' }).click()
    await expect(page.getByText('Level check · N5')).toBeVisible()
    const second = await context.newPage()
    await open(second, '/en/app/level-check/stage')
    await expect(second.getByText('Level check · N5')).toBeVisible()

    await page.getByRole('radio', { name: /^Answer A:/ }).check()
    await expect(
      page.getByRole('heading', { name: 'This test continues in another tab' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Continue here' }).click()
    await expect(page.getByText('Level check · N5')).toBeVisible()
  })

  test('the stage screen is accessible and calm (no site navigation)', async ({ page }) => {
    await newStudent(page)
    await page.getByRole('button', { name: 'Start the level check' }).click()
    await expect(page.getByText('Level check · N5')).toBeVisible()
    await expect(page.getByRole('banner').getByRole('link', { name: 'My page' })).toHaveCount(0)
    await expect(page.getByRole('contentinfo')).toHaveCount(0)
    await expectAccessible(page)
  })

  test('the Japanese stage screen', async ({ page }) => {
    await newStudent(page, 'ja')
    await page.getByRole('button', { name: 'レベルチェックを始める' }).click()
    await expect(page.getByText('レベルチェック・N5')).toBeVisible()
    await expect(page.getByText('問題 1 / 5')).toBeVisible()
    await expectAccessible(page)
  })
})
