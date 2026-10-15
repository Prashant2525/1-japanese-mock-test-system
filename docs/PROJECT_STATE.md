# Project State

Current phase / milestone: **Phase 10 — Student route gates: COMPLETE** (2026-10-15). Next: **Phase 11 — Level determination engine.**
Overall status: **IN PROGRESS** (backend, auth and the first student-facing pages exist; no exam features yet)
Last verified commit: branch `feature/phase-10-route-gates` (PR to `main`).

## Work status

- **Verified complete (with evidence):**
  - Phases 0–7 (see `docs/IMPLEMENTATION_PLAN.md`), including required admin two-factor login.
  - Phase 8 (local, 2026-10-15; details in `docs/TEST_STATUS.md`):
    - Tokyo Transit design tokens and self-hosted fonts.
    - Outlined logo variants, compared visually with the original artwork.
    - EN/JA routing with a remembered switch (English default); translated 404.
    - Every UI string in message files, overridable in the CMS (three label globals).
    - Component library and accessible forms (shared validation with the API).
    - Pages: home (temporary), sign up, check email, verify, log in, forgot/reset, protected student home, log out.
    - Tests: unit 82/82, integration 59/59, E2E 68/68 + 1 intentionally skipped (two clean runs in a row), on desktop Chrome and iPhone Safari; axe scans pass in EN and JA. Lint, typecheck, format and build are clean.
  - Phase 8b, Continue with Google (D-066): students only, CMS switch, account linking, revocable sessions. Tests: unit 102/102, integration 76/76, E2E 78/78 + 1 skipped. Real Google login waits on the owner's Google Cloud client (steps in `.env`).
  - Phase 9 (D-068..D-071): branded admin, menu groups, role-aware dashboard with live data, reusable audit/validation patterns, exam catalogue end to end (seeded JLPT/NAT/JFT). Tests: unit 119/119, integration 102/102, E2E 82/82 + 1 skipped. Fixed KI-23 (validation messages missing in production admin forms).
  - Phase 10 (D-073, D-074): server level gate on APIs and pages, level-check intro, student home and tabs. Tests: unit 125/125, integration 117/117, E2E 92/92 + 1 skipped.
- **Partial / unverified:**
  - Real email delivery: waits on a domain (DOM-1, KI-18).
  - The home page is temporary (KI-08).
  - The admin panel uses Payload's own design (by plan).
- **Remaining:** Phases 9–28.

## Changes (Phase 10)

- **Code:** `src/server/student/gate.ts`, `src/server/student/areas.ts`, `src/server/catalogue/queries.ts`, `src/app/api/v1/{study/materials,results,attempts}/route.ts`, `src/app/(frontend)/[locale]/(site)/app/**` (layout, guard, home, level-check, study, mock-tests, results), `src/ui/components/{level-route,student-nav}.tsx`, `StationBadge` colour prop, `student-auth.ts` (`assignedLevel`, `nextStep`), header fixes, `Students.ts` fields, label group `labels-student`.
- **Database:** migration `20261015_092913_student_level_gate`.
- **Tests:** `tests/unit/level-gate.test.ts`, `tests/int/level-gate.int.spec.ts`, `tests/e2e/ui/level-gate.e2e.spec.ts`; fixture actions `student` and `level`.

## Changes (Phase 9)

- **Code:** `src/payload/admin/*` (groups, graphics, dashboard, widgets), `src/payload/hooks/auditTrail.ts`, `src/payload/say.ts`, `src/payload/collections/ExamTypes.ts`, `Levels.ts`, `src/server/catalogue/*` (rules, seed), `src/app/(payload)/custom.scss`, `payload.config.ts` (admin branding, dashboard, collections), `next.config.ts` (KI-23), menu groups on existing collections (email templates moved to Content).
- **Database:** migration `20261015_082931_exam_catalogue` (tables + seed).
- **Tests:** `tests/unit/catalogue.test.ts`, `tests/int/catalogue.int.spec.ts`, `tests/e2e/admin-cms.e2e.spec.ts`; fixture adds a Support admin.

## Changes (Phase 8b)

- **Code:** `src/server/auth/google.ts`, `src/server/services/google-auth.ts`, `src/app/api/v1/auth/google/**`, `src/payload/globals/SignInSettings.ts`, `Students.googleSub`, `src/ui/components/google-button.tsx`, login/sign-up forms and pages, `(auth)` layout rendered per request (KI-22), `src/server/env.ts` (Google variables; empty = unset).
- **Database:** migration `20261014_203352_google_sign_in`.
- **Env files:** Google section in `.env` and `.env.example` (empty until the owner creates the client).

## Changes (Phase 8)

- **Code:**
  - `src/ui/**` (tokens, components, forms, lib), `src/i18n/**` (routing, navigation, request, labels, messages)
  - `src/app/(frontend)/[locale]/**` (layouts and pages), `src/proxy.ts` (locale routing)
  - `src/payload/globals/UiLabels.ts`, `src/server/i18n/label-overrides.ts`, `src/shared/auth-schemas.ts`
  - `public/brand/*`, `scripts/brand/*`, `postcss.config.mjs`, `next.config.ts` (next-intl plugin)
  - error handling: `src/server/http/errors.ts` (structural checks), `src/server/services/student-auth.ts` (login error classification)
  - cookie rule: `Admins.ts`/`Students.ts` (Secure on https)
- **Database:** migration `20261014_191843_ui_labels` (`labels_site`, `labels_accounts`, `labels_messages` + locales tables).
- **Env files:** a "WHEN YOU BUY YOUR DOMAIN" guide in `.env` and `.env.example` (no new variables).

## Verification and blockers

- **Blockers for Phase 11:** none (see the sequencing note below).
- **Owner decisions open:** DOM-1 (domain, later), PA-6, PAY-3b, PAY-4b, CON-1b, TECH-5.
- **Exact next task:** Phase 11 (playbook §11.12), the N5-first level check:
  - determination configuration in the CMS (stages = enabled JLPT levels from N5, threshold %, duration, fixed question set, intro/between/summary copy), published as immutable versions (D-009..D-012);
  - sessions and stage attempts with server deadlines, auto-submit on expiry, idempotent and race-safe finalisation, `level_assignments` history;
  - "Your level" summary; admin reset (reason, audit) and Super Admin override (D-013);
  - **sequencing note:** stages need questions before the full question bank (Phase 14). Plan: build the core question model (single-answer multiple choice, EN/JA, explanation) in Phase 11 and extend it in Phase 14 (media, import/export, versioning screens);
  - tests for every pass/fail branch, bypass, duplicate submission, race, returning login and interrupted attempt.
