import { expect, test } from '@playwright/test'

import {
  createConfirmedStudent,
  logOut,
  open,
  openMyPage,
  setStudentLevel,
  studentLogin,
  uiEmail,
  uiPassword,
} from './helpers'

/**
 * What a signed-in student sees outside the student area (owner report, KI-30): no sign-up or
 * login offers, and a way into the student area on every screen size.
 */
async function signedInStudent(page: import('@playwright/test').Page, level?: string) {
  const email = uiEmail('signedin')
  const password = uiPassword()
  createConfirmedStudent(email, password)
  if (level) setStudentLevel(email, level)
  await studentLogin(page, 'en', email, password)
}

test.describe('signed-in student outside the student area', () => {
  test('the home page offers "Go to my page", not sign-up or login', async ({ page }) => {
    await signedInStudent(page)
    await open(page, '/en')
    const hero = page.getByRole('main')
    await expect(hero.getByText('Welcome back, UI Student.')).toBeVisible()
    await expect(hero.getByRole('link', { name: 'Create a free account' })).toHaveCount(0)
    await expect(hero.getByRole('link', { name: 'Log in' })).toHaveCount(0)
    await hero.getByRole('link', { name: 'Go to my page' }).click()
    await expect(page).toHaveURL(/\/en\/app\/level-check$/)

    await open(page, '/ja')
    await expect(page.getByRole('main').getByRole('link', { name: 'マイページへ' })).toBeVisible()
  })

  test('login and sign-up pages send a signed-in student to the student area', async ({ page }) => {
    await signedInStudent(page, 'N4')
    const path = () => new URL(page.url()).pathname
    await open(page, '/en/login')
    expect(path()).toBe('/en/app')
    await open(page, '/en/login?next=/en/app/results')
    expect(path()).toBe('/en/app/results')
    await open(page, '/ja/login')
    expect(path()).toBe('/ja/app')
    await open(page, '/ja/signup')
    expect(path()).toBe('/ja/app')
  })

  test('"My page" and "Log out" are reachable from the header on every screen size', async ({
    page,
  }) => {
    await signedInStudent(page) // no level yet: lands on the level check
    await open(page, '/en')
    await openMyPage(page)
    await expect(page).toHaveURL(/\/en\/app\/level-check$/)
    await logOut(page)
    await expect(page).toHaveURL(/\/en\/login\?loggedOut=1$/)
  })

  test('signed out, the home page still offers sign-up and login', async ({ page }) => {
    await open(page, '/en')
    const hero = page.getByRole('main')
    await expect(hero.getByRole('link', { name: 'Create a free account' })).toBeVisible()
    await expect(hero.getByRole('link', { name: 'Log in' })).toBeVisible()
    await expect(page.getByRole('banner').getByRole('link', { name: 'My page' })).toHaveCount(0)
    await expect(page.getByRole('banner').getByRole('button', { name: 'Menu' })).toHaveCount(0)
  })
})
