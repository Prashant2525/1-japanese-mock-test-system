# Implementation Plan

Ordered milestones from playbook §9. Each phase may span several sessions. A phase is `COMPLETE` only when its exit criteria are verified and documented. **Blocking decisions** reference IDs in `docs/OPEN_QUESTIONS.md`.

Last updated: 2026-10-14 (Phase 1).

| # | Phase | Status | Blocking decisions / dependencies | Exit gate |
|---:|---|---|---|---|
| 0 | Repository and requirements discovery | **COMPLETE** (2026-10-14) | — | Repo audited; docs created; grouped questions issued. |
| 1 | Product rules and owner decisions | **COMPLETE** (2026-10-14) | — | Decisions D-003..D-026 recorded; acceptance criteria in `REQUIREMENTS_REGISTER.md`. Remaining questions are P2/P3 and deferred to their phases. |
| 2 | Technology alternatives and approval | **COMPLETE** (2026-10-14) — stack approved, D-033..D-045 | — | `TECH_STACK_OPTIONS.md` comparing the sub-choices (ORM, auth, i18n, styling/components, animation, forms/validation, storage, email, testing, monitoring, CI/CD, local DB); owner approval recorded in `DECISIONS.md`. |
| 3 | Visual direction, journeys, design-system plan | **COMPLETE** (2026-10-14) — Direction B approved (D-046..D-048) | — | Approved art direction; `UI_SCREEN_INVENTORY.md`; `DESIGN_SYSTEM.md`. |
| 4 | System architecture | **COMPLETE** (2026-10-14) — `ARCHITECTURE.md`, `API_DOCUMENTATION.md`; no blockers | — | `ARCHITECTURE.md`, `API_DOCUMENTATION.md`, repo structure. |
| 5 | Database/domain design | **COMPLETE** (2026-10-14) — approved (D-049, D-050) | — | Approved schema design in `DATABASE_ARCHITECTURE.md`. |
| 6 | Project/backend foundation | **COMPLETE** (2026-10-14) — PR #3 | — | Config, DB, migrations, errors/logging, health checks, baseline tests. |
| 7 | Authentication and authorization | **COMPLETE** (2026-10-14) — roles/permissions, admins with required authenticator codes, students, `/api/v1/auth`, rate limits, audit, bilingual emails; unit 36, int 55, E2E 19 | Resend domain verification (owner) before staging | Auth flows + permission tests pass. |
| 8 | Shared frontend foundation | **COMPLETE** (2026-10-15) — design tokens, fonts, logo variants, EN/JA routing + toggle, CMS label overrides, components, auth pages, student home; unit 78, int 59, E2E 66 (+1 skipped) on Chrome and iPhone Safari | — | Tokens/components/patterns with tests. |
| 8b | Continue with Google (owner request, D-066) | **COMPLETE** (2026-10-15) | Students only; CMS switch; KI-22 fixed |
| 9 | Admin CMS framework | **COMPLETE** (2026-10-15) — branded admin, menu groups, role-aware dashboard, reusable audit/validation patterns, exam catalogue end to end; unit 119, int 102, E2E 82 (+1 skipped) | Phase 7–8 | Admin shell + one verified E2E CRUD slice. |
| 10 | Student route gates | **COMPLETE** (2026-10-15) — server gate on study/attempts/results APIs and pages, level-check intro, student home and tabs; unit 125, int 117, E2E 92 (+1 skipped) | Phase 7 | Server-side determination gate + bypass E2E tests. |
| 11 | Level determination engine | **NEXT** | Phase 10 | All pass/fail branches, idempotency, race tests pass. |
| 12 | Study materials and media | NOT STARTED | Phase 9 | N5–N3 CRUD/publish/eligibility verified. |
| 13 | Examination configuration | NOT STARTED | Phase 9 | Data-driven catalogue with integrity tests. |
| 14 | Question bank and import/export | NOT STARTED | Phase 13; CON-1b | CRUD, versioning, validated import verified. |
| 15 | Mock-test builder | NOT STARTED | Phase 14 | Builder validation + version snapshots verified. |
| 16 | Student test runner | NOT STARTED | Phase 15 | Runner, server deadline, auto-submit E2E pass. |
| 17 | Results and review | NOT STARTED | Phase 16 | Scoring unit tests + history/authorization tests. |
| 18 | Public site and dynamic pages | NOT STARTED | Phase 8–9; PA-6 (translation reviewer); agent drafts EN+JA copy (D-006) | CMS change reaches site without deploy. |
| 19 | Products, checkout, entitlements | NOT STARTED | PAY-4b | Server-priced orders, tamper tests. |
| 20 | Shared payment foundation | NOT STARTED | Phase 19; PAY-3b | Payment abstraction, state machine, runbook. |
| 21 | eSewa | NOT STARTED | Phase 20; sandbox access | Sandbox evidence recorded. |
| 22 | Khalti | NOT STARTED | Phase 20; sandbox access | Sandbox evidence recorded. |
| 23 | connectIPS | NOT STARTED | Phase 20; NCHL/bank onboarding | Test-environment evidence recorded. |
| 24 | Approved secondary features | NOT STARTED | Contact form/email (D-023); REC-04/05/09/10 if approved | Only approved items, tested. |
| 25 | Integration and E2E regression | NOT STARTED | Phases 6–24 | Critical journeys pass. |
| 26 | Security/performance/accessibility | NOT STARTED | Phase 25 | Verified defects fixed; risks documented. |
| 27 | Deployment and operations | NOT STARTED | TECH-5; Phase 26 | Deployment/backup/restore/rollback runbooks. |
| 28 | Final audit and release | NOT STARTED | Phase 27 | Evidence-based audit; owner go/no-go. |

## Notes

- **Long-lead external dependency:** merchant onboarding for eSewa, Khalti and connectIPS (D-019, PAY-3b) needs registered-business documents and may take weeks. The owner should start it now, in parallel with Phases 2–18.
- **Cross-cutting from Phase 1:** bilingual EN/JA (D-004) affects Phases 3, 4, 5, 8 and every CMS module. The CMS configurability boundary (D-020) applies to every admin module.
- Phases 12–18 can partly overlap once Phases 9–11 are complete; follow the dependency column.
- If a phase cannot finish within one session, split it into a named sub-task here before stopping.
