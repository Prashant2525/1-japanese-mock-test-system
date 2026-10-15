import { expect, test } from '@playwright/test'

import {
  createConfirmedStudent,
  expectAccessible,
  open,
  setStudentLevel,
  studentLogin,
  uiEmail,
  uiPassword,
} from './helpers'

/** Phase 13: the exam catalogue on the student Mock tests page, from the CMS (no hard-coding). */
test.describe('exam catalogue (Phase 13)', () => {
  test('exams, their levels and each level group’s sections, in English and Japanese', async ({
    page,
  }, info) => {
    const email = uiEmail('catalogue')
    const password = uiPassword()
    createConfirmedStudent(email, password)
    setStudentLevel(email, 'N5')
    await studentLogin(page, 'en', email, password)

    await open(page, '/en/app/mock-tests')
    const jlpt = page.getByRole('article', { name: /JLPT|Japanese-Language Proficiency/ })
    await expect(jlpt).toBeVisible()
    // N5–N3 share three sections; N2–N1 have two (official JLPT structure, seeded in Phase 13).
    const lower = jlpt.getByRole('list', { name: /Sections for N5/ })
    await expect(lower.getByRole('listitem')).toHaveText([
      'Language Knowledge (Vocabulary)',
      'Language Knowledge (Grammar)・Reading',
      'Listening',
    ])
    const upper = jlpt.getByRole('list', { name: /Sections for N2/ })
    await expect(upper.getByRole('listitem')).toHaveCount(2)
    await expect(
      page.getByRole('article', { name: /JFT/ }).getByText('Script and Vocabulary').first(),
    ).toBeVisible()
    if (info.project.name === 'chromium') await expectAccessible(page)

    await open(page, '/ja/app/mock-tests')
    await expect(page.getByRole('heading', { name: 'レベル別の試験科目' }).first()).toBeVisible()
    await expect(page.getByText('言語知識（文字・語彙）').first()).toBeVisible()
  })
})
