# Project State

Current phase / milestone: **Phase 13b — Student shell and dashboard: COMPLETE** (2026-10-16). Next: **Phase 14 — Question bank and import/export** (dashboard extras wait for DASH-1..DASH-5).
Overall status: **IN PROGRESS** (backend, auth and the first student-facing pages exist; no exam features yet)
Last verified commit: branch `feature/phase-13b-student-shell` (PR to `main`).

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
  - Phase 11 (D-078..D-083): questions (core), level-check settings and versions, the level-check engine, stage runner, "Your level", admin reset/override, sample content command, separate E2E database. Tests: unit 161/161, integration 149/149, E2E 119/119 + 1 skipped; sweep reviewed.
  - Phase 12 (D-084..D-088): study categories, study materials (drafts, publish, archive, furigana rich text), private learning media with upload checks and signed links (Range for audio), student study list and detail pages. Tests: unit 182/182, integration 170/170, E2E 126/126 + 1 skipped; sweep reviewed (desktop/iPhone, EN/JA, admin).
- **Partial / unverified:**
  - Real email delivery: waits on a domain (DOM-1, KI-18).
  - The home page is temporary (KI-08).
  - The admin panel uses Payload's own design (by plan).
  - Study files live on local disk until the owner creates Cloudflare R2 keys (KI-37, release blocker).
- **Remaining:** Phases 9–28.

## Phase 13b (2026-10-16)

- Student shell (sidebar / tab bar), dashboard from real data (D-108), profile and real results list (D-109), study progress with "Mark as studied" (D-107). Proposals DASH-1..DASH-5 await the owner.
- Tests: unit 190/190, integration 199/199, E2E 135/135 + 1 skipped (full run 134; the level-check iPhone test needed a selector fix for the hidden sidebar and passed on rerun, 10/10); sweep reviewed.
- **Code:** `src/domain/study-progress.ts`, `src/server/study/progress.ts`, `src/server/student/profile.ts`, `src/payload/collections/StudyProgress.ts`, `src/app/api/v1/study/materials/[slug]/progress/route.ts`, `src/ui/components/{student-nav,mark-studied,results-table}.tsx`, student layout, home, profile, results and material pages; label namespaces `dashboard`, `profile` (`src/i18n/label-groups.ts`).
- **Database:** migrations `20261016_080641_study_progress`, `20261016_082216_dashboard_labels_add`, `20261016_082229_old_home_labels_drop` (added and dropped separately so the schema tools never ask whether a column was renamed).

## Phase 13 (2026-10-16)

- Exam sections collection with seeds from the official guides (D-103), integrity rules and RESTRICT links (D-104), public catalogue API and Mock tests page (D-105). EX-1 asks the owner to confirm NAT 1Q/2Q sections.
- Tests: unit 184/184, integration 193/193, E2E 131/131 + 1 skipped, first try, no retries; sweep reviewed.
- **Code:** `src/payload/collections/ExamSections.ts`, `ExamTypes.ts` (sections list, switch-off rule), `src/server/catalogue/{rules,queries}.ts`, `src/app/api/v1/catalogue/exams/route.ts`, Mock tests page.
- **Database:** migrations `20261015_211508_exam_sections` (table + seed, plain SQL), `20261015_212439_mock_tests_catalogue_labels`, `20261015_213000_catalogue_fk_restrict`.

## Phase 12b (2026-10-16)

- Relationship-aware deletion (D-092, D-100), KI-41 permission fix, media archive + "Used by", per-attachment downloads with the in-app PDF viewer (D-097, D-101), study search (D-102). Owner answers RV-1..RV-14 recorded as D-092..D-099.
- Tests: unit 182/182, integration 184/184, E2E 128/128 + 1 skipped; sweep reviewed.
- **Code:** `src/payload/hooks/contentLifecycle.ts`, `src/payload/admin/used-by.tsx`, `src/ui/components/{pdf-viewer,no-save}.tsx`, collections (StudyMaterials, MaterialCategories, LearningMedia, Questions), `permissions.ts` (3 keys), study service/API/pages; dependency `pdfjs-dist` 6.3.289.
- **Database:** migrations `20261015_200516_content_lifecycle`, `20261015_201010_study_search_labels`, `20261015_201500_super_admin_delete_permissions` (plain SQL).

## Reference review (2026-10-16)

- 24 reference screenshots inspected (`UI_SCREEN_INVENTORY.md` §7: mapping, design improvements, omitted items).
- Found: learning media cannot be removed at all (KI-39); materials/categories/question drafts cannot be deleted (KI-40); unpublish/archive permission to verify (KI-41).
- Conflicts with approved D-019 (premium study materials, coupons, refunds, plans) recorded as RV-1..RV-5; owner instructions recorded as D-089..D-091; new requirements LC-R01..R04, ACC-R01..R04, PROT-R01, SM-R07, STU-R01, ADM-R01..R02, COM-R05.
- No code changed.

## Changes (Phase 12)

- **Code:** `src/domain/study.ts`, `src/server/media/{files,signing,storage}.ts`, `src/server/study/service.ts`, `src/payload/collections/{MaterialCategories,StudyMaterials,LearningMedia}.ts`, `src/app/api/v1/study/materials/**`, `src/app/api/v1/media/[id]/route.ts`, study list and detail pages, `src/ui/components/rich-text.tsx`, `Reveal` `as` prop, upload size limit in `payload.config.ts`; placeholder study list removed from `src/server/student/areas.ts`.
- **Database:** migrations `20261015_155855_study_library` (tables + seeded categories) and `20261015_160304_study_labels`.
- **Env files:** "Study media" section in `.env` and `.env.example` (`LEARNING_MEDIA_DIR`, R2 keys with step-by-step instructions; R2 not read yet).
- **Tests:** `tests/unit/domain/study.test.ts`, `tests/unit/media.test.ts`, `tests/int/study.int.spec.ts`, `tests/e2e/ui/study.e2e.spec.ts`, `tests/e2e/admin-study.e2e.spec.ts`, `tests/fixtures/files.ts`; fixture action `study`; sweep covers study and admin study pages.

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

- **Blockers for Phase 12:** none. Media storage: local disk in development; Cloudflare R2 needs the owner's account before staging (ENVIRONMENT_REQUIREMENTS).
- **Owner decisions open:** DOM-1 (domain, later), PA-6, PAY-3b, PAY-4b, CON-1b, TECH-5.
- **Exact next task:** Phase 12 (playbook §11.13), study materials and media:
  - CMS for the N5/N4/N3 study library: categories (Listening, Grammar, Reading, Kanji; more via CMS), materials with text (furigana), images, audio and PDFs, ordering, draft/publish/archive;
  - media library with upload validation (type, size), private storage for learning media with signed access;
  - student study pages and `/api/v1/study/materials` returning only published materials of the student's level and below (replacing the Phase 10 placeholder);
  - tests: draft/unpublished/ineligible content stays inaccessible; a published item appears without deployment.
