import { execSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'

import { defineConfig, devices } from '@playwright/test'

import 'dotenv/config'

/**
 * Browser tests use their own database (D-078), never the development data in `.env`: test
 * accounts, questions and published level checks stay out of it. CI already provides a throwaway
 * database through DATABASE_URL. Prepared once per run, before the app server starts.
 */
if (!process.env.CI) {
  process.env.DATABASE_URL =
    process.env.E2E_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5433/nihongo_mock_e2e'
}
if (!process.env.E2E_DB_READY) {
  execSync('pnpm --silent exec tsx tests/e2e/prepare-db.ts', { stdio: 'inherit', env: process.env })
  process.env.E2E_DB_READY = '1'
}

// A dedicated port so E2E never reuses a developer's `pnpm dev` server on 3000.
const PORT = 3100

/**
 * E2E runs against the production build by default (`pnpm build` first).
 * Set E2E_DEV=1 to run against `pnpm dev` instead.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.e2e.spec.ts',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Student-facing pages also run on a phone with Safari's engine (DESIGN_SYSTEM: mobile-first).
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'] }, testMatch: 'ui/**/*.e2e.spec.ts' },
  ],
  webServer: {
    command: process.env.E2E_DEV ? `pnpm dev -p ${PORT}` : `pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}/healthz`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // The server must know its own URL (CSRF origin checks, Payload serverURL).
    env: {
      APP_URL: `http://localhost:${PORT}`,
      // "Continue with Google" is switched on with throwaway values; tests stop at Google's door.
      GOOGLE_CLIENT_ID: 'e2e-test.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: randomBytes(16).toString('hex'),
    },
    // E2E_SERVER_LOGS=1 shows the app server's own log (useful when a test sees an unexpected error).
    stdout: process.env.E2E_SERVER_LOGS ? 'pipe' : 'ignore',
  },
})
