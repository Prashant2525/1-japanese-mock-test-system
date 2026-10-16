# Changelog

## 2026-10-16 — Phase 13c: streaks, daily goal, study calendar and milestones

- Dashboard: current and longest study streak, today's goal (1–5 materials, chosen by the student), a study calendar with the student's own plans (add, tick, remove), this week's activity chart and milestones — all from real study actions in Nepal time; no minute tracking, no leaderboard (DASH-3/5 defaults).
- A material counts as a study action only the first time it is marked studied, so toggling cannot farm streaks.
- Fixed: every database rollback with new tables failed (Payload-generated); documented that `payload migrate:reset` itself is broken upstream (KI-49).
- Tests: unit 202/202, integration 205/205, E2E 138/138 + 2 skipped (full run, first try); after two later fixes (empty states; text typed before the plan box finished loading) the dashboard tests passed again (7/7 + 1 skipped) and the calendar test 6/6 on repeat.

## 2026-10-16 — Fix: student sidebar height

- The navy sidebar now always runs from the header to the bottom of the page on every student page (it stopped halfway on short pages). The footer moved into the content column of the student area. Root cause and test: KI-48, D-112.
- Recorded the owner's DASH answers (D-110) and the calendar request (D-111) for Phase 13c.

## 2026-10-16 — Phase 13b: student shell, dashboard and profile

- New student layout: sidebar on desktop (with your level), bottom tab bar on phones; exam screens unchanged.
- Home is now a dashboard from real data: welcome with level, next step, materials studied, last studied, level-check stages passed, progress by category (explained), what to study next, exams to practise, recent results — with honest empty states.
- "Mark as studied" on every material (undo possible); "Continue where you left off" (study progress, RV-12, brought forward).
- Profile page (account, sign-in methods, level and history, change password) and a Results page that lists real results (it wrongly said "no results" before).
- Streaks, weekly chart, study time, goals, achievements and leaderboards proposed for approval (DASH-1..DASH-5), not built.
- Tests: unit 190/190, integration 199/199, E2E 135/135 + 1 skipped (full run 134; the level-check iPhone test needed a selector fix for the hidden sidebar and passed on rerun, 10/10).

## 2026-10-16 — Phase 13: examination configuration

- Exam sections in the CMS (Exam catalogue → Exam sections): per exam, optionally per level, EN/JA, ordered, on/off; seeded from the official JLPT, JFT-Basic and NAT-TEST structures; shown on each exam type's page.
- Integrity: sections only for levels of their exam; JLPT cannot be switched off while the level check or study uses it; nothing in the catalogue is deleted; history and content tables now refuse catalogue deletes at the database level (six links changed from SET NULL to RESTRICT).
- Public catalogue API and a real Mock tests page: each exam with its level groups and sections, from the CMS.
- Fixed during the phase: six history/content links that would have been blanked by a catalogue delete (now RESTRICT); my own new admin browser test could rename the wrong section when it clicked before the search had filtered (caught by the screenshot review; it now waits and restores the original name).
- Tests: unit 184/184, integration 193/193, E2E 131/131 + 1 skipped, first try, no retries.

## 2026-10-16 — Phase 12b: content lifecycle, downloads and search

- Deleting now works where it is safe (D-092): unused learning media (stored file removed too), study materials, empty categories, never-published questions. Things still in use are refused with a clear "used by" message; history-bearing records stay archive-only. New permissions `materials.delete`, `media.delete`, `questions.delete` (Super Admin by default).
- Fixed KI-41: someone without publish rights could unpublish or archive published materials and questions.
- Learning media: Archive switch and a "Used by" panel.
- Downloads off by default with an "Allow download" switch per attachment; PDFs now open in an in-app viewer on every device (phones see every page).
- Study search.
- Owner answers RV-1..RV-14 recorded (D-092..D-099): coupons, refunds and sale prices are in scope; single tests and bundles; notices; watermark; layout and admin direction.
- Tests: unit 182/182, integration 184/184, E2E 128/128 + 1 skipped.

## 2026-10-16 — Reference review (documents only)

- Inspected the owner's 24 UI reference screenshots and mapped each to our screens (`UI_SCREEN_INVENTORY.md` §7).
- Recorded owner instructions D-089 (free/premium/preview access), D-090 (dashboard and reports approved), D-091 (deletion is a requirement); new requirements LC, ACC, PROT, SM-R07, STU-R01, ADM, COM-R05; questions RV-1..RV-14; known issues KI-39..KI-43; proposed Phase 12b.

## 2026-10-15 — Phase 12: study library and media

- Students with a level get a Study library: their level's and easier levels' published materials, filters by level and category, and a detail page with furigana text, images, an audio player and PDFs (open / download).
- Admin: Study library menu with categories (seeded Kanji & vocabulary, Grammar, Reading, Listening), study materials (draft → publish, archive, furigana rich text, attachments) and a private learning media library (type, size and content checks).
- Files reach students only through signed, expiring, per-student links that are re-checked on every request; audio seeking supported.
- Files are on local disk until Cloudflare R2 keys exist (KI-37); `.env` / `.env.example` have the R2 steps.
- Fixed during the phase: an empty `LEARNING_MEDIA_DIR` would have stored uploads in the project root; integration leftovers could push this run's study items off the first page; mobile filter labels wrapped awkwardly; list order made stable.
- Tests: unit 182/182, integration 170/170, E2E 126/126 + 1 skipped.

## 2026-10-15 — Phase 11: the level check

- Students can take the N5-first level check: start, calm timed stage screen (one question at a time, question map, mark for review, review and submit, autosave, takeover by a newer tab, auto-submit at the deadline), "Stage passed" between stages, and "Your level" with each stage's score.
- Server engine: published level-check versions, sessions, attempts, results and items, level-assignment history; exact pass-mark comparison; idempotent, race-safe submit; expiry; no level choice or skipping.
- Admin: Question bank (questions with furigana, EN/JA explanations, publish with rights confirmation), Level check settings (draft → publish creates a version), published versions, sessions, attempts, results and level history (read-only), and Reset / Change level on the student record with a reason.
- `pnpm seed:sample-level-check` for local trial (sample questions, never in production).
- Browser tests now use their own database (`nihongo_mock_e2e`).
- Fixed during the phase: answer saves overflowed a 32-bit number (KI-35); "Start N4" showed the passed screen again; admin forms' furigana markup in lists.
- Tests: unit 161/161, integration 149/149, E2E 119/119 + 1 skipped.

## 2026-10-15 — Fix: separate student and admin sessions (KI-32)

- Students get their own session cookie (`nm_student_session`); the admin panel no longer sees a signed-in student (no authenticator setup screen for students).
- An admin and a student can be signed in in the same browser.
- Leftover student tokens in the admin cookie are removed automatically.
- Tests: unit 133, integration 120, E2E 107 + 1 skipped (new `separate-sessions`; it fails against the old code).

## 2026-10-15 — Fix: what signed-in students see (KI-30)

- Home page: signed-in students see "Welcome back" and "Go to my page" instead of "Create a free account / Log in".
- Login and sign-up pages send signed-in students to the student area (or to a safe `next` page).
- Phones: a header Menu with "My page" and "Log out" (before, a signed-in student on a phone had no link to the student area, and no way to log out on the level-check page).
- Admin: Levels grouped by exam type; ✓ / – instead of true/false in yes/no columns.
- `pnpm sweep`: screenshots of every page in every user state, EN/JA, desktop and iPhone, plus where each address ended up; run and reviewed before each report. It found a doubled path (`/en/en/app`) in this fix before release.
- Tests: unit 129, integration 120, E2E 104 + 1 skipped (new `ui/signed-in`).

## 2026-10-15 — Fix: signed-in students sent back to the login page (KI-29)

- After "Continue with Google" or a link from another site, pages now recognise the signed-in student (D-075). The API rules are unchanged.
- Login and logout finish with a full page load, so the destination and header always reflect the new session.
- Tests: unit 129, integration 120, E2E 96 + 1 skipped (new: arriving from another site; logout).

## 2026-10-15 — Phase 10: student route gates

- Server level gate (D-073): study materials, mock-test attempts and results APIs refuse students without a level (`403 LEVEL_NOT_DETERMINED`); `/me` and login report `assignedLevel` and `nextStep`.
- Student area: level-check intro (stages and colours from the CMS), student home with the level badge, tabs, and Study / Mock tests / Results pages with honest empty states; every page guarded on the server.
- Students: `assignedLevel`, `assignedAt` (service-only); migration `student_level_gate` (also a "UI labels: student area" group and the new error label).
- Fixed: on phones in Japanese, the header's language switch and log-out button wrapped onto two lines.
- Tests: unit 125, integration 117, E2E 92 + 1 skipped (bypass tests: direct URLs, API calls, forged bodies, browser storage, stale tabs; EN/JA; axe).

## 2026-10-15 — Phase 9: admin CMS framework

- Admin shell: Nihongo Mock logo (light/dark) and icon, tab title and favicon; menu groups People → Exam catalogue → Content → Operations → Settings.
- Dashboard widgets with live data, shown by permission: setup checklist, students, exam catalogue (level-check route in level colours), recent activity.
- Reusable patterns: `ADMIN_GROUPS`, `auditTrail()` (changed fields only), `say()` for EN/JA messages, cross-record rules as field validators; module checklist in ARCHITECTURE §9a.
- Exam catalogue: `exam-types` and `levels` collections with EN/JA fields, search, sort, pagination, bulk edit, permission checks, the D-070 rules, audit; migration `exam_catalogue` seeds JLPT, NAT and JFT.
- Fixed KI-23: Payload is loaded once in production (`serverExternalPackages`), so validation messages appear in admin forms.
- Fixed KI-26: seed migrations rewritten in plain SQL, so a fresh database migrates (found by CI).
- E2E fixture: a Support admin with an authenticator.
- Tests: unit 119, integration 102, E2E 82 + 1 skipped.

## 2026-10-15 — Continue with Google (owner-approved, D-066)

- "Continue with Google" on the login and sign-up pages (EN/JA, Google branding), shown when `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set and the CMS switch (Settings → Sign-in options) is on.
- `/api/v1/auth/google` + `/callback`: OpenID Connect with PKCE, state, nonce; account linking by Google ID, then by verified email; revocable sessions; audit; rate limit; friendly messages on the login page for every failure.
- Students get a read-only "Google account ID" field in the admin panel. Migration `google_sign_in` (column, settings table, new label columns).
- Fixed: the account pages were frozen at build time, so CMS label edits didn't reach a production build (KI-22).
- Fixed: an empty optional line in `.env` stopped the app from starting (D-067).
- `.env`/`.env.example`: Google section with step-by-step setup.

## 2026-10-15 — Phase 8: shared frontend foundation

- Design system in code: Tokyo Transit tokens (Tailwind v4 `@theme`), self-hosted fonts, focus styles, Japanese typography rules, reduced motion.
- Logo variants generated with outlined text (`public/brand/`, D-048): lockup and header wordmark, day and night, plus a mono icon; generator in `scripts/brand/`.
- EN/JA routing in `proxy.ts` (cookie-remembered, English default), `/en` `/ja` URLs, navbar language switch, translated 404.
- Every UI string in `messages/{en,ja}.json`, overridable from the CMS through three label globals (migration `ui_labels`).
- Components and forms: button, fields with accessible errors, password toggle, alerts, toasts, station badge, skyline, route line, header/footer, skip link.
- Pages: home (temporary), sign up, check email, verify email, log in, forgot/reset password, protected student home, logout. Shared validation rules with the API (`src/shared/auth-schemas.ts`).
- Fixes found by the new browser tests: login errors mis-classified in production builds (D-065); Secure cookies broke Safari on local http (D-064); a resend form nested inside the login form; Japanese pages rendered in English (missing `setRequestLocale` in layouts); N2/N1 line colours below 3:1 (D-063); Payload query over PostgreSQL's 100-argument limit (labels split into three globals).
- Domain placeholder guide added to `.env`/`.env.example`.
- CI flagged two flaky tests, both fixed at the root: background prefetch of the language switch was changing the remembered language (proxy now ignores prefetches; the switch no longer prefetches), and accessibility scans now wait for fade-in animations to finish.
- CI caught a timing-dependent answer on the attempt that locks an account; the lock is now read before the attempt (deterministic).
- Tests: unit 82, integration 59, E2E 68 + 1 skipped (desktop Chrome and iPhone Safari, axe accessibility scans in EN/JA).

## 2026-10-14 — Phase 7b: admin two-factor login, environment files, Resend check

- Admin two-factor login required for every admin (D-058): `payload-totp` 3.0.6 (pinned after source review), forced setup, code every session, wrong codes count toward lockout, "Nihongo Mock" issuer. Migration `admin_totp` (`totp_attempts` table, `admins.totp_secret`). The proxy passes `x-pathname` for admin pages.
- `totpSecret` redacted in the audit log and logs.
- Tests: integration +6 (`admin-mfa`); E2E +3 (`admin-mfa`: password alone is not enough, wrong code refused, forced first-time setup). Existing admin E2E logins now enter real codes. E2E runs on its own port 3100 (D-059).
- `.env.example` rewritten with a commented section per variable, how to get each key, and commented placeholders for later phases. The owner's `.env` was rebuilt from it, keeping existing values.
- `pnpm email:check` verifies the Resend key and domain status without sending email.
- Windows exit crash (KI-12) diagnosed: Node/libuv assertion when `process.exit()` runs while fetch sockets close; scripts use `process.exitCode`.
- Phase 7 PR #4 had merged into the Phase 6 branch instead of `main`; this PR brings Phase 7 to `main` too.
- E2E fixture: credentials passed as one JSON value (GitGuardian false positives on variable names); per-account rate-limit counters for E2E accounts are cleared before each run (`clearRateLimits`).

## 2026-10-14 — Phase 7: authentication, sessions, roles and permissions

- Permission catalogue (28 keys) and `can()`; `roles` collection with seeded system roles (Super Admin, Content Editor, Support). Super Admin always has every permission; system roles cannot be deleted.
- `admins`: roles and status changeable only by `admins.manage`; no deletion; last-Super-Admin guard; disabled admins are blocked and their sessions revoked; login audit; bilingual set-password email.
- `students` auth collection: email verification, lockout, 7-day revocable sessions, server-only `determinationStatus`; suspension revokes sessions.
- `/api/v1/auth/{register, verify, resend-verification, login, logout, forgot-password, reset-password}`, `/api/v1/me`, `/api/v1/me/preferences`: strict validation, identical responses for unknown emails, PostgreSQL rate limits with Retry-After, CSRF same-origin check, audit events.
- `src/proxy.ts` blocks Payload's own student auth and create endpoints.
- `audit-events` (append-only) and `email-templates` (EN/JA, CMS-editable) collections. Email transports: Resend / console / memory.
- `pnpm admin:create` creates a Super Admin and emails a set-password link (no default passwords).
- Migrations: `auth_roles_students` (schema) and `seed_auth` (rate-limit table, roles, email templates).
- `APP_ENV` added (D-052). New env vars: `APP_ENV`, `TRUST_PROXY`, `EMAIL_TRANSPORT`, `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`.
- Tests: unit 36, integration 49, E2E 16.
- README re-encoded to UTF-8 (KI-01 fixed properly).

## 2026-10-14 — Phase 6: project and backend foundation

- Scaffolded Next.js 16.3.8 + Payload 3.90.2 (embedded) on PostgreSQL 17 with pnpm 12 and Node 24 (D-051).
- Payload config: `admins` auth collection (closed access; no public first-user sign-up; delete disabled; lockout after 5 failures; server-side sessions), EN/JA content localization with EN fallback, EN/JA admin UI, REST at `/api/cms`, GraphQL disabled, `push: false`.
- Initial migration `20261014_141636_initial`.
- Server foundation: Zod environment validation (`src/server/env.ts`), pino logger with redaction, shared error model and `withRoute` wrapper with request IDs, `parseJson` strict validation.
- `/healthz` (liveness) and `/readyz` (database + pending migrations) endpoints; baseline security headers; `X-Powered-By` removed.
- Local Docker Compose Postgres (dev + test databases on port 5433).
- Tests: Vitest unit (18) and integration (11) projects, Playwright E2E (8) with a throwaway admin per run. ESLint rule keeps `src/domain` framework-free. Prettier, Husky + lint-staged pre-commit.
- GitHub Actions CI: lint, types, formatting, unit, migrations, integration, migration-drift check, build, E2E.
- README rewritten in UTF-8 with setup and commands (KI-01).

## 2026-10-14 — Phase 3 approved, Phase 4 complete, Phase 5 proposal

- Recorded D-046 (Direction B "Tokyo Transit"), D-047 (tagline "Practice Smart. Pass with Confidence."), D-048 (logo variants).
- Rewrote `DESIGN_SYSTEM.md` as the approved Direction B specification (tokens, level line colours, type, motion signatures, runner rules, CMS-editable design surface).
- Added `ARCHITECTURE.md` (context and layer diagrams, routing, auth/authorization, attempt/determination/publish/payment flows, i18n, media, caching, errors/audit, repository structure).
- Added `API_DOCUMENTATION.md` (conventions, error model, planned v1 endpoint catalogue).
- Added `DATABASE_ARCHITECTURE.md` (entities, constraints, snapshots, indexes, seed, migrations, retention) for owner approval.

## 2026-10-14 — Phase 2 approved, Phase 3 proposal

- Recorded the stack approval D-033..D-045 (Payload CMS embedded, Drizzle via Payload, next-intl, Tailwind v4, GSAP + Motion, R2, Resend, Vitest/Playwright, Docker) and the rejected/parked alternatives.
- Added `docs/UI_SCREEN_INVENTORY.md` (public, auth, student, checkout, admin, email screens with states).
- Added `docs/DESIGN_SYSTEM.md` (shared foundations, motion system, calm exam runner rules, three directions, tagline options, logo variant gaps).
- Added the live preview `docs/design/visual-directions.html`, published as a private artifact.
- Moved planning work to branch `docs/planning`.

## 2026-10-14 — Phase 1 addendum + Phase 2 proposal

- Recorded the second-round answers: D-027 (no pause, one active attempt), D-028 (English default + JA toggle), D-031 (keep tagline), D-032 (500 concurrent as the working assumption). Recorded the owner directives D-029 (showcase motion/parallax UI) and D-030 (maximal CMS coverage).
- Added UX-R01..R04 and CMS-R17 to the requirements register; closed MT-4, TECH-6b, PA-5, DS-1.
- Added `docs/TECH_STACK_OPTIONS.md` (Phase 2 comparison; recommends Payload CMS embedded in Next.js) and approval questions STACK-1..3.
- No code, dependencies or schema added.

## 2026-10-14 — Phase 1: product rules and owner decisions

- Recorded the owner's answers verbatim and created decisions D-003..D-026, including approval of architecture Option C (Next.js + PostgreSQL, TypeScript).
- Rewrote `REQUIREMENTS_REGISTER.md` with acceptance criteria. Added I18N (EN/JA), public-site and commerce requirements; promoted approved recommendations.
- Restructured `OPEN_QUESTIONS.md`: remaining questions on top, answered ones closed with verbatim responses.
- Documented the CMS configurability boundary (D-020) and the brand assets (D-005).
- Updated the implementation plan, project state, handoff, known issues, environment requirements and `CLAUDE.md`.
- No code, dependencies or schema added.

## 2026-10-14 — Phase 0: discovery

- Audited the repository. It contains only `README.md` (UTF-16) and the untracked playbook; no application code.
- Added `CLAUDE.md` with the agent rules, session protocol and document map.
- Added Phase 0 documents under `docs/`: `PROJECT_STATE.md`, `IMPLEMENTATION_PLAN.md`, `REQUIREMENTS_REGISTER.md`, `OPEN_QUESTIONS.md`, `DECISIONS.md`, `KNOWN_ISSUES.md`, `TEST_STATUS.md`, `SESSION_HANDOFF.md`, `ENVIRONMENT_REQUIREMENTS.md`, `CHANGELOG.md`.
- No code, dependencies, schema or configuration were added.
