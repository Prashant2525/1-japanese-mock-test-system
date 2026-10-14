# Known Issues, Ambiguities and Risks

Last updated: 2026-10-14 (Phase 6).

## Repository issues

| ID | Severity | Issue | Evidence | Proposed action |
|---|---|---|---|---|
| KI-01 | ~~Low~~ **Resolved (Phase 6)** | `README.md` was UTF-16 LE encoded, so it shows as garbled bytes in many tools and diffs. Content is only `# 1-japanese-mock-test-system`. | Raw output shows a BOM and interleaved null bytes. | Re-save as UTF-8 with real project info when the owner approves (Phase 6 at the latest). |
| KI-02 | ~~Low~~ **Resolved (PR #1)** | The playbook was untracked in Git. | `git status --porcelain` → `?? JAPANESE_MOCK_TEST_SYSTEM_PRODUCTION_BUILD_PLAYBOOK.md` | Commit the playbook and Phase 0 docs when the owner asks. |
| KI-03 | ~~Low~~ **Resolved (Phase 6)** | No `.gitignore`. A `.env` could be committed accidentally once development starts. | Directory listing. | Add a stack-appropriate `.gitignore` (including `.env*` except `.env.example`) in Phase 6. |
| KI-07 | Low | The supplied logo files carry the old tagline "PRACTICE SMART. PASS JLPT." | Logo SVG/PNG. | New lockups with the D-047 tagline are produced in Phase 8 (D-048); originals kept. |
| KI-05 | Low | The logo SVG wordmark uses live `<text>` with `font-family="Inter, Arial…"`, so it renders differently on machines without Inter. | `nihongo-mock-logo.svg` source. | In Phase 3/8, outline the wordmark text to paths (or self-host Inter) for consistent rendering. Do not alter the design itself. |
| KI-06 | Info | New untracked folder `nihongo-mock-logo-assets/` (brand assets, D-005). | `git status`. | Copy into the app's public assets in Phase 8; commit when the owner asks. |
| KI-08 | Info | The home page is a temporary placeholder ("The website is being built."), hard-coded and English-only. | `src/app/(frontend)/page.tsx` | Replaced by CMS-driven, bilingual pages in Phase 8/18. Must not reach production. |
| KI-09 | Info | Payload logs "No email adapter provided"; emails go to the console. | Server logs | Phase 7 adds the Resend adapter (console fallback in development and tests). |
| KI-10 | Low | Payload's migration runner cannot load `.ts` migration files outside its own CLI. | Integration test setup failed when calling `payload.db.migrate()` in-process. | Tests and deployments run `pnpm migrate` (the CLI) in a separate process. Documented in `tests/int/global-setup.ts`. |
| KI-04 | Info | The owner's master prompt names the file `Japanese_Mock_Test_System_Production_Build_Playbook.md`; on disk it is upper-case `JAPANESE_MOCK_TEST_SYSTEM_PRODUCTION_BUILD_PLAYBOOK.md`. Same document. | Directory listing. | No action; `CLAUDE.md` uses the real filename. |

## Requirement ambiguities

All ambiguities are resolved (2026-10-14).

| ID | Ambiguity | Linked question / resolution |
|---|---|---|
| AMB-01 | Results are generated after level determination, but the Results section is locked until determination completes. The post-determination screen is undefined. | LD-5 → **resolved D-012** |
| AMB-02 | Determination progresses "N5 → N4 → N3 and then any further approved levels", but materials stop at N3. The highest evaluation stage is undefined. | LD-1 → **resolved D-008** |
| AMB-03 | JFT labels A1, A2.1, A2.2, A2 mix sub-levels and a parent level. These look like *Irodori* course levels (A1, A2.1, A2.2) plus the JFT-Basic A2 judgement, so the hierarchy is unclear. | MT-1 → **resolved D-014** (JFT levels owner-editable in CMS) |
| AMB-04 | NAT-TEST officially uses 5Q–1Q, while the requirement lists N5–N1 for NAT. | MT-1 → **resolved D-014** |
| AMB-05 | Mock-test eligibility relative to the assigned level is unspecified. | MT-2 → **resolved D-015** |
| AMB-06 | The stack preference mentions MERN (MongoDB) together with PostgreSQL and Next.js. These are different architecture layers and partly conflicting choices. | TECH-1 → **resolved D-025** |
| AMB-07 | Owner answered "make it entirely manageable from CMS" for most rules, which could be read as making safety invariants and secrets CMS-editable. | **Interpreted in D-020**; owner may amend. |
| AMB-08 | MT-4 (mock-test pause/resume, one active attempt) was left blank. | MT-4 → **resolved D-027** |

## Risks

| ID | Risk | Impact | Mitigation |
|---|---|---|---|
| RISK-01 | Merchant onboarding for eSewa/Khalti/connectIPS needs a registered business and can take weeks. connectIPS often requires NCHL/bank involvement. | Blocks Phases 21–23 and paid launch. | Start onboarding early (PAY-3). Payment phases are marked `BLOCKED`, not complete, until sandbox access exists. |
| RISK-02 | Using copyrighted official exam questions, or implying official JLPT/NAT/JFT affiliation. | Legal/takedown risk. | CON-2 confirmation; a "not affiliated" notice on public pages (owner-approved wording). |
| RISK-03 | Question content volume is unknown. A launch with an empty or thin catalogue is low value even if the software works. | Launch readiness. | CON-1: plan content production in parallel; the import tool (Phase 14) is the main loading path. |
| RISK-05 | Bilingual EN/JA requirement doubles content-authoring work for every CMS field and page; Japanese drafts written by the agent need native review. | Launch content quality. | PA-6 reviewer; JA fields allowed to fall back (PA-5) during authoring; release audit checks for missing translations. |
| RISK-06 | Logo tagline "PASS JLPT" may read as a results promise, and omits NAT/JFT. | Messaging/claims. | **Closed**: tagline changed to "Practice Smart. Pass with Confidence." (D-047). |
| RISK-07 | Rich motion/parallax (D-029) can hurt performance on low-end phones and accessibility. | Slow pages, motion sickness. | Reduced-motion variant, performance budget UX-R03, heavy animation code loaded only on marketing routes. |
| RISK-08 | Payload CMS v4 entered beta (Oct 2026). If Payload is approved, a major upgrade may land during the build. | Upgrade effort. | Decide in Phase 6 whether to start on 3.x stable or v4 once it is GA; keep domain logic framework-independent. |
| RISK-04 | Timer/auto-submit correctness under disconnects and multiple tabs. | Disputed results. | Server-authoritative deadline + idempotent finalization (MT-R06); policy MT-4. |
