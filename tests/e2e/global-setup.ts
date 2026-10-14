import { execSync } from 'node:child_process'

/** Creates the throwaway E2E admin and shares its random password with tests through the environment. */
export default function globalSetup(): void {
  const output = execSync('pnpm --silent exec tsx tests/e2e/e2e-admin.ts create', {
    encoding: 'utf8',
    env: process.env,
  })
  const match = output.match(/^E2E_ADMIN_PASSWORD=(\S+)$/m)
  if (!match) throw new Error('E2E admin setup did not report a password')
  process.env.E2E_ADMIN_PASSWORD = match[1]
}
