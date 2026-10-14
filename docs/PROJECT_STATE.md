# Project State

Current phase / milestone: **Phase 8 — Shared frontend foundation: COMPLETE** (2026-10-15). Next: **Phase 9 — Admin CMS framework.**
Overall status: **IN PROGRESS** (backend, auth and the first student-facing pages exist; no exam features yet)
Last verified commit: branch `feature/phase-8-frontend-foundation` (PR to `main`).

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
    - Tests: unit 78/78, integration 59/59, E2E 66/66 + 1 intentionally skipped, on desktop Chrome and iPhone Safari; axe scans pass in EN and JA. Lint, typecheck, format and build are clean.
- **Partial / unverified:**
  - Real email delivery: waits on a domain (DOM-1, KI-18).
  - The home page is temporary (KI-08).
  - The admin panel uses Payload's own design (by plan).
- **Remaining:** Phases 9–28.

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

- **Blockers for Phase 9:** none.
- **Owner decisions open:** DOM-1 (domain, later), PA-6, PAY-3b, PAY-4b, CON-1b, TECH-5.
- **Exact next task:** Phase 9 (playbook §11.10):
  - Admin CMS shell: Nihongo Mock branding in the Payload admin, navigation groups, dashboard widgets backed by real data;
  - reusable CRUD/audit patterns;
  - one representative module end to end. Proposal: the exam catalogue (exam types + levels with the three enable flags, D-014) — it is needed by Phases 11–15 and exercises CRUD, EN/JA fields, permissions and audit;
  - tests for CRUD, validation, pagination, access denial and persistence.
