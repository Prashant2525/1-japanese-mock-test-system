import config from './playwright.config'

/**
 * Visual sweep (`pnpm sweep`): opens every page in every user state, on desktop and iPhone, and
 * saves screenshots plus a list of where each address ended up, for review before a report.
 * Not part of the test suite; it asserts nothing except that pages load.
 */
const sweepConfig = {
  ...config,
  testDir: './tests/e2e/sweep',
  testMatch: '**/*.sweep.ts',
  retries: 0,
  timeout: 180_000,
  projects: (config.projects ?? []).map((p) => ({ ...p, testMatch: '**/*.sweep.ts' })),
}

export default sweepConfig
