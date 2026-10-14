# Session Handoff

**Session date:** 2026-10-14
**Current phase / milestone:** Phase 7 — auth, roles and permissions. **COMPLETE** (with required admin two-factor login).
**Exact task in progress:** none.

## Completed (with evidence)

- README re-encoded to UTF-8 on the Phase 6 branch (`6ffe9ac`, part of PR #3).
- Phase 7 is on `feature/phase-7-auth` (PR #5 to `main`). Phase 7b (admin two-factor login, env files, `email:check`) is on `feature/phase-7b-admin-mfa` (PR to `main`, which includes Phase 7). Local results: unit 36/36, integration 55/55, E2E 19/19.

## How to run locally

`pnpm db:up` → `pnpm migrate` → `pnpm dev`. Create an admin: `pnpm admin:create --email you@example.com --name "You"`. The set-password link is printed in the server log (console transport). Tests: `pnpm test:unit`, `pnpm test:int`, `pnpm build && pnpm test:e2e`.

## Known gotchas (new this phase)

- `next build` always runs with NODE_ENV=production. Use `APP_ENV` for deployment-specific rules (D-052).
- Payload ignores the session cookie without same-origin browser signals. Tests send `Sec-Fetch-Site: same-origin` (the `browser` option in `tests/int/helpers.ts`), and E2E calls the API with `fetch` from inside the page.
- Generated types require select fields that have defaults. Pass `status`, `preferredLocale` and `determinationStatus` when creating records with the Local API.
- Python on Windows cannot see Git Bash `/tmp`, and long inline heredocs sometimes break Git Bash parsing. Put helper scripts in the scratchpad and pass Windows paths.
- Write files with LF endings; `.gitattributes` enforces LF in the repository.
- Admin logins in E2E need a TOTP code: use `adminLogin()` from `tests/e2e/admin-login.ts` (fills the plugin's one-time-code input after `networkidle`).
- After network calls, scripts set `process.exitCode` rather than calling `process.exit()` (Windows crash, KI-12).
- The owner may have `pnpm dev` running on port 3000; E2E uses 3100.
- E2E credentials travel as one JSON variable (`E2E_FIXTURE`, read with `fixture()`), which avoids secret-scanner false positives. The fixture clears rate-limit counters for the E2E accounts, so repeated local runs don't trip the 10-logins-per-15-minutes limit.

## Partial / unfinished

- Real email delivery is untested until the owner verifies a sending domain in Resend (KI-18).

## Exact next step

Phase 8 per `docs/PROJECT_STATE.md` "Exact next task".
