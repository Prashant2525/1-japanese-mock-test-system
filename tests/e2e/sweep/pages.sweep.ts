import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { test, type Page } from '@playwright/test'

import { E2E_ADMIN_EMAIL } from '../admin-account'
import { adminLogin } from '../admin-login'
import { fixture } from '../fixture'
import {
  createConfirmedStudent,
  createStudyMaterial,
  setStudentLevel,
  studentLogin,
  uiEmail,
  uiPassword,
} from '../ui/helpers'

const PUBLIC = ['/en', '/ja', '/en/login', '/ja/signup', '/en/forgot-password', '/en/app']
const STUDENT = [
  '/en',
  '/ja',
  '/en/login',
  '/en/signup',
  '/en/app',
  '/en/app/level-check',
  '/ja/app/level-check',
  '/en/app/study',
  '/en/app/mock-tests',
  '/en/app/results',
  '/en/app/your-level',
  '/en/app/profile',
  '/ja/app/profile',
  '/ja/app',
  '/ja/app/level-check/stage',
  '/en/app/level-check/stage',
]

type Row = { state: string; requested: string; landed: string; h1: string }

async function sweep(page: Page, state: string, paths: string[], project: string) {
  const dir = path.join('sweep-results', project)
  mkdirSync(dir, { recursive: true })
  const rows: Row[] = []
  for (const p of paths) {
    await page.goto(p, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    if (p.startsWith('/admin')) {
      // The admin panel keeps a connection open and always has an animation running.
      await page.waitForTimeout(3000)
    } else {
      await page.waitForLoadState('networkidle')
      await page.waitForFunction(() =>
        document.getAnimations().every((a) => a.playState !== 'running'),
      )
    }
    // Scroll through once: some admin cells (relationship labels) render only when on screen.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1200)
    await page.evaluate(() => window.scrollTo(0, 0))
    const name = `${state}${p.replace(/[/?=]/g, '_')}.png`
    await page.screenshot({ path: path.join(dir, name), fullPage: true })
    const h1 =
      (await page
        .locator('h1')
        .first()
        .textContent({ timeout: 2000 }) // the admin dashboard has no <h1>
        .catch(() => '')) ?? ''
    rows.push({
      state,
      requested: p,
      landed: new URL(page.url()).pathname + new URL(page.url()).search,
      h1: h1.trim(),
    })
  }
  writeFileSync(path.join(dir, `${state}.json`), JSON.stringify(rows, null, 2))
}

test.describe.configure({ mode: 'serial' })

test('signed out', async ({ page }, info) => {
  await sweep(page, 'signed-out', PUBLIC, info.project.name)
})

test('student without a level', async ({ page }, info) => {
  const email = uiEmail('sweep')
  const password = uiPassword()
  createConfirmedStudent(email, password)
  await studentLogin(page, 'en', email, password)
  await sweep(page, 'no-level', STUDENT, info.project.name)
})

test('student with a level', async ({ page }, info) => {
  const email = uiEmail('sweep')
  const password = uiPassword()
  createConfirmedStudent(email, password)
  setStudentLevel(email, 'N4')
  // Something in the study library (one set per project: the slugs are unique).
  const slug = `e2e-sweep-${Date.now().toString(36)}`
  createStudyMaterial(`${slug}-n5`, 'N5')
  createStudyMaterial(`${slug}-n4`, 'N4')
  await studentLogin(page, 'en', email, password)
  await sweep(
    page,
    'level-n4',
    [
      ...STUDENT,
      '/ja/app/study',
      '/ja/app/mock-tests',
      '/en/app/study?level=N4',
      '/en/app/study?category=reading',
      `/en/app/study/${slug}-n4`,
      `/ja/app/study/${slug}-n5`,
    ],
    info.project.name,
  )
})

test('admin (Super Admin)', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium', 'admin panel is checked on desktop')
  const { admin } = fixture()
  await adminLogin(page, E2E_ADMIN_EMAIL, admin.pw, admin.totp)
  await sweep(
    page,
    'admin',
    [
      '/admin',
      '/admin/collections/levels',
      '/admin/collections/students',
      '/admin/globals/sign-in-settings',
      '/admin/collections/questions',
      '/admin/globals/level-check-settings',
      '/admin/collections/level-check-versions',
      '/admin/collections/exam-sections',
      '/admin/collections/material-categories',
      '/admin/collections/study-materials',
      '/admin/collections/study-materials/create',
      '/admin/collections/learning-media',
      '/admin/collections/learning-media/create',
    ],
    info.project.name,
  )
})
