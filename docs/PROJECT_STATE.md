# Project State

Current phase / milestone: **Phase 5 — Database design: IN REVIEW** (waiting for DB-1). Phases 0–4 are complete.
Overall status: **NOT STARTED** (no application code; planning, design and architecture documents only)
Last verified commit: see `git log` on branch `docs/phase-4-5-architecture` (PR to `main`). `main` = `22f6a07` (PR #1 merged).

## Work status

- **Verified complete (with evidence):**
  - Phases 0–2 (requirements, decisions D-001..D-045, stack).
  - Phase 3: Direction B "Tokyo Transit" approved; tagline "Practice Smart. Pass with Confidence."; logo variants approved (D-046..D-048). `docs/DESIGN_SYSTEM.md` finalized.
  - Phase 4: `docs/ARCHITECTURE.md`, `docs/API_DOCUMENTATION.md`. Payload facts checked against the official docs on 2026-10-14: sessions are on by default and revocable; `verify`, `maxLoginAttempts`/`lockTime`; jobs run with a separate `payload jobs:run` process; `beforeSchemaInit`/`afterSchemaInit` support custom tables and indexes; `payload.db.drizzle` is available.
- **Partial / unverified:** Phase 5 schema design is written but not approved; nothing has been applied. D-018 and D-020 remain interpretations the owner may amend.
- **In progress:** DB-1 approval (owner).
- **Remaining:** Phases 6–28.

## Changes

- Docs only. No application code, dependencies or migrations.

## Verification and blockers

- **Tests run:** none (no application code).
- **Blockers:** DB-1 (approve the database design).
- **Owner decisions open:** DB-2 (retention), ARCH-1 (3 s grace), OPS-2b, PA-6, PAY-3b, PAY-4b, CON-1b, TECH-5.
- **Owner action outside the code:** merchant onboarding (owner will do it later).
- **Exact next task:** after DB-1, run Phase 6 (playbook §11.7). Choose the Payload line (3.x stable vs 4.0 if GA); scaffold Next.js 16 + Payload with pnpm; Docker Compose Postgres; env validation; base collections from the approved schema; migrations; error handling; logger; `/healthz` and `/readyz`; Vitest + Playwright setup; GitHub Actions CI; `.gitignore` and `.env.example`; tests for config, health, DB connectivity and errors.
