# Session Handoff

**Session date:** 2026-10-14
**Current phase / milestone:** Phase 6 — foundation. **COMPLETE**; PR #3 open, CI green; GitGuardian false positive on commit `585196f` waiting on the owner (KI-11).
**Exact task in progress:** none.

## Completed (with evidence)

- DB-1 approved (D-049); DB-2/ARCH-1 defaults recorded from the same reply (D-050).
- Foundation built on branch `feature/phase-6-foundation`; local results: lint ✓, typecheck ✓, format ✓, unit 18/18, int 11/11, build ✓, E2E 8/8, drift check verified.

## How to run locally

`pnpm install` → `pnpm db:up` → `pnpm migrate` → `pnpm dev`. Tests: `pnpm test:unit`, `pnpm test:int`, `pnpm build && pnpm test:e2e`. A local `.env` exists on the owner's machine (git-ignored, random `PAYLOAD_SECRET`).

## Partial / unfinished

- GitGuardian incident 38202083 needs the owner (mark as test credential) or approval to squash the branch. Placeholder home page (KI-08). Console email (KI-09).

## Known gotchas

- Payload's in-process `payload.db.migrate()` cannot load `.ts` migrations; always use `pnpm migrate` (KI-10).
- Don't call `pool.end()` after Payload migrations in-process; it hangs. Run DB setup and fixtures in child processes (see `tests/int/global-setup.ts`, `tests/e2e/e2e-admin.ts`).
- pnpm 12 records build permissions under `allowBuilds` in `pnpm-workspace.yaml` (`pnpm approve-builds <pkg>`).
- Port 5432 is used by another Postgres on the owner's machine; the project uses 5433.

## Exact next step

Phase 7 per `docs/PROJECT_STATE.md` "Exact next task". Ask the owner for OPS-2b (admin MFA) and a Resend account when the email step is reached.
