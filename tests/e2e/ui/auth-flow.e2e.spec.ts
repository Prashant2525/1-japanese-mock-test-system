import { expect, test } from '@playwright/test'

import { emailedToken, open, uiEmail, uiPassword } from './helpers'

test.describe('student account pages, end to end', () => {
  test('sign up → check email → verify → log in → level check → log out', async ({ page }) => {
    const email = uiEmail('flow')
    const password = uiPassword()

    await open(page, '/en/signup')
    await page.getByLabel('Your name').fill('Aarav Sharma')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page).toHaveURL(/\/en\/check-email$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Check your email')
    await expect(page.getByText(email)).toBeVisible()

    await open(page, `/en/verify-email?token=${emailedToken('verify', email)}`)
    await expect(page.getByText('Email confirmed')).toBeVisible()
    await page.getByRole('link', { name: 'Log in' }).last().click()

    await expect(page).toHaveURL(/\/en\/login$/)
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Log in' }).click()

    // A new student goes straight to the level check (LD-R01).
    await expect(page).toHaveURL(/\/en\/app\/level-check$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find your level')
    await expect(page.getByText('Not started yet.')).toBeVisible()

    await page.getByRole('button', { name: 'Log out' }).click()
    await expect(page).toHaveURL(/\/en\/login\?loggedOut=1$/)
    await expect(page.getByText("You've been logged out.")).toBeVisible()
    await open(page, '/en/app')
    await expect(page).toHaveURL(/\/en\/login/)
  })

  test('shows translated validation and a generic error for wrong credentials', async ({
    page,
  }) => {
    await open(page, '/ja/login')
    await page.getByRole('button', { name: 'ログイン' }).click()
    await expect(page.getByText('入力してください。').first()).toBeVisible()

    await page.getByLabel('メールアドレス').fill(uiEmail('nobody'))
    await page.getByLabel('パスワード', { exact: true }).fill('wrong-password-123')
    await page.getByRole('button', { name: 'ログイン' }).click()
    await expect(page.getByRole('main').getByRole('alert')).toContainText(
      'メールアドレスまたはパスワードが正しくありません。',
    )
  })

  test('an unverified student is told to confirm their email and can resend the link', async ({
    page,
  }) => {
    const email = uiEmail('unverified')
    const password = uiPassword()
    await open(page, '/en/signup')
    await page.getByLabel('Your name').fill('Mina')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL(/check-email/)

    await open(page, '/en/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(
      page.getByText('Confirm your email first. We can send the link again.'),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Send the confirmation link again' }).click()
    await expect(
      page.getByText('If the address needs confirming, a new link is on its way.'),
    ).toBeVisible()
  })

  test('forgot password → reset with the emailed link → log in with the new password', async ({
    page,
  }) => {
    const email = uiEmail('reset')
    const oldPassword = uiPassword()
    const newPassword = uiPassword()

    await open(page, '/en/signup')
    await page.getByLabel('Your name').fill('Ken')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(oldPassword)
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL(/check-email/)
    await open(page, `/en/verify-email?token=${emailedToken('verify', email)}`)
    await expect(page.getByText('Email confirmed')).toBeVisible()

    await open(page, '/en/forgot-password')
    await page.getByLabel('Email').fill(email)
    await page.getByRole('button', { name: 'Send reset link' }).click()
    await expect(page.getByRole('main').getByRole('status')).toContainText(
      `If there's an account for ${email}`,
    )

    await open(page, `/en/reset-password?token=${emailedToken('reset', email)}`)
    await page.getByLabel('New password', { exact: true }).fill(newPassword)
    await page.getByLabel('Confirm new password').fill(newPassword + 'x')
    await page.getByRole('button', { name: 'Save new password' }).click()
    await expect(page.getByText("The passwords don't match.")).toBeVisible()
    await page.getByLabel('Confirm new password').fill(newPassword)
    await page.getByRole('button', { name: 'Save new password' }).click()
    await expect(page.getByText('Your password has been changed')).toBeVisible()

    await open(page, '/en/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(newPassword)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/en\/app\/level-check$/)
  })

  test('a reset link without a token explains what to do', async ({ page }) => {
    await open(page, '/en/reset-password')
    await expect(page.getByRole('main').getByRole('alert')).toContainText(
      'This page needs the link from your password-reset email.',
    )
  })
})
