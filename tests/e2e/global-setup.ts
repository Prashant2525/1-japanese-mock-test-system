import { execSync } from 'node:child_process'

const KEYS = ['E2E_ADMIN_PASSWORD', 'E2E_EDITOR_PASSWORD', 'E2E_STUDENT_PASSWORD'] as const

/** Creates the throwaway E2E accounts and shares their random passwords with tests through the environment. */
export default function globalSetup(): void {
  const output = execSync('pnpm --silent exec tsx tests/e2e/e2e-admin.ts create', {
    encoding: 'utf8',
    env: process.env,
  })
  for (const key of KEYS) {
    const match = output.match(new RegExp(`^${key}=(\\S+)$`, 'm'))
    if (!match) throw new Error(`E2E setup did not report ${key}`)
    process.env[key] = match[1]
  }
}
