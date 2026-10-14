# Test Status

Last updated: 2026-10-14 (Phase 6).

## Environment

- Local: Windows 11, Node v24.15.0, pnpm 12.8.1, Docker 29.8.1, PostgreSQL 17 (Docker, port 5433). Databases: `nihongo_mock` (dev) and `nihongo_mock_test` (integration tests).
- CI: GitHub Actions `ubuntu-latest`, Postgres 17 service, per-run random `PAYLOAD_SECRET` (`.github/workflows/ci.yml`).

## Commands

| Purpose | Command | Status |
|---|---|---|
| Lint | `pnpm lint` | Passing (0 problems) |
| Type-check | `pnpm typecheck` | Passing |
| Formatting | `pnpm format:check` | Passing |
| Unit tests | `pnpm test:unit` | **18/18 passing** |
| Integration tests | `pnpm test:int` | **11/11 passing**; migrates the test DB first via the CLI |
| Build | `pnpm build` | Passing |
| E2E tests | `pnpm test:e2e` (after `pnpm build`) | **8/8 passing** (Chromium, production build) |
| Migration drift | `pnpm payload migrate:create ci_drift_check --skip-empty` | No drift. Detection verified by adding a probe field (a migration was generated) and reverting. |

## Latest local results (2026-10-14)

- Unit: `tests/unit/env.test.ts` (6): defaults, coercion, missing variables named, secret value never printed, non-Postgres URL rejected, pool bounds. `tests/unit/errors.test.ts` (12): error mapping, Zod field details, unknown errors hidden, request-ID generation/validation, params, strict JSON parsing.
- Integration: `tests/int/database.int.spec.ts` (8): query, test-DB isolation, migrations applied, admin sessions table, admin persistence (no hash exposed), anonymous create/read refused (403), delete refused even for an admin. `tests/int/health.int.spec.ts` (3): `/healthz`, `/readyz` ready, no connection details exposed.
- E2E: `tests/e2e/foundation.e2e.spec.ts` (8): security headers and request ID, readiness, home page, anonymous `/api/cms/admins` → 403, GraphQL → 404, admin redirect to login, wrong password rejected, valid login reaches the dashboard. The throwaway admin is removed afterwards (verified: 0 admins in both databases).

## CI results (PR #3)

- Run 38582759563 (commit `585196f`): **pass** in 1m34s. The log shows formatting ✓, migration applied, drift check ran, build compiled, E2E 8 passed.
- Run 38583141350 (commit `71ef7cf`, password-free CI database): **pass** in 1m59s.
- GitGuardian: flags commit `585196f` for the throwaway CI database password (KI-11). The latest commit has no password.

## Coverage gaps (planned)

- WebKit and mobile-viewport E2E projects: added in Phase 8 with the first real UI.
- Accessibility (axe) and reduced-motion runs: Phase 8 onward.
- Load test (k6, 500 concurrent): Phase 26.
- All feature acceptance criteria (PB §16.2–16.5): their phases.
