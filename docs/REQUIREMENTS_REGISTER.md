# Requirements Register

Traceability register for **Nihongo Mock** (Japanese Mock Test System). Sources are playbook sections (`PB §x.y`), owner answers (question IDs) and decisions (`D-xxx` in `docs/DECISIONS.md`).

**Status values:** `CONFIRMED` · `CONFIRMED – DETAIL OPEN` (an open question remains) · `PROPOSED - APPROVAL REQUIRED` · `TECHNICAL SAFETY RULE` · `OUT OF SCOPE UNTIL APPROVED`.
**Implementation status:** everything is `NOT STARTED` (no code yet). The acceptance criteria (AC) are what tests must later prove.

Last updated: 2026-10-14 (Phase 1 addendum).

---

## 1. Product baseline

| ID | Requirement | Source | Status | Acceptance criteria |
|---|---|---|---|---|
| PRD-01 | Production full-stack web app: public site, student area, Admin CMS, server logic, PostgreSQL, payments. | PB §2.1; D-002 | CONFIRMED | PB §18 definition of done. |
| PRD-02 | Premium, polished, responsive visual identity built on the Nihongo Mock brand assets. | PB §6; D-005 | CONFIRMED | Approved Phase 3 direction applied consistently; PB §20.5 review passes. |
| PRD-03 | Stack: Next.js + PostgreSQL, TypeScript, single integrated app with an API-clean service layer; Payload CMS embedded; full stack per D-033..D-045. | D-025, D-033..D-045 | CONFIRMED | Phase 6 foundation builds and passes CI with these choices. |
| PRD-04 | eSewa, Khalti and connectIPS payments for approved purchases. | PB §8.3; D-019 | CONFIRMED – DETAIL OPEN (PAY-3b, PAY-4b) | PB §16.5 per provider with sandbox evidence. |
| PRD-05 | Routine content and supported settings are CMS-managed, within the D-020 boundary. | PB §5.16; D-007, D-020 | CONFIRMED | A CMS change to any configurable item reaches students without a deployment; safety invariants cannot be changed through the CMS. |
| PRD-06 | Market Nepal, NPR, Asia/Kathmandu. | D-003 | CONFIRMED | Prices shown in NPR; dates shown in Asia/Kathmandu and stored in UTC. |

## 2. Internationalisation (I18N)

| ID | Requirement | Source | Status | Acceptance criteria |
|---|---|---|---|---|
| I18N-R01 | UI available in English and Japanese, with a navbar toggle on public, student and admin surfaces; English for first-time visitors; JA falls back to EN. | D-004, D-028, D-061 | CONFIRMED · **implemented (Phase 8)** on public and student pages; the admin panel has Payload's own EN/JA switch | Toggling switches all UI strings; the choice persists across navigation and sessions; no hard-coded single-language strings in components. |
| I18N-R02 | Every CMS-managed user-facing text field stores EN and JA values. | D-004 | CONFIRMED | Admin forms show both locales; the student API returns the requested locale, falling back to EN (D-028). |
| I18N-R03 | The locale model allows adding further languages later without schema redesign. | D-004 | CONFIRMED | Adding a locale needs no table-per-language change. |
| I18N-R04 | Japanese learning content renders correctly regardless of UI language, including optional furigana. | D-024; PB §6.3 | CONFIRMED | Kanji/kana render with proper font fallback and wrapping; ruby text displays when present. |

## 2b. Experience and motion (UX)

| ID | Requirement | Source | Status | Acceptance criteria |
|---|---|---|---|---|
| UX-R01 | Showcase-quality public and student UI: scroll-driven reveals, parallax layers, section/page transitions, micro-interactions. | D-029 | CONFIRMED | Phase 3 direction approved by the owner; motion implemented on the approved pages. |
| UX-R02 | Reduced-motion users get a calm version; motion never hides content or delays CTAs. | D-029; PB §6.4 | TECHNICAL SAFETY RULE | E2E with `prefers-reduced-motion: reduce` shows no parallax/scroll animations; all content visible without scrolling triggers. |
| UX-R03 | Performance budget: Core Web Vitals "good" (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1) on a mid-range phone profile for key public pages. | D-029 | CONFIRMED | Lighthouse/field checks in Phase 26. |
| UX-R04 | Exam runner stays calm: no decorative motion; timer and question text never animate in ways that harm reading. | PB §6.1, §6.4; D-029 | TECHNICAL SAFETY RULE | Design review + E2E snapshot of the runner. |

## 3. Level determination (LD)

| ID | Requirement | Source | Status | Acceptance criteria |
|---|---|---|---|---|
| LD-R01 | On first login without a determined level, the student is sent straight to Level Determination. | PB §2.2 | CONFIRMED | PB §16.2 #1. |
| LD-R02 | Study Materials, Mock Tests and Results are denied by the server until determination completes. | PB §2.2, §4.3 | CONFIRMED | PB §16.2 #2–3: direct API calls, edited URLs, forged bodies and local-storage changes are all rejected. |
| LD-R03 | Determination always starts at N5; no level choice or skipping (fixed invariant, not CMS-editable). | PB §2.2; D-020 | CONFIRMED | PB §16.2 #4; the CMS rejects a config whose first stage is not N5 or whose stages have gaps. |
| LD-R04 | Launch stages N5 → N4 → N3; pass ≥ the stage threshold → next stage; stop at first failure. | D-008, D-009 | CONFIRMED | PB §16.2 #5–6; boundary tests at threshold −ε, exactly the threshold, and above it. |
| LD-R05 | Assign the highest passed level; fail N5 → N5/Beginner; pass the highest enabled stage → that level. | PB §2.2; D-008 | CONFIRMED | Tests for every branch: fail N5, pass N5 fail N4, pass N4 fail N3, pass all three. |
| LD-R06 | Later logins go straight to the normal interface. | PB §2.2 | CONFIRMED | PB §16.2 #8. |
| LD-R07 | Per-stage threshold, duration and fixed question set are managed in the CMS and versioned; each attempt records the version it used. | D-009, D-010, D-011 | CONFIRMED | Changing the threshold mid-determination doesn't alter a stage already started; history shows the config version. |
| LD-R08 | Unanswered = wrong; score compared to threshold without rounding. | D-009 | CONFIRMED | Unit tests on the scoring function. |
| LD-R09 | Timed stages with a server deadline; interruption resumes with the original deadline; expiry auto-submits exactly once. | D-010 | CONFIRMED | Reload/close/reopen tests; concurrent finalize requests produce one result. |
| LD-R10 | "Your level" summary screen after the final stage (CMS-managed copy); determination attempts then appear in Results history with answer review. | D-012 | CONFIRMED | E2E: final stage → summary → dashboard; Results lists determination attempts. |
| LD-R11 | Reassessment only through an audited admin reset with a reason; level override by Super Admin only, with a reason and audit entry. | D-013 | CONFIRMED | Non-Super-Admin override is denied (403); the audit row has actor, reason, before/after. |
| LD-R12 | N2/N1 stages can be enabled later through the CMS; levels not enabled are never shown or assigned. | D-008 | CONFIRMED | With N2 disabled, no UI or API exposes N2 as a determination outcome; enabling it in a test environment extends the sequence without code changes. |
| LD-R13 | Server is authoritative; finalization is idempotent; the history of every stage attempt is preserved. | PB §4.3 | TECHNICAL SAFETY RULE | PB §16.2 #9–10. |

## 4. Study materials (SM)

| ID | Requirement | Source | Status | Acceptance criteria |
|---|---|---|---|---|
| SM-R01 | Accessible only after determination. | PB §2.2 | CONFIRMED | Covered by LD-R02. |
| SM-R02 | Materials only for **enabled** levels (N5, N4, N3 at launch); level availability is data-driven. | PB §2.2; D-008 | CONFIRMED | No N2/N1 material is returned while those levels are disabled. |
| SM-R03 | Students see current-level and lower-level materials; they cannot change their level. | PB §2.2; D-015 | CONFIRMED | An N4 student gets N4+N5 but not N3; a manipulated level parameter is ignored. |
| SM-R04 | Categories Listening, Grammar, Reading, Kanji (more can be added through the CMS). | PB §2.2; D-007 | CONFIRMED | A category added in the CMS appears without deployment. |
| SM-R05 | Text, image, audio and PDF/document content; audio playback for Listening; bilingual titles/descriptions. | PB §2.2; D-004 | CONFIRMED | Each media type is uploaded, published and rendered; the audio player is keyboard-accessible. |
| SM-R06 | Upload validation; unpublished items hidden; all UI states present. | PB §4.4 | TECHNICAL SAFETY RULE | PB §16.4. |

## 5. Mock tests (MT)

| ID | Requirement | Source | Status | Acceptance criteria |
|---|---|---|---|---|
| MT-R01 | Mock tests are separate from Level Determination. | PB §2.2 | CONFIRMED | Separate config and attempt records. |
| MT-R02 | CMS-managed catalogue: JLPT N5–N1; NAT 5Q–1Q mapped to N-levels; JFT A1, A2.1, A2.2, A2 (owner-editable). Only enabled levels are shown. | D-014 | CONFIRMED | Catalogue edits appear without deployment; disabled levels are hidden. |
| MT-R03 | After determination, students may take tests at any enabled level. | D-015 | CONFIRMED | An N5 student can open a published N3 test, subject to entitlement. |
| MT-R04 | One question at a time; text/image/audio prompts; single-answer MCQ only at launch. | PB §2.2; D-018 | CONFIRMED | PB §16.3 #2. |
| MT-R05 | Free back/forward navigation; answers editable until submission; "mark for review" flag; progress indicator. | D-016 | CONFIRMED | Answer changes persist across reload; flagged questions are listed before submission. |
| MT-R06 | Configurable duration; remaining-time display; auto-submit at the server deadline; manual submit with confirmation. No pause; resume until the server deadline; one active attempt per test, latest tab/device takes over. | PB §2.2; D-027 | CONFIRMED | PB §16.3 #4–6; DB constraint allows only one active attempt per student+test; a second tab takes over and the first is told it is stale. |
| MT-R07 | Server-authoritative deadline; browser timer is display-only; one final result. | PB §4.5 | TECHNICAL SAFETY RULE | Duplicate and late submits are rejected or idempotent. |
| MT-R08 | Correct answers/explanations never exposed during an active attempt; shown only after final submission. | D-017; D-020 | CONFIRMED / TECHNICAL SAFETY RULE | API responses during an attempt contain no correctness data (checked in tests). |
| MT-R09 | Fixed question sets at launch; option shuffle configurable per test; default sections per exam type, overridable per test. | D-018 | CONFIRMED | Shuffle on/off honoured; the stored answer maps to the canonical option regardless of display order. |
| MT-R10 | Free tests: unlimited retakes. Paid tests: unlimited while access is valid, with an optional per-test attempt limit *(interpretation)*. | D-018 | CONFIRMED | Attempt limit is enforced server-side; expired access is denied. |

## 6. Results and answer review (RS)

| ID | Requirement | Source | Status | Acceptance criteria |
|---|---|---|---|---|
| RS-R01 | A result is generated after every mock test and determination stage submission. | PB §2.2; D-012 | CONFIRMED | PB §16.3. |
| RS-R02 | Result: test name, exam type, level, totals, correct/incorrect/unanswered, marks, percentage, pass/fail, section results. | PB §2.2 | CONFIRMED | PB §16.3 #8. |
| RS-R03 | Scoring: per-question marks; overall pass mark per test; optional per-section minimums; no negative marking. | D-017 | CONFIRMED | Unit tests: pass overall but fail a section minimum → FAIL; marks sum correctly. |
| RS-R04 | Review: question, selected answer, correct answer, correctness, explanation, for every question. | PB §2.2 | CONFIRMED | PB §16.3 #9. |
| RS-R05 | Result history for the student, including determination attempts after completion. | PB §2.2; D-012 | CONFIRMED | PB §16.3 #11. |
| RS-R06 | Snapshots keep historical review stable after edits. | PB §4.6 | TECHNICAL SAFETY RULE | PB §16.3 #10. |
| RS-R07 | Only the owning student and permitted admin roles can view results. | PB §4.6 | TECHNICAL SAFETY RULE | IDOR tests on result IDs. |

## 7. Admin CMS (CMS)

| ID | Requirement | Source | Status | Acceptance criteria |
|---|---|---|---|---|
| CMS-R01 | Full CRUD/workflow/publishing across all approved modules. | PB §5; D-007 | CONFIRMED | PB §16.4. |
| CMS-R02 | Universal module behaviour (search/filter/paginate, validation, states, confirmations, server-side permissions, audit, versioning). | PB §5.1 | CONFIRMED | PB §16.4. |
| CMS-R03 | CMS configurability boundary per D-020 (values/toggles/content editable; safety invariants and secrets not). | D-020 | CONFIRMED *(interpretation)* | Invariant-violating configs are rejected server-side; no secret fields appear in the CMS. |
| CMS-R04 | Student/account management, including determination reset and level override (D-013). | PB §5.3 | CONFIRMED | LD-R11. |
| CMS-R05 | Level determination configuration (stages, thresholds, durations, question sets, enabled levels, summary copy). | PB §5.4; D-008..D-012 | CONFIRMED | LD-R03, LD-R07, LD-R12. |
| CMS-R06 | Study content manager and media library. | PB §5.5, §5.12 | CONFIRMED | SM-R02..06. |
| CMS-R07 | Exam/level catalogue manager. | PB §5.6; D-014 | CONFIRMED | MT-R02. |
| CMS-R08 | Question bank with bilingual explanations, optional furigana, marks, sections, versions, preview. | PB §5.7; D-024 | CONFIRMED | Phase 14 tests. |
| CMS-R09 | Import: preview → all-or-nothing commit; duplicate detection by normalized text + exam + level; row-level errors. | D-024 | CONFIRMED – DETAIL OPEN (CON-1b template sample) | A file with one bad row commits nothing and reports that row. |
| CMS-R10 | Mock-test builder (sections, marks, pass mark, section minimums, shuffle, duration, attempt limit, free flag, availability). | PB §5.8; D-017..D-019 | CONFIRMED | Publish validation rejects incoherent tests. |
| CMS-R11 | Results/attempt administration (view; no free-text editing of results). | PB §5.9; D-020 | CONFIRMED | Corrections/invalidation are out of scope until rules are approved. |
| CMS-R12 | Public pages and copy managed in the CMS (bilingual), including navigation, footer, FAQ, CTAs, legal pages, SEO metadata. | D-006 | CONFIRMED | Editing home-page copy in the CMS updates the live page without deployment. |
| CMS-R13 | Products, bundles, prices, validity, free flags, payment-method enable/display order; orders and transactions view. | D-019, D-020 | CONFIRMED | Price change applies to new orders only; existing orders keep their price. |
| CMS-R14 | Roles: Super Admin, Content Editor, Support (read-only) at launch; granular permissions editable by Super Admin. | D-022, D-053, D-058 | CONFIRMED · **implemented (Phase 7)**, including admin MFA | Every admin endpoint has permission tests. |
| CMS-R15 | Support contact form + support email; contact details CMS-managed. | D-023 | CONFIRMED | Form submission is stored and/or emailed; spam rate-limited. |
| CMS-R16 | Settings, audit log, operational view (no secret values). | PB §5.15 | CONFIRMED | Audit entries for all sensitive actions. |
| CMS-R17 | Maximal CMS coverage (UI labels done in Phase 8 via three label globals; sections, images, theme, logo and SEO follow in Phase 18): UI labels/messages (override layer), sections and order, images/parallax layers, animation preset per section, navigation, footer, SEO, logo/favicon/tagline, contact/social links, email copy, theme colours with contrast validation, all in EN/JA. | D-030, D-031 | CONFIRMED | A release-audit scan finds no hard-coded user-facing strings; editing each item type in the CMS updates the site without deployment; a theme colour failing WCAG AA contrast is rejected. |

## 8. Authentication (AUTH)

| ID | Requirement | Source | Status | Acceptance criteria |
|---|---|---|---|---|
| AUTH-R01 | Email + password registration with email verification; login, logout, forgot/reset password. No social/SMS login. | D-021, D-054 | CONFIRMED · **API implemented and tested (Phase 7)**; pages in Phase 8 | Unverified accounts cannot start determination (or a defined restricted state); reset tokens are single-use and expiring. |
| AUTH-R02 | Password hashing, secure sessions, CSRF protection, rate limits, non-enumerating responses, expiry/revocation. | PB §4.1, D-055, D-056 | TECHNICAL SAFETY RULE · **implemented and tested (Phase 7)** | `tests/int/student-auth.int.spec.ts`, `tests/int/rbac.int.spec.ts`, `tests/e2e/auth.e2e.spec.ts` |
| AUTH-R03 | Admin MFA: authenticator code required for every admin, every session. | D-022, D-058 | CONFIRMED · **implemented and tested (Phase 7b)** | `tests/int/admin-mfa.int.spec.ts`, `tests/e2e/admin-mfa.e2e.spec.ts` |

## 9. Public website and commerce (PUB / COM)

| ID | Requirement | Source | Status | Acceptance criteria |
|---|---|---|---|---|
| PUB-R01 | Pages: home, NAT/JLPT/JFT overviews, catalogue with filters, test/product detail, pricing, about, FAQ, contact, privacy, terms, refund. | D-006 | CONFIRMED | All pages render from CMS data in EN and JA. |
| PUB-R02 | Agent drafts initial EN+JA copy, marked DRAFT; owner sign-off on legal pages is a release gate. | D-006 | CONFIRMED – DETAIL OPEN (PA-6 reviewer) | Release audit blocks while any legal page is still DRAFT. |
| PUB-R03 | No fake testimonials/ratings/stats/affiliation claims; a non-affiliation notice for JLPT/NAT/JFT. | PB §3.2; D-006 | TECHNICAL SAFETY RULE | Content review checklist in Phase 18. |
| COM-R01 | Individual tests and bundles with access validity; no subscriptions, coupons or refunds at launch. | D-019 | CONFIRMED | Entitlement expires at the validity end. |
| COM-R02 | Free: determination, study materials, one sample test per exam type (free flag per test). | D-019 | CONFIRMED | Free tests need no order; paid tests need a valid entitlement. |
| COM-R03 | Checkout, provider return/status pages, order confirmation, failed/cancelled/pending pages, purchase history. | PB §3.2; D-019 | CONFIRMED | PB §16.5. |
| COM-R04 | Receipt/invoice content and VAT handling. | PAY-4b | CONFIRMED – DETAIL OPEN | — |

## 10. Still proposed — approval required

| ID | Proposal | Source |
|---|---|---|
| REC-04 | Student dashboard (level and status, eligible materials/tests, recent attempts, CTAs). | PB §4.2 |
| REC-05 | Profile editing, account security settings, attempt-history filters, account deletion request flow. | PB §4.7 |
| REC-09 | CMS-managed notices/announcements and email templates. | PB §5.14 |
| REC-10 | Admin analytics dashboard backed by real data. | PB §5.2 |

*Approved since Phase 0:* REC-01 → PUB-R01; REC-02 → COM-R02; REC-03 → COM-R03; REC-06 → LD-R11; REC-07 → CMS-R12; REC-08 → CMS-R14 (reduced role set); REC-11 → MT-R05; REC-12 → RS-R03.

## 11. Technical safety rules (cross-cutting)

| ID | Rule | Source |
|---|---|---|
| TSR-01 | All authorization and level/eligibility rules enforced server-side. | PB §15 #4 |
| TSR-02 | Never trust client-supplied user ID, level, price, marks, score, payment status or completion flag. | PB §15 #5 |
| TSR-03 | Scores and determination computed server-side from versioned configuration. | PB §15 #6 |
| TSR-04 | Submit/finalize/payment-callback flows idempotent and race-safe. | PB §15 #7 |
| TSR-05 | Snapshots/versions keep historical review stable. | PB §15 #8 |
| TSR-06 | Paginate; never ship the full question bank or all students to the browser. | PB §15 #9 |
| TSR-07 | Safe upload validation; private/signed access for restricted media. | PB §15 #10 |
| TSR-08 | Secure headers, rate limits, input validation, safe errors, non-secret logs. | PB §15 #11 |
| TSR-09 | Financial, audit and completed-assessment records protected from destructive deletion. | PB §15 #12 |
| TSR-10 | Secrets only in env/secret manager, never in the CMS, client, Git or logs; env validated at startup. | PB §8.1, §15 #13–14; D-020 |
| TSR-11 | Real persistence in production paths; mocks only in tests/labelled dev. | PB §15 #15 |
| TSR-12 | Negative authorization tests (wrong user/role/level, expired access, unpublished content, manipulated IDs). | PB §15 #16 |
| TSR-13 | Payment safety rules PB §8.4 (server price, provider verification, idempotency, state machine, entitlement after verified success). | PB §8.4 |
| TSR-14 | No fake testimonials, ratings, analytics, payment states or affiliation claims. | PB §3.2 |
| TSR-15 | Accessibility: semantic HTML, keyboard, focus, contrast, non-colour status, reduced motion; Japanese glyph fallback/wrapping. | PB §6.3–6.4 |
| TSR-16 | CMS config changes that affect scoring are versioned and apply to new attempts only. | D-020 |

## 12. Out of scope until approved

Social login, SMS/OTP, subscriptions, coupons, refunds, certificates, leaderboards, AI tutoring, forums, mobile apps, offline mode, blog, push notifications, additional question types beyond single-answer MCQ, randomized question blueprints. (PB §2.4; D-018, D-019)
