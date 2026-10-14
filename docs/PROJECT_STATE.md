# Project State

Current phase / milestone: **Phase 7 — Authentication, sessions, roles and permissions: COMPLETE except admin MFA** (waits on owner decision OPS-2b). Next: **Phase 8 — shared frontend foundation.**
Overall status: **IN PROGRESS** (backend foundation and auth exist; no student-facing pages yet)
Last verified commit: branch `feature/phase-7-auth` (stacked on `feature/phase-6-foundation`; PR #3 not yet merged).

## Work status

- **Verified complete (with evidence):**
  - Phases 0–6 (see `docs/IMPLEMENTATION_PLAN.md`). GitGuardian incident on PR #3 marked by the owner as a test credential (KI-11).
  - Phase 7 (local runs, 2026-10-14; details in `docs/TEST_STATUS.md`):
    - Roles and permissions: 28-key catalogue, 3 seeded system roles, `can()` used by every collection.
    - Admins: no self-escalation, no deletion, last-Super-Admin guard, disabled → sessions revoked.
    - Students: verification, lockout, revocable sessions, server-only `determinationStatus`.
    - `/api/v1/auth/*` and `/api/v1/me*`: identical responses for unknown emails, rate limits, CSRF, audit.
    - Payload student auth endpoints blocked; append-only audit log; CMS-managed bilingual email templates; `pnpm admin:create`.
    - Tests: unit 36/36, integration 49/49, E2E 16/16; lint, typecheck, format and build pass.
- **Partial / unverified:**
  - Admin MFA not built (OPS-2b).
  - Resend delivery is untested: no account yet, so development uses the console transport and tests use the memory transport.
  - One local Playwright run crashed natively and the re-run passed (KI-12).
  - Placeholder home page (KI-08).
- **In progress:** none.
- **Remaining:** Phases 8–28.

## Changes

- **Code:** `src/server/auth/{permissions,session,sessions}.ts`, `src/server/services/student-auth.ts`, `src/server/email/{adapter,templates}.ts`, `src/server/{rate-limit,audit/record}.ts`, `src/server/http/{client,errors,route}.ts`, `src/server/env.ts`, `src/payload/access/index.ts`, `src/payload/hooks/loginRateLimit.ts`, `src/payload/collections/{Admins,Roles,Students,AuditEvents,EmailTemplates}.ts`, `src/app/api/v1/**`, `src/proxy.ts`, `scripts/create-super-admin.ts`.
- **Database:** migrations `20261014_150706_auth_roles_students` (schema) and `20261014_150800_seed_auth` (rate_limits table, system roles, email templates). Applied to the dev and test databases.
- **API:** 9 new `/api/v1` endpoints (see `docs/API_DOCUMENTATION.md` §4.1).
- **UI:** admin panel now shows People (Admins, Roles, Students), Settings (Email templates) and Operations (Audit log), filtered by permission.

## Verification and blockers

- **Tests:** see `docs/TEST_STATUS.md`.
- **Blockers:** none for Phase 8.
- **Owner decisions open:** OPS-2b (admin MFA), PA-6, PAY-3b, PAY-4b, CON-1b, TECH-5.
- **Owner actions:** merge PR #3, then the Phase 7 PR. Create a Resend account and verify the sending domain before staging.
- **Environment variables still needed for staging/production:** `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS` (real domain), `APP_ENV=production`, `TRUST_PROXY=true`.
- **Exact next task:** Phase 8 (playbook §11.9):
  - design tokens and fonts from `docs/DESIGN_SYSTEM.md`; logo variants (D-048);
  - next-intl `/en` `/ja` routing with the toggle, and the CMS UI-label override layer;
  - the core component library, motion utilities with reduced motion;
  - first real pages: sign-up, login, verify-email, forgot/reset password, connected to `/api/v1/auth`;
  - responsive and accessibility checks (axe), WebKit + mobile E2E projects.
