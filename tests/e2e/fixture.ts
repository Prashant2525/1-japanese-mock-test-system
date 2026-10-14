/**
 * Credentials for the throwaway E2E accounts, created fresh (random) by global setup and shared
 * with tests as one JSON environment variable. Never persisted.
 */
export type E2EFixture = {
  admin: { pw: string; totp: string }
  editor: { pw: string; totp: string }
  newAdmin: { pw: string }
  student: { pw: string }
}

export function fixture(): E2EFixture {
  const raw = process.env.E2E_FIXTURE
  if (!raw) throw new Error('E2E global setup did not run (E2E_FIXTURE missing)')
  return JSON.parse(raw) as E2EFixture
}
