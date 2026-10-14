import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'

import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

import { E2E_UI_DOMAIN } from '../admin-account'

export const uiEmail = (label: string) => `${label}-${randomUUID().slice(0, 8)}${E2E_UI_DOMAIN}`
export const uiPassword = () => `Pw-${randomUUID().replace(/-/g, '').slice(0, 16)}`

/** Reads the emailed token from the database (the E2E server prints emails instead of sending). */
export function emailedToken(kind: 'verify' | 'reset', email: string): string {
  const out = execSync(`pnpm --silent exec tsx tests/e2e/e2e-admin.ts token ${kind} ${email}`, {
    encoding: 'utf8',
    env: process.env,
  })
  const match = out.match(/^TOKEN=(\S+)$/m)
  if (!match) throw new Error(`no ${kind} token printed for ${email}`)
  return match[1]
}

/** Flips the CMS switch for "Continue with Google" (Settings → Sign-in options). */
export function setGoogleSignIn(state: 'on' | 'off'): void {
  execSync(`pnpm --silent exec tsx tests/e2e/e2e-admin.ts google ${state}`, { env: process.env })
}

/** WCAG 2.2 A/AA scan; fails on serious or critical violations. */
export async function expectAccessible(page: Page): Promise<void> {
  // Scan the settled page: mid fade-in, text is semi-transparent and would read as low contrast.
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'))
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  )
  expect(
    serious.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`),
  ).toEqual([])
}

export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

/**
 * Opens a page and waits until the network is idle, so React has finished hydrating and any
 * streamed (hidden) copy of a form has been removed before the test starts typing.
 */
export async function open(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}
