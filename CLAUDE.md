# CLAUDE.md — Japanese Mock Test System

Permanent instructions for Claude Code (and any coding agent) working in this repository.

## Source of truth

1. **Operating manual:** [`JAPANESE_MOCK_TEST_SYSTEM_PRODUCTION_BUILD_PLAYBOOK.md`](JAPANESE_MOCK_TEST_SYSTEM_PRODUCTION_BUILD_PLAYBOOK.md) (v1.1). It defines the phases (0–28), approval gates, security rules, testing standards, resume and handoff procedures. Follow it phase by phase.
2. **Implementation truth:** the actual repository — code, migrations, tests, `git status`/history. Documents and chat history never outrank what the code and tests show.
3. **Authority on decisions:** the owner. Unresolved product rules and approval-gated technical choices are the owner's to make. Never present a proposal as approved.

## Session start protocol (every session)

1. Read this file, then `docs/PROJECT_STATE.md`, `docs/SESSION_HANDOFF.md`, `docs/DECISIONS.md`, `docs/OPEN_QUESTIONS.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/REQUIREMENTS_REGISTER.md`, `docs/KNOWN_ISSUES.md`, `docs/TEST_STATUS.md`.
2. Read the playbook section for the current phase (§11) and any sections it depends on.
3. Inspect the repository tree, `git status`, recent history/diffs, package scripts, migrations, tests, `.env.example`.
4. Reconcile the documents with the real code before changing anything. If they disagree, the code wins and the documents get corrected.
5. Work only on the current authorized phase/sub-task. Do not start a later phase whose gate has not passed.
6. If a session is resuming after a rate limit/interruption, use playbook §12.1 — do not assume the previous session finished anything.

## Current status

- **Phase:** Phases 0–7 complete (Phase 7 except admin MFA, which waits on OPS-2b). Next: Phase 8 (shared frontend foundation). The approved database design is in `docs/DATABASE_ARCHITECTURE.md`; add tables only through migrations. Design direction B "Tokyo Transit" is binding (`docs/DESIGN_SYSTEM.md`). Architecture rules: `docs/ARCHITECTURE.md` §2 (pure domain module, services own state changes).
- **Owner priorities:** showcase-quality animated UI with parallax (D-029) and **everything manageable from the Admin CMS** (D-030); hard-coded user-facing content is a defect.
- **Product:** brand **Nihongo Mock**; Nepal market, NPR; UI in **English + Japanese** with a navbar toggle (D-003..D-005). Brand assets: `nihongo-mock-logo-assets/nihongo_mock_logo/`.
- **Stack:** approved top level — **Next.js + PostgreSQL, TypeScript**, one integrated app with a server-side service layer (D-025). Approved sub-choices: Payload CMS embedded, Payload/Drizzle on Postgres, Payload auth, next-intl, Tailwind v4, GSAP + Motion, R2, Resend, Vitest/Playwright, Docker (D-033..D-045). Hosting still open (TECH-5).
- **Commands:** `pnpm db:up` (Postgres on 5433) · `pnpm migrate` · `pnpm dev` · `pnpm lint` · `pnpm typecheck` · `pnpm format:check` · `pnpm test:unit` · `pnpm test:int` · `pnpm build && pnpm test:e2e` · `pnpm migrate:create <name>` after any Payload config change (CI fails on schema drift).
- **Versions:** Payload 3.90.2, Next.js 16.3.8, PostgreSQL 17, Node 24, pnpm 12 (D-051).

## Status labels

`CONFIRMED` (owner stated) · `PROPOSED - APPROVAL REQUIRED` · `OPEN DECISION` · `TECHNICAL SAFETY RULE` · `VERIFIED` (backed by tests/evidence).
Work-item status: `COMPLETE` / `PARTIAL` / `MISSING` / `BROKEN` / `BLOCKED` / `UNVERIFIED`. Never mark `COMPLETE` without evidence (passing tests, reproducible E2E flow, DB/API check, or provider sandbox verification).

## Permanent rules (playbook Appendix A + §15)

1. Never silently invent requirements, business rules, prices, thresholds, scoring rules, credentials, provider behaviour or user-facing claims. Record them in `docs/OPEN_QUESTIONS.md` and ask.
2. Compare major stack choices and wait for owner approval before locking them.
3. Enforce level determination, authorization and eligibility on the **server**. UI hiding is not a security control.
4. Never trust client-supplied user ID, level, price, marks, score, payment status or completion flags.
5. Calculate scores and level determination on the server from a versioned configuration; make submit/finalize/payment-callback flows idempotent and race-safe.
6. Preserve the historical meaning of completed attempts (question/test/scoring snapshots or versions).
7. Payments (eSewa, Khalti, connectIPS): server-created orders and prices; verify with the provider server-side; a return URL is never proof of payment; grant entitlements only after verified success.
8. Never fabricate or commit secrets. `.env.example` holds names and placeholders only; real `.env` is git-ignored; production secrets live in the host's secret manager.
9. Real database/API behaviour in production paths. Mocks only in isolated tests or clearly labelled dev environments.
10. Validate imported content and uploaded media before publication; restricted media uses private/signed access.
11. CMS changes are permission-checked server-side and auditable; archive instead of destructive delete where history depends on a record.
12. No fake testimonials, ratings, analytics, success claims or official NAT/JLPT/JFT affiliation.
13. Follow the approved design system, accessibility and reduced-motion guidance; exam screens stay low-distraction.
13c. **Auth rules:** students authenticate only through `/api/v1/auth/*` (Payload's student auth endpoints are blocked in `src/proxy.ts`). Every admin permission check goes through `can()` in `src/server/auth/permissions.ts`; add new permission keys there. Every sensitive change writes an audit event (`recordAudit`). Every `/api/v1` handler uses `withRoute` (request ID, error model, CSRF).
13a. **CMS configurability boundary (D-020):** values, toggles, catalogue, bilingual content and roles are CMS-editable; safety invariants (N5-first sequential determination, server authority, no answer exposure during attempts, server payment verification, audit, non-editable results) and secrets are not. Scoring-affecting config is versioned and applies to new attempts only.
13b. **Bilingual (D-004):** no hard-coded single-language UI strings; every CMS-managed user-facing text field stores EN and JA.
14. Do not add unapproved features (social login, SMS/OTP, subscriptions, coupons, refunds, certificates, leaderboards, AI tutoring, forums, mobile apps, offline mode, blog, push notifications, etc.). Propose them in the requirements register and ask.
15. Run relevant tests and report actual output before claiming work is complete.
16. Update `docs/PROJECT_STATE.md`, `docs/SESSION_HANDOFF.md`, `docs/TEST_STATUS.md`, `docs/KNOWN_ISSUES.md`, `docs/CHANGELOG.md` (and requirements/decisions/questions when they change) at every safe stopping point.

## Repository notes

- Git remote: `origin` → `https://github.com/Prashant2525/1-japanese-mock-test-system.git`, branch `main`.
- Do not commit or push unless the owner asks.
- `README.md` is currently UTF-16 encoded (see `docs/KNOWN_ISSUES.md`); convert to UTF-8 only when the owner approves touching it.

## Document map

| File | Purpose |
|---|---|
| `docs/PROJECT_STATE.md` | Actual state and next task |
| `docs/IMPLEMENTATION_PLAN.md` | Phases 0–28, gates, dependencies, progress |
| `docs/REQUIREMENTS_REGISTER.md` | Confirmed requirements, proposals, safety rules, traceability |
| `docs/OPEN_QUESTIONS.md` | Owner decisions pending, with IDs |
| `docs/DECISIONS.md` | Approved decisions with date and rationale |
| `docs/SESSION_HANDOFF.md` | Exact continuation point for the next session |
| `docs/KNOWN_ISSUES.md` | Verified issues, ambiguities, risks |
| `docs/TEST_STATUS.md` | Test commands, results, gaps |
| `docs/ENVIRONMENT_REQUIREMENTS.md` | Provisional external services / env variable inventory (names only) |
| `docs/CHANGELOG.md` | Material changes |
| `docs/TECH_STACK_OPTIONS.md` | Phase 2 stack comparison (approved) |
| `docs/UI_SCREEN_INVENTORY.md` | Every screen, its states and data |
| `docs/DESIGN_SYSTEM.md` | Approved design system (Direction B) |
| `docs/ARCHITECTURE.md` | System architecture, layers, flows, repo structure |
| `docs/API_DOCUMENTATION.md` | API conventions, error model, endpoint catalogue |
| `docs/DATABASE_ARCHITECTURE.md` | Data model, constraints, snapshots, migrations |
| `docs/design/visual-directions.html` | Preview used to choose Direction B |

Later phases add: `PAYMENT_INTEGRATION_RUNBOOK.md` (Phase 20), `PRODUCTION_READINESS_AUDIT.md` and `RELEASE_READINESS.md` (Phase 28).
