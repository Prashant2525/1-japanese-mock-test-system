import { execSync } from 'node:child_process'

/** Creates the throwaway E2E accounts and shares their random credentials with tests (see fixture.ts). */
export default function globalSetup(): void {
  const output = execSync('pnpm --silent exec tsx tests/e2e/e2e-admin.ts create', {
    encoding: 'utf8',
    env: process.env,
  })
  const match = output.match(/^E2E_FIXTURE=(\{.*\})$/m)
  if (!match) throw new Error('E2E setup did not report its fixture')
  process.env.E2E_FIXTURE = match[1]
  // A published level check with known answers (sample questions; the E2E database only).
  execSync('pnpm --silent seed:sample-level-check', { stdio: 'inherit', env: process.env })
}
