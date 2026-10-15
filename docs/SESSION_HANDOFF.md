# Session Handoff

**Session date:** 2026-10-15
**Current phase / milestone:** Phase 9 — Admin CMS framework. **COMPLETE.**
**Exact task in progress:** none.

## Completed (with evidence)

- Phase 9 on `feature/phase-9-admin-cms`: unit 119/119, integration 102/102, E2E 82/82 (+1 skipped). Admin screenshots reviewed (login, dashboard, levels list, validation message under the field).

- Phase 8b on `feature/google-sign-in`: unit 102/102, integration 76/76, E2E 78/78 (+1 skipped). The return from Google is tested in integration tests with a stand-in token endpoint; E2E stops at Google's door.

- Phase 8 on `feature/phase-8-frontend-foundation`: unit 78/78, integration 59/59, E2E 66/66 (+1 skipped: skip link on phones), Chrome desktop + iPhone Safari, axe clean in EN/JA.
- Screenshots reviewed (desktop and phone, EN and JA): no horizontal overflow; the route line draws; Japanese pages are fully Japanese.

## How to run locally

`pnpm db:up` → `pnpm migrate` → `pnpm dev` → http://localhost:3000 (redirects to /en). Tests: `pnpm test:unit`, `pnpm test:int`, `pnpm build && pnpm test:e2e`. Add `E2E_SERVER_LOGS=1` to see the app server's log during E2E.

## Known gotchas (new this phase)

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
