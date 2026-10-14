# Project State

Current phase / milestone: **Phase 6 — Project and backend foundation: COMPLETE** (local + CI green on PR #3; GitGuardian false positive pending owner action, KI-11). Next: **Phase 7 — Authentication, sessions, roles and permissions.**
Overall status: **IN PROGRESS** (foundation code exists; no student features yet)
Last verified commit: branch `feature/phase-6-foundation` (see `git log`); `main` = `5f46dad` (PR #2 merged).

## Work status

- **Verified complete (with evidence):**
  - Phases 0–5: requirements, decisions D-001..D-051, stack, design (Direction B), architecture, approved database design.
  - Phase 6 foundation (all checks run locally on 2026-10-14; details in `docs/TEST_STATUS.md`):
    - Next.js 16.3.8 + Payload 3.90.2 + PostgreSQL 17; `admins` auth collection, closed by default; EN/JA localization; Payload REST at `/api/cms`; GraphQL off; migration-only schema changes.
    - Startup environment validation, structured logging with redaction, shared error model, request IDs, strict JSON parsing.
    - `/healthz`, `/readyz`, baseline security headers.
    - Tests: unit 18/18, integration 11/11, E2E 8/8; lint, typecheck, formatting and build all pass; migration-drift detection proven.
    - GitHub Actions CI workflow; Husky + lint-staged pre-commit.
- **Partial / unverified:** GitGuardian check on PR #3 is red for an old commit (KI-11). The home page is a placeholder (KI-08). Email goes to the console (KI-09).
- **In progress:** none.
- **Remaining:** Phases 7–28.

## Changes

- **Code:** `package.json`, `pnpm-workspace.yaml`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `vitest.config.mts`, `playwright.config.ts`, `src/payload.config.ts`, `src/payload/collections/Admins.ts`, `src/server/{env,logger,health}.ts`, `src/server/http/{errors,route}.ts`, `src/app/(payload)/**` (generated), `src/app/(frontend)/**` (placeholder), `src/app/{healthz,readyz}/route.ts`, `src/domain/README.md`, `tests/**`, `docker/**`, `.github/workflows/ci.yml`, `.husky/pre-commit`, `.env.example`, `.gitignore`, `.nvmrc`, `README.md`.
- **Database / migrations:** `src/migrations/20261014_141636_initial` (admins + sessions, Payload system tables, locales enum). Applied to the local dev and test databases.
- **API:** `/healthz`, `/readyz`; Payload REST `/api/cms/*` (admins only, closed).
- **UI:** placeholder home page; Payload admin at `/admin`.

## Verification and blockers

- **Tests:** see `docs/TEST_STATUS.md`.
- **Blockers for Phase 7:** none for building auth. A Resend account is needed for real emails (development uses the console). OPS-2b (admin MFA) is needed before Phase 7 finishes.
- **Owner decisions open:** OPS-2b, PA-6, PAY-3b, PAY-4b, CON-1b, TECH-5.
- **Environment variable names still needed:** `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` (Phase 7).
- **Exact next task:** Phase 7 (playbook §11.8):
  - `roles` collection + permission keys + the `can()` helper;
  - Super Admin CLI;
  - `students` auth collection (verify, lockout, sessions, preferredLocale, determination fields protected);
  - `/api/v1/auth/*` with a Postgres rate limiter, plus `rate_limits` and `audit_events`;
  - email adapter (Resend + console fallback) and bilingual email templates;
  - tests for valid/invalid credentials, reset, expiry/revocation, privilege escalation and cross-user access.
