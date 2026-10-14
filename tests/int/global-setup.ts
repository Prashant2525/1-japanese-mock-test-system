import { execSync } from 'node:child_process'

import './env'

/**
 * Brings the test database up to the latest migration before any integration test runs.
 * Uses the same `payload migrate` command as deployments, in a child process, so this
 * process keeps no database connections open.
 */
export default function setup(): void {
  execSync('pnpm --silent payload migrate', { stdio: 'inherit', env: process.env })
}
