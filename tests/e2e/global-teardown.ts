import { execSync } from 'node:child_process'

/** Removes the throwaway E2E admin. */
export default function globalTeardown(): void {
  execSync('pnpm --silent exec tsx tests/e2e/e2e-admin.ts delete', {
    stdio: 'inherit',
    env: process.env,
  })
}
