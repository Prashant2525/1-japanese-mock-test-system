# Session Handoff

**Session date:** 2026-10-15
**Current phase / milestone:** Phase 12 — Study materials and media. **COMPLETE.** Next: Phase 13 — Examination configuration.
**Exact task in progress:** none. Reference review (2026-10-16) recorded; **waiting for the owner's RV-7 answer** (deletion policy), then Phase 12b (`IMPLEMENTATION_PLAN.md`), then Phase 13. Start 12b by writing the failing tests for KI-39..KI-41.

## Completed (with evidence)

- Phase 12 on `feature/phase-12-study-library`: unit 182/182, integration 170/170, E2E 126/126 + 1 skipped (incl. the admin journey: an editor uploads a PDF, publishes a material, a student opens it). Screenshots reviewed: study list (filters, EN/JA, iPhone), material detail (furigana, files), admin categories / materials / media library.

- Phase 11 on `feature/phase-11-level-check`: unit 161/161, integration 149/149, E2E 119/119 + 1 skipped. Screenshots reviewed: intro, stage runner (desktop/iPhone, EN/JA), review dialog, between stages, Your level, admin Questions / Level check settings / published versions / student reset.

- Phase 10 on `feature/phase-10-route-gates`: unit 125/125, integration 117/117, E2E 92/92 (+1 skipped). Screenshots reviewed: level check (desktop), Japanese home and header (iPhone), study empty state.

- Phase 9 on `feature/phase-9-admin-cms`: unit 119/119, integration 102/102, E2E 82/82 (+1 skipped). Admin screenshots reviewed (login, dashboard, levels list, validation message under the field).

- Phase 8b on `feature/google-sign-in`: unit 102/102, integration 76/76, E2E 78/78 (+1 skipped). The return from Google is tested in integration tests with a stand-in token endpoint; E2E stops at Google's door.

- Phase 8 on `feature/phase-8-frontend-foundation`: unit 78/78, integration 59/59, E2E 66/66 (+1 skipped: skip link on phones), Chrome desktop + iPhone Safari, axe clean in EN/JA.
- Screenshots reviewed (desktop and phone, EN and JA): no horizontal overflow; the route line draws; Japanese pages are fully Japanese.

## How to run locally

`pnpm db:up` → `pnpm migrate` → `pnpm dev` → http://localhost:3000 (redirects to /en). Tests: `pnpm test:unit`, `pnpm test:int`, `pnpm build && pnpm test:e2e`. Add `E2E_SERVER_LOGS=1` to see the app server's log during E2E.

## Known gotchas (new this phase)

- Study media: tests upload into their own folders (integration: temp dir; E2E: `media/e2e-learning`); the dev folder is `media/learning`. Both git-ignored. An empty env value counts as unset (`||`, not `??`).
- The `/api/v1` session check wants the browser's fetch metadata: in E2E, fetch protected files from the page (`page.evaluate(fetch)`), not with `page.request`.
- Payload admin selectors: rich text `[data-lexical-editor="true"]`, selects `.rs__option`, save/publish `#action-save`.
- Integration data accumulates between runs; tests that list things must filter by their run ID, and the study spec clears earlier runs' materials first.
- Headless Chromium has no PDF viewer and the test MP3 has no audio (KI-38): blank PDF frame / audio "Error" in sweep screenshots are expected.

- Browser tests and `pnpm sweep` use the `nihongo_mock_e2e` database (D-078); global setup publishes the sample level check there.
- Payload checks relationship `filterOptions` with the caller's access: scripts that publish the level check must pass a real admin `user` (see the seed script).
- Numeric columns come back as strings from raw SQL: cast (`::int`, `::float8`) in queries. Browser sequence numbers are millisecond timestamps.
- Playwright empties `test-results/` each run; the sweep writes to `sweep-results/`.

- Before every report: `pnpm build && pnpm sweep`, then review `sweep-results/<browser>/*.png` and the `*.json` landing lists (owner requirement, D-076).
- E2E URL checks: compare the exact pathname (`new URL(page.url()).pathname`); a regex ending in `/en/app$` also matches `/en/en/app`.
- Logging out in E2E: use `logOut(page)` / `openMyPage(page)` (they open the phone Menu when needed).

- Pages: read the session with `currentStudentForPage(await headers())`, never `currentStudent` (KI-29). APIs: `requireStudent` / `requireStudentWithLevel`.
- The dev server can show "Couldn't find next-intl config file" after many files change at once (e.g. a branch switch); restart `pnpm dev`.

- Student pages: call `studentPage(locale, area)` first; APIs: call `requireStudentWithLevel(headers)` first (before reading the body).
- E2E: `createConfirmedStudent()` / `setStudentLevel()` stand in for sign-up and the Phase 11 service; `studentLogin()` waits for the student area.

- New admin modules: follow ARCHITECTURE §9a. Put cross-record rules in field validators; a ValidationError thrown from a hook works only because Payload is now external (D-071), and field validators show the message under the field anyway.
- Seed data in migrations must be plain SQL (KI-26). To check a migration from zero: create an empty database in the Docker Postgres, run `DATABASE_URL=…/that_db pnpm migrate`, compare, drop it.
- If Docker Desktop is closed, `pnpm db:up` fails with a pipe error: start Docker Desktop first (it was closed once this session).
- The admin E2E uses four fixture admins (Super Admin, Content Editor, Support, an un-enrolled Support).

- Playwright's `page.route` does not intercept the second hop of a redirect in Chromium; capture the redirect with `route.fetch({ maxRedirects: 0 })` instead.
- Pages that show CMS-controlled content must be rendered per request (check the `pnpm build` route list for `●`).

- Call `setRequestLocale` in every layout and page under `[locale]`. next-intl caches the locale per request; a layout that translates first otherwise forces English.
- Never use `instanceof` for errors that may come from Payload or another route bundle (D-065).
- A Payload global must stay under ~80 localized fields (PostgreSQL 100-argument limit); add new label namespaces to `src/i18n/label-groups.ts`.
- Next.js adds its own `role="alert"` route announcer: scope test queries to `getByRole('main')`.
- Only one `next dev` may run per project folder; the owner usually has one on port 3000. Use `pnpm start -p <port>` on a build for extra servers.
- WebKit refuses `Secure` cookies on http://localhost; cookies are Secure only when `APP_URL` is https (D-064).

## Exact next step

Phase 9 per `docs/PROJECT_STATE.md` "Exact next task".
