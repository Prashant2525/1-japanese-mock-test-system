# Changelog

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
