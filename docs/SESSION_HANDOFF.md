# Session Handoff

**Session date:** 2026-10-15
**Current phase / milestone:** Phase 8 — shared frontend foundation. **COMPLETE.**
**Exact task in progress:** none.

## Completed (with evidence)

- Phase 8 on `feature/phase-8-frontend-foundation`: unit 78/78, integration 59/59, E2E 66/66 (+1 skipped: skip link on phones), Chrome desktop + iPhone Safari, axe clean in EN/JA.
- Screenshots reviewed (desktop and phone, EN and JA): no horizontal overflow; the route line draws; Japanese pages are fully Japanese.

## How to run locally

`pnpm db:up` → `pnpm migrate` → `pnpm dev` → http://localhost:3000 (redirects to /en). Tests: `pnpm test:unit`, `pnpm test:int`, `pnpm build && pnpm test:e2e`. Add `E2E_SERVER_LOGS=1` to see the app server's log during E2E.

## Known gotchas (new this phase)

- Call `setRequestLocale` in every layout and page under `[locale]`. next-intl caches the locale per request; a layout that translates first otherwise forces English.
- Never use `instanceof` for errors that may come from Payload or another route bundle (D-065).
- A Payload global must stay under ~80 localized fields (PostgreSQL 100-argument limit); add new label namespaces to `src/i18n/label-groups.ts`.
- Next.js adds its own `role="alert"` route announcer: scope test queries to `getByRole('main')`.
- Only one `next dev` may run per project folder; the owner usually has one on port 3000. Use `pnpm start -p <port>` on a build for extra servers.
- WebKit refuses `Secure` cookies on http://localhost; cookies are Secure only when `APP_URL` is https (D-064).

## Exact next step

Phase 9 per `docs/PROJECT_STATE.md` "Exact next task".
