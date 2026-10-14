# Session Handoff

**Session date:** 2026-10-14
**Current phase / milestone:** Phase 7 — auth, roles and permissions. **COMPLETE except admin MFA** (OPS-2b).
**Exact task in progress:** none.

## Completed (with evidence)

- README re-encoded to UTF-8 on the Phase 6 branch (`6ffe9ac`, part of PR #3).
- Phase 7 on branch `feature/phase-7-auth` (stacked on PR #3). Local results: unit 36/36, integration 49/49, E2E 16/16; lint, typecheck, format and build are clean.

## How to run locally

`pnpm db:up` → `pnpm migrate` → `pnpm dev`. Create an admin: `pnpm admin:create --email you@example.com --name "You"`. The set-password link is printed in the server log (console transport). Tests: `pnpm test:unit`, `pnpm test:int`, `pnpm build && pnpm test:e2e`.

## Known gotchas (new this phase)

- `next build` always runs with NODE_ENV=production. Use `APP_ENV` for deployment-specific rules (D-052).
- Payload ignores the session cookie without same-origin browser signals. Tests send `Sec-Fetch-Site: same-origin` (the `browser` option in `tests/int/helpers.ts`), and E2E calls the API with `fetch` from inside the page.
- Generated types require select fields that have defaults. Pass `status`, `preferredLocale` and `determinationStatus` when creating records with the Local API.
- Python on Windows cannot see Git Bash `/tmp`, and long inline heredocs sometimes break Git Bash parsing. Put helper scripts in the scratchpad and pass Windows paths.
- Write files with LF endings; `.gitattributes` enforces LF in the repository.

## Partial / unfinished

- Admin MFA (OPS-2b). Real email delivery is untested until a Resend account exists.

## Exact next step

Phase 8 per `docs/PROJECT_STATE.md` "Exact next task".
