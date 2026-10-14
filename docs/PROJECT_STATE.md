# Project State

Current phase / milestone: **Phase 7 — Authentication, sessions, roles and permissions: COMPLETE**, including required admin two-factor login (D-058). Next: **Phase 8 — shared frontend foundation.**
Overall status: **IN PROGRESS** (backend foundation and auth exist; no student-facing pages yet)
Last verified commit: branch `feature/phase-7b-admin-mfa` (PR to `main`; contains Phase 7 too, also in PR #5).

## Work status

- **Verified complete (with evidence):**
  - Phases 0–6 (see `docs/IMPLEMENTATION_PLAN.md`). GitGuardian incident on PR #3 marked by the owner as a test credential (KI-11).
  - Phase 7 (local runs, 2026-10-14; details in `docs/TEST_STATUS.md`):
    - Roles and permissions: 28-key catalogue, 3 seeded system roles, `can()` used by every collection.
    - Admins: no self-escalation, no deletion, last-Super-Admin guard, disabled → sessions revoked.
    - Students: verification, lockout, revocable sessions, server-only `determinationStatus`.
    - `/api/v1/auth/*` and `/api/v1/me*`: identical responses for unknown emails, rate limits, CSRF, audit.
    - Payload student auth endpoints blocked; append-only audit log; CMS-managed bilingual email templates; `pnpm admin:create`.
    - Admin two-factor login: authenticator setup forced, a code required every session, wrong codes count toward lockout.
    - Tests: unit 36/36, integration 55/55, E2E 19/19; lint, typecheck, format and build pass.
    - Resend key verified with `pnpm email:check` (accepted, sending-only).
- **Partial / unverified:**
  - Real email delivery not yet tested: the sending domain isn't verified in Resend (KI-18); development uses the console transport.
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
- **Owner decisions open:** PA-6, PAY-3b, PAY-4b, CON-1b, TECH-5.
- **Owner actions:** merge the Phase 7b PR (it includes Phase 7; PR #5 then closes as merged). Verify the sending domain in Resend (steps in `docs/ENVIRONMENT_REQUIREMENTS.md`).
- **Environment variables still needed for staging/production:** `EMAIL_FROM_ADDRESS` on the verified domain, a production `RESEND_API_KEY` (sending-only, set on the host), `APP_ENV=production`, `TRUST_PROXY=true`.
- **Exact next task:** Phase 8 (playbook §11.9):
  - design tokens and fonts from `docs/DESIGN_SYSTEM.md`; logo variants (D-048);
  - next-intl `/en` `/ja` routing with the toggle, and the CMS UI-label override layer;
  - the core component library, motion utilities with reduced motion;
  - first real pages: sign-up, login, verify-email, forgot/reset password, connected to `/api/v1/auth`;
  - responsive and accessibility checks (axe), WebKit + mobile E2E projects.
