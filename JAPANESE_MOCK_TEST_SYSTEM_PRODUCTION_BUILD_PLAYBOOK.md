# JAPANESE MOCK TEST SYSTEM
## Production Build Playbook

**Agent-ready operating manual | Full-stack web application | Student experience + Admin CMS + API + database + payments**

**Version:** 1.1 - expanded phased-agent workflow  
**Status:** Requirements partially captured; critical product and technology decisions remain open  
**Primary use:** Give this playbook to Claude Code or another coding agent as the long-lived build and delivery guide.

---

## Document purpose and status conventions

This playbook defines a controlled path from requirements discovery to a tested, deployable Japanese Mock Test System. It is an implementation guide, not permission to silently invent product rules or start coding before the owner approves the open decisions.

Use these labels throughout the project:

- **CONFIRMED** - explicitly specified by the owner so far.
- **PROPOSED - APPROVAL REQUIRED** - a useful product or technical recommendation; do not implement until accepted where it changes scope, behavior, cost, data collection, or operations.
- **OPEN DECISION** - the owner must decide or provide the missing information.
- **TECHNICAL SAFETY RULE** - a production engineering control required to avoid insecure, unreliable, or misleading behavior.
- **VERIFIED** - supported by repository evidence, working tests, or a completed external-provider verification; a claim alone is not evidence.

The owner wants a polished, modern, attractive experience and an end-to-end web product. The agent may identify missing customer-facing features and recommend them, but must place them in a recommendation list and ask for approval instead of adding unapproved scope silently.

**Credential rule:** Never fabricate real production credentials. Use clearly marked placeholders in `.env.example` and provider-issued sandbox/test credentials for development. Ask the owner to create or configure secrets through the selected provider/hosting console when needed; do not ask for production secrets to be committed to source control or pasted into source files.

---

# 1. How to Use This Playbook

## 1.1 Core operating rule

Do not attempt to build the whole system in one prompt or one coding session. Treat each session as a bounded milestone. The repository, approved decision records, tests, and project-state documents are the source of truth - not the chat transcript and not an agent's claim that it remembers prior work.

1. Begin with discovery, requirement reconciliation, and a repository audit. Do not start broad implementation before owner decisions are documented.
2. Build an explicit requirements register with source, status, acceptance criteria, dependencies, and unresolved questions.
3. Compare architecture alternatives and obtain approval before locking the stack.
4. Implement in small vertical slices that connect UI, API, database, authorization, and tests.
5. Keep the student website and Admin CMS backed by real server-side persistence. Do not leave production paths powered by permanent mock data.
6. After each milestone, run relevant checks and update state/handoff documents.
7. Before release, perform an evidence-based implementation-versus-requirements audit and fix the approved findings.

## 1.2 Persistent project memory

Create and maintain these files in the repository. Adjust paths only if the existing project has a documented convention.

| Artifact | Purpose |
|---|---|
| `CLAUDE.md` or equivalent agent instructions | Permanent project rules, commands, architecture decisions, coding conventions, security requirements. |
| `docs/PROJECT_STATE.md` | Actual state: complete, partial, blocked, in progress, and next task. |
| `docs/IMPLEMENTATION_PLAN.md` | Ordered milestones, dependencies, acceptance criteria, and progress. |
| `docs/REQUIREMENTS_REGISTER.md` | Confirmed requirements, recommended items awaiting approval, and traceability to tests. |
| `docs/OPEN_QUESTIONS.md` | Unresolved business decisions, options, impact, and owner response. |
| `docs/DECISIONS.md` | Approved product/technical decisions with rationale and date. |
| `docs/SESSION_HANDOFF.md` | Exact handoff to the next agent session. |
| `docs/KNOWN_ISSUES.md` | Verified bugs, blockers, risks, and technical debt. |
| `docs/TEST_STATUS.md` | Test commands, environment, results, failures, and coverage gaps. |
| `docs/ARCHITECTURE.md` | Application boundaries, component diagram, runtime flows, integrations. |
| `docs/DATABASE_ARCHITECTURE.md` | Entities, relations, integrity rules, migrations, indexes, retention rules. |
| `docs/API_DOCUMENTATION.md` | Routes, payloads, validation, auth requirements, error model, examples. |
| `docs/ENVIRONMENT_REQUIREMENTS.md` | All environment variables, source, scope, secrecy, and provisioning instructions. |
| `docs/DESIGN_SYSTEM.md` | Approved art direction, tokens, typography, motion, accessibility, components. |
| `docs/UI_SCREEN_INVENTORY.md` | Public, student, checkout, and admin pages, states, and data dependencies. |
| `docs/PAYMENT_INTEGRATION_RUNBOOK.md` | Provider onboarding, sandbox tests, production activation, reconciliation, failure handling. |
| `docs/CHANGELOG.md` | Material code, schema, API, and behavior changes. |
| `docs/PRODUCTION_READINESS_AUDIT.md` | Evidence-based requirement-by-requirement audit. |
| `docs/RELEASE_READINESS.md` | Final go/no-go decision, evidence, and remaining blockers. |

At the start of each session, read the agent instructions and current state/decision/handoff files; inspect the repository, package scripts, environment examples, migrations, tests, and `git status`. Reconcile documents with the real code before changing anything.

## 1.3 Status discipline

Do not mark an item complete because a file exists, the page renders, or the code compiles. Use at least one relevant evidence source: passing automated tests, a reproducible end-to-end flow, a database/API check, a manual acceptance checklist with environment noted, or a provider sandbox verification. Mark untested work `PARTIAL` or `UNVERIFIED`.

## 1.4 How to run this playbook across rate limits

**Do not paste the entire playbook and ask the agent to build everything at once.** The playbook is the operating manual. The copy-paste prompt for the *current phase* is the task instruction. Use one phase prompt at a time, in order, and wait for its summary and required approvals before starting the next phase.

Recommended operating cycle:

1. **First session:** run Phase 0 only. Its job is discovery, document setup and questions - not application implementation.
2. **After you answer questions:** run the next relevant phase prompt. Stack and product decisions must be approved before phases that depend on them.
3. **During implementation:** each prompt is a bounded milestone. If the task is too large for the available context/rate limit, the agent should stop at a safe checkpoint rather than claiming the whole phase is finished.
4. **When the tool rate-limits or the session ends:** open a new session in the same repository and use Section 12's resume prompt. Do not ask only `Did you complete the task?` The next agent must inspect the actual files, Git status, diffs, tests and handoff documents because the previous session may have stopped mid-file or mid-feature.
5. **Before ending any session voluntarily:** use the handoff prompt in Section 13 so the next session receives a precise continuation point.
6. **After a phase's exit criteria pass:** review the evidence, approve any requested decisions, then issue only the next phase prompt.

**Important:** A resume prompt does not authorize the agent to restart from Phase 0 or redo all work. It means: verify repository state, identify the exact unfinished task, and continue the smallest incomplete approved milestone. The code and persistent project documents outrank chat history.

---

# 2. Confirmed Baseline and Scope Boundaries

## 2.1 Product target

**CONFIRMED:** The target is a production-oriented, complete-stack Japanese Mock Test System **web application**, with a student-facing website, an Admin Portal/CMS, server-side application logic, a persistent database, and payment integration. It is not a static landing page or a college/demo project.

**CONFIRMED:** The design should be modern, attractive, polished, responsive, and use deliberate typography, a considered color palette, meaningful animation, accessible interactions, and a cohesive visual identity.

**CONFIRMED:** The owner wants architecture and technology alternatives compared with pros/cons and wants to approve the selected stack before major implementation.

**CONFIRMED:** The owner wants eSewa, Khalti, and connectIPS payment options for online purchases, subject to merchant onboarding and the providers' current technical requirements.

**CONFIRMED:** Routine customer-facing content and supported application settings should be manageable through a fully dynamic CMS rather than hard-coded in the website.

## 2.2 Student features already specified

The current requirement baseline includes the following.

### Level determination

- On the student's first successful login, check whether a level has already been determined.
- If not determined, immediately direct the student to the Level Determination Test.
- Until it is complete, block Study Materials, Mock Tests, and Results. Students cannot skip, close, or bypass the required flow to access those features.
- Always begin level determination at N5; do not let students choose a starting level or skip levels.
- Passing the configured threshold unlocks the next evaluation level (N5 to N4 to N3 and then any further approved available levels). Stop at the first failure.
- Assign the highest successfully passed level. A student who fails N5 receives N5 / Beginner.
- Once a level is determined, unlock the permitted student features and take students directly to the normal interface on later logins.

### Study materials

- Accessible only after level determination.
- Study materials are provided for N5, N4, and N3 only; materials above N3 are not provided.
- Students cannot manually change their assigned level.
- Students may access current-level materials and available lower-level materials, following server-side eligibility rules.
- Initial categories include Listening, Grammar, Reading, and Kanji.
- Materials may include text, images, audio, and PDFs/documents. Listening supports audio playback.

### Mock tests

- Separate from the initial Level Determination Test.
- Examination types include NAT, JLPT, and JFT.
- NAT/JLPT may include N5, N4, N3, N2, and N1. JFT level labels include A1, A2.1, A2.2, and A2 as supplied by the owner; the exact level catalogue/relationships must be confirmed before data modeling or launch.
- One question is shown at a time; multimedia questions may contain text, images, or audio.
- Multiple-choice answer selection, question progress, configurable time limit, remaining-time display, time-expiry auto-submit, manual submit, and submission confirmation are required.

### Results and answer review

- A result is generated after submission of a mock test or level determination test.
- Include test name, examination type, level, total questions, correct/incorrect counts, total marks, marks obtained, percentage, pass/fail, and section-wise results when applicable.
- Review shows the question, student's selected answer, correct answer, correctness status, and explanation. Both correct and incorrect answers remain reviewable.
- Students can see prior mock-test results including level, score, percentage, date, and answer-review details.

## 2.3 Admin CMS requirement baseline

**CONFIRMED:** The Admin Portal is intended to manage the complete student-facing experience and the operational content/configuration of the system. It should provide comprehensive CRUD, appropriate workflow/status control, and dynamic publishing. New content or routine changes must not require an application release where the content/setting is designed to be dynamic.

The modules described later are a proposed scope map. Clearly marked recommendations still require owner approval if they add behavior or operational cost beyond the confirmed requirements.

## 2.4 Out-of-scope until approved

Do not silently assume the system requires social login, SMS/OTP, subscriptions, coupons, refunds, certificates, leaderboards, AI tutoring, discussion forums, mobile apps, offline mode, blog/SEO CMS, push notifications, or a specific pricing model. They may be proposed for owner consideration, but must remain unimplemented until explicitly approved.

---

# 3. Product Blueprint and End-to-End Experience

## 3.1 Surfaces and responsibilities

| Surface | Responsibility |
|---|---|
| Public website | Product explanation, examination types, approved test/material catalogues, pricing/product details if approved, trust information, CTAs, FAQs, support/contact, and required legal content. |
| Student area | Authentication, mandatory level determination, study materials, mock-test catalogue and runner, submission, result details, answer review, attempt history, profile/account controls. |
| Checkout and purchase flow | Product selection, server-priced order, gateway selection, provider redirect/initiation, verified payment status, receipt/order history, and entitlement activation where a paid access model is approved. |
| Admin CMS | Manage students, level rules, study materials, question bank, examination configuration, mock tests, results, dynamic pages, purchase/payment records, permissions, and operational settings within approved scope. |
| Backend/API | Authentication, authorization, business rules, level progression, exam attempts, timer validation, scoring, result persistence, CMS validation, payment initiation/verification, entitlements, audit logging, and integrations. |
| Database | Canonical persistent store for identities, content, question versions, assessment configurations, attempts, answers, scores, orders, payment events, access entitlements, admin audit records, and configuration. |
| File/media storage | Audio, images, PDFs, and documents with validation, secure access, and metadata. The provider remains an open technical choice. |

## 3.2 Public website and conversion pages

The owner mentioned product details and calls to action as examples of potentially missed needs. Include these in discovery and design; confirm which are in launch scope.

**PROPOSED - APPROVAL REQUIRED:**

- Home page with clear value proposition, examination types, approved product highlights, CTA hierarchy, and trust/FAQ sections.
- NAT, JLPT, and JFT landing/overview pages with accurate, owner-approved descriptions.
- Mock-test catalogue with search/filtering by examination type and level.
- Test/product detail page showing only confirmed facts such as exam type, level, format, number of questions, duration, inclusions, price, access validity, and availability.
- Free sample/demo test only if approved.
- Pricing/plans page if the owner chooses more than one purchase option.
- About, FAQ, contact/support, privacy policy, terms, and refund policy pages as required by launch and applicable obligations.
- Sign up, login, forgot/reset password, and protected student routes.
- Checkout, provider return/status screens, order confirmation, failed/cancelled/pending state pages, and purchase history if payment-based product access is approved.

The agent must not write fake testimonials, unsupported success rates, fake ratings, false exam guarantees, or unverified claims about NAT/JLPT/JFT. Use owner-provided copy or clearly marked placeholders in development.

## 3.3 Student journey

1. Visitor understands the product and available approved test offerings.
2. Visitor registers or logs in.
3. Backend determines whether a level is assigned.
4. If not, the student enters the mandatory N5-first level determination flow; protected features remain blocked until completion.
5. The backend calculates the next stage and assigned level under approved rules.
6. Student enters the normal dashboard and sees available current/lower-level study materials and the approved mock-test catalogue.
7. If a mock test is paid, checkout uses a server-created order and one of the approved gateways. A user return URL alone never grants access.
8. Student starts a valid attempt, answers questions, tracks progress, and submits manually or through server-validated time expiry.
9. Backend finalizes the attempt, scores the versioned test configuration, stores the result and answer review, and exposes the result to the authorized student.
10. Student can review prior results without losing historical question/scoring context.

## 3.4 End-to-end flows to test

| Flow | Minimum expected path |
|---|---|
| First login | Register/login -> level-status check -> N5 evaluation -> progressive evaluations/failure stop -> determined level saved -> normal interface. |
| Bypass prevention | Unresolved student directly requests materials, mock tests, or results endpoint -> backend denies access; UI routes to evaluation. |
| Evaluation progression | Pass N5 -> N4; pass next level -> next approved level; fail -> stop; fail N5 -> N5/Beginner. |
| Returning student | Login -> read stored determination state -> normal interface without repeating evaluation. |
| Study material | Open eligible level/category -> retrieve published materials -> load text/media securely -> audio playback works. |
| Mock test | Eligibility check -> load approved test snapshot -> start attempt -> answer one question at a time -> timer/progress -> submit/auto-submit -> result/review. |
| Interrupted attempt | Apply approved retry/resume policy; prevent duplicate or inconsistent finalization. Policy must be decided before implementation. |
| Payment | Product detail -> server-priced order -> provider initiation -> provider verification -> order/transaction state update -> entitlement activation only after verified success. |
| Admin publishing | Authorized admin creates content -> validate -> preview -> publish -> student API returns the new content without code change. |

---

# 4. Student Web Application Feature Specification

## 4.1 Authentication and account lifecycle

**Required for an end-to-end website; policy details are open:** registration, login, logout, forgot password, reset password, and secure session persistence. Ask whether email verification, phone verification, Google login, or multi-factor authentication is required rather than assuming any of them.

The implementation must include safe password handling, secure session/token storage appropriate to the approved stack, CSRF protection where relevant, rate limiting for auth endpoints, generic responses where needed to limit account enumeration, expiry/revocation behavior, and server-side authorization. Never store plain-text passwords or secrets.

## 4.2 Student dashboard

**PROPOSED - APPROVAL REQUIRED:** show assigned level and determination status, continue/complete level determination when appropriate, links to eligible materials and mock tests, recent attempts, latest scores, and clear calls to action. Do not expose protected information before level determination.

## 4.3 Level determination engine

The backend must be the authority for progression. Client state cannot set the assigned level.

- Store whether determination is pending, in progress, or completed.
- Start at N5 regardless of a student's self-reported knowledge.
- Use explicit, versioned passing thresholds and the ordered level configuration approved by the owner.
- Reject requests to skip ahead or submit an attempt for an unassigned stage.
- Evaluate a completed attempt once; make repeated completion requests idempotent.
- On a pass, identify the next configured stage. On a failure, stop progression and assign the highest passed level; if N5 fails, assign N5/Beginner.
- Preserve every stage attempt and the rule/configuration version that produced the final assignment.
- Define behavior when the highest configured evaluation is passed, when an evaluation is unavailable, or when an admin changes configuration mid-process. These are **OPEN DECISIONS**.
- Ensure only a successful completion transaction can change the user's determination status.

## 4.4 Study materials

- Enforce assigned-level eligibility on every API request.
- Expose N5/N4/N3 study materials only, with approved current/lower-level rules.
- Provide the initial Listening, Grammar, Reading, and Kanji categories.
- Support text, images, audio, PDF/documents and safe file access.
- Provide sensible empty, loading, unavailable, and error states.
- Keep hidden/unpublished items and materials above N3 out of student APIs.
- Prevent broken media links and validate file format/size at upload time.

## 4.5 Mock-test catalogue and test runner

- Catalogue is filtered by active/published state, examination type, level, and any approved access rule.
- Separate mock-test assignments and attempts from level-determination evaluations.
- Render one question at a time and show a stable progress indicator such as `Question 10 of 50`.
- Support multiple-choice options and approved text/image/audio prompt content.
- Present remaining time when configured.
- Use a trusted server timestamp/start/deadline to determine expiry. A browser timer is display-only and must not extend the attempt.
- Auto-submit when the deadline is reached according to server-side rules; ensure multiple expiry requests cannot create multiple final results.
- Require confirmation before manual final submission.
- Store answers safely as students navigate. Define whether answer changes, previous navigation, pause, resume and disconnect recovery are supported.
- Do not reveal correct answers during a mock test unless the owner explicitly approves that behavior.
- Keep screen interactions low-distraction and responsive on desktop, tablet and phone.

## 4.6 Results and answer review

Store a durable result snapshot with test name, exam type, level, test version, question count, correct/incorrect/unanswered counts as supported, total marks, earned marks, percentage, pass/fail, timing, submission reason and section totals where applicable.

Answer-review data must retain the question version, option set, student's submitted selection, correct answer, correctness, explanation and section metadata. This ensures later edits to a question do not rewrite the historical meaning of past attempts.

**OPEN DECISION:** For a level determination test, what exact result screen should appear immediately after the final stage? The requirement says results are generated after submission but also says the Results section is inaccessible until level determination finishes. Do not allow this ambiguity to break the mandatory flow; ask the owner during discovery.

## 4.7 Profile, history and support

**PROPOSED - APPROVAL REQUIRED:** profile editing, account security settings, attempt history filters, purchase history, support contact/ticketing, and account deletion/request flow. Define which fields are editable, what records must be retained, and what deletion means for payment and assessment history before implementation.

---

# 5. Admin Portal - Fully Dynamic CMS and Control Center

The CMS should manage every approved entity, content item, customer-facing page module, test setting and operational workflow that belongs to routine administration. It is not only a dashboard.

## 5.1 Universal CMS behavior

Every applicable CRUD module should have:

- Create, read, update, archive/delete, and restore where appropriate.
- Search, sort, filter, pagination, and useful detail views.
- Consistent form validation and field help.
- Loading, empty, error, success, and unauthorized states.
- Draft/review/publish/schedule/unpublish workflow where useful.
- Safe bulk actions and import/export where relevant.
- Confirmation for destructive/high-impact actions.
- Permission checks enforced by the API, not UI hiding alone.
- Audit records for sensitive configuration, question, examination, account, result, and payment actions.
- Versioning/archiving when changes could affect historical result interpretation.

## 5.2 Dashboard and analytics

Show only meaningful metrics backed by real data, such as total/new/active students, unresolved level determinations, level distribution, mock-test attempts, pass/fail and score trends, popular tests, content counts, order/payment states, and recent admin activity. Metrics require definitions, date/timezone rules, and permission checks. Analytics beyond the actual schema should not be fabricated.

## 5.3 Student and account management

Manage approved user fields, account status, determination state, assigned level, evaluation history, test attempts, and support context. Search/filter/paginate and export only authorized fields. Optional manual level override must be a **PROPOSED - APPROVAL REQUIRED** privileged action with a reason, audit trail, and defined recalculation implications; automatic determination remains the baseline rule.

## 5.4 Level determination configuration

Manage evaluation stages, stage order, threshold percentage, question/test assignment, section configuration, duration if applicable, status, and effective configuration version. Validate the ordered flow and prevent invalid stage relationships. Provide an audit-friendly student evaluation history and the logic explaining the assigned level.

The admin must not be able to publish a configuration that permits skipping required stages or that creates a path inconsistent with the approved owner rules.

## 5.5 Study content manager

Manage levels N5/N4/N3, categories, material records, rich text, images, audio, PDF/documents, ordering, publication status, and visibility. Support preview and media validation before publication. The CMS may support additional categories only after approval; initial confirmed categories are Listening, Grammar, Reading, and Kanji.

## 5.6 Examination and level catalogue

Manage NAT, JLPT and JFT catalogue records and approved levels/variants, descriptions, section rules, active status and ordering. Do not hard-code level lists across many UI components. Validate the exact JFT level hierarchy and naming with the owner before launch.

## 5.7 Question bank

Manage question text, Japanese-script content, optional kana/furigana/ruby display support, options, correct answers, explanations, section/topic, exam type, level, media, marks, optional negative marks, tags, difficulty, status, source/provenance where required, and versions.

Question manager capabilities:

- CRUD, duplicate, archive, restore and bulk edit.
- Preview the student rendering, including audio/images and Japanese text.
- Review/publish workflow if approved.
- Link questions to tests and show reuse dependencies before destructive change.
- Detect malformed options, missing correct answers, missing media and inconsistent metadata.
- Preserve historical question snapshots for completed attempts.

### Spreadsheet/CSV import

Create an official template only after agreeing the schema. Include template version, column definitions, allowed values, examples, and required/optional status. Import must validate rows, show a preview, identify duplicates, show row-level errors, support safe partial or all-or-nothing behavior according to an approved policy, and summarize created/updated/skipped/failed counts. Do not silently guess answer columns or import malformed records.

## 5.8 Mock-test builder

Manage test title, exam type, level, instructions, sections, question selection/blueprints, question and option order, duration, marks, optional negative marks, pass threshold, publication state, availability, attempt rules, and result-release rules **only where approved**.

Provide a complete preview before publishing and validate that question counts, scoring totals, section configuration, correct-answer references, media links, and time rules are coherent. Do not silently modify a published test's behavior for students already in an attempt.

## 5.9 Results and attempt administration

Authorized roles can view result summaries, section marks, submission details, answer review, timestamps, attempt status, and anomaly indicators. Corrections, invalidation, or retakes must have owner-approved rules and audit trails. Results should not be editable like ordinary text because they are derived assessment records.

## 5.10 Public-page and UI content CMS

**CONFIRMED GOAL:** routine page content and supported presentation configuration should be dynamic.

**PROPOSED - APPROVAL REQUIRED:** page composer for approved reusable blocks; home-page sections; headings and CTA copy; buttons/links; examination landing pages; product/test cards; FAQs; banners; footer and navigation labels; static/legal/help pages; page SEO title/description/open-graph data; supported theme tokens; and localization. Build safe predefined content blocks, not arbitrary code execution. State which fields can be changed by CMS and which require a developer release.

The agent should create two or three distinct design/art-direction proposals, covering palette, typography, visual motif, spacing, card system, motion principles, and responsive behavior. The owner approves a direction before it becomes the design system. Do not default to a generic template or excessive gradients, clutter, or decorative animation.

## 5.11 Commerce and payment administration

**CONFIRMED:** eSewa, Khalti and connectIPS should be available as payment methods for approved online purchases.

**OPEN DECISION:** What is being sold: one mock test at a time, bundles/passes, subscriptions, premium access, or a combination? Which content/tests are free? What is the price/currency, duration of access, purchase limits, discount/coupon policy, refund policy, tax/invoice requirement, and receipt format?

Once approved, the CMS should manage the selected products, display title/description, price, availability, access validity, order history, transaction states, gateway references, reconciliation status, receipts/invoices where required, and a controlled refund workflow if refunds are in scope. Price and entitlements must be determined by the backend; the browser must never be allowed to set the final charge or grant access.

## 5.12 Media library

Upload and manage images, audio, PDFs/documents and other approved formats. Store metadata, owner/usage references, MIME type, file size, upload status and permissions. Allow reuse, safe replacement, archive/delete where safe, and validation. Never accept executable/unrestricted file types by default. Avoid public permanent URLs for restricted content unless approved access controls make that safe.

## 5.13 Roles and permissions

**PROPOSED - APPROVAL REQUIRED:** Super Admin, Admin, Content Manager, Question Manager, Examination Manager, Support Agent, Analyst/read-only role. The owner must confirm role names and assignment rules. Use granular permissions for viewing, creating, editing, publishing, archiving, exporting, changing assessment rules, managing users, viewing payment records and changing system configuration. Consider MFA for privileged admins; obtain approval before making it a release blocker.

## 5.14 Notifications, help and support

**PROPOSED - APPROVAL REQUIRED:** CMS-managed notices, announcements, email templates, support contacts, FAQs, and audience targeting. Email delivery, templates, push channels, or ticket management require an approved provider, data policy, and scope decision.

## 5.15 System settings, audit and operational view

Provide non-secret settings that are meant to be admin-managed: approved feature flags, publication defaults, supported catalogue settings, and display preferences. Show integration health only when measured; do not display secret values. Record sensitive changes, admin login/security events, import runs, publication actions, payment transitions, and result corrections. Provide access to job/error summaries where architecture supports it.

## 5.16 Dynamic CMS rules

1. Adding/editing/publishing routine content does not require an app code change.
2. Content and configuration are stored persistently and validated server-side.
3. Client applications render safe content blocks and supported configuration, not arbitrary executable markup.
4. Exam-specific rules are data-driven only where an explicit schema supports them; don't attempt to make every possible behavior configurable without testing.
5. Archived/hidden/unpublished content is not returned by ordinary student endpoints.
6. Historical attempts preserve the question and scoring versions used at the time.
7. All sensitive operations require explicit permission and produce an audit entry.
8. Changes to high-risk rules require preview/validation and, where appropriate, explicit confirmation.

---

# 6. Design, Motion, Accessibility and UX Quality Gate

## 6.1 Design objective

The visual standard is premium, modern, elegant, and purposeful. Do not equate “modern” with indiscriminate gradients, glowing cards, excessive motion, or a common dashboard template. Visual decisions should improve confidence, comprehension, Japanese text legibility, exam focus and conversion.

## 6.2 Design process - approval before locking

1. Audit any existing brand/logo/reference assets before inventing replacements.
2. Propose 2-3 materially different art directions with sample palette, typography, layout rhythm, cards/forms, icon style, imagery/illustration approach, and animation examples.
3. Explain trade-offs including accessibility, readability of Japanese characters, production complexity and mobile adaptation.
4. Ask the owner to select or amend one direction.
5. Record the selection in `docs/DESIGN_SYSTEM.md` and implement reusable tokens/components before building many pages.

**OPEN DECISIONS:** brand name/logo, desired personality, Japanese/English/Nepali language needs, availability of reference screenshots/assets, and preferred level of visual expressiveness.

## 6.3 Design system contents

Define CSS variables/tokens for color, typography, spacing, radius, borders, elevation, focus, z-index, animation timing and breakpoints. Create reusable buttons, links, inputs, selects, cards, badges/statuses, dialogs, tables, pagination, tabs, audio controls, timers, question cards, progress indicators, form validation, alerts, skeletons, empty states, and error states.

Use semantic HTML, keyboard navigation, visible focus, accessible labels, appropriate contrast, non-color-only statuses, reduced-motion support, descriptive audio controls, and responsive layouts. Test Japanese glyph fallback and line wrapping. The exam interface should remain calm and low-distraction.

## 6.4 Motion rules

Use animation to clarify hierarchy, transitions, feedback and completion - not to delay tasks or distract during tests. Respect `prefers-reduced-motion`; avoid animating timer numbers or critical instructions in ways that harm reading. Motion libraries are a stack choice and must be evaluated before selection.

## 6.5 Required interface states

Every important page/form/component must have defined initial/loading, empty, validation-error, server-error, success, disabled, unauthenticated, unauthorized, expired-session, and offline/retry behavior as applicable. No dead CTAs, placeholder links in production, silent failures, or fake progress.

---

# 7. Technology Decision Gate - Compare Before Approval

The owner's terms mix a stack name and different architecture layers. **MERN** means MongoDB + Express + React + Node.js. PostgreSQL is a database choice, not a substitute for Next.js; Next.js is a React framework and can contain server-side functionality. A React + Express + PostgreSQL application is often called **PERN**, not MERN. Explain this distinction clearly and recommend complete architectures, then wait for owner approval.

## 7.1 Complete architecture options

| Option | Shape | Why use it | Why not / trade-offs | Fit to evaluate |
|---|---|---|---|---|
| A. MERN | React + Node/Express + MongoDB | One main language; flexible documents; familiar MERN ecosystem; useful when data is document-shaped. | Referential integrity, relational reporting, historical exam snapshots and payment/order relationships require careful modeling; schema discipline remains necessary. | Compare if the owner values the familiar MERN convention and accepts MongoDB trade-offs. |
| B. PERN | React SPA + Node/Express API + PostgreSQL | PostgreSQL constraints/transactions, explicit relational model, strong fit for users, questions, attempts, result history, orders and payment states. Frontend/backend can be deployed separately. | More deployment boundaries and API/client coordination; schema migrations and operational setup are required. | Strong candidate where structured assessment and payment consistency dominate. |
| C. Next.js + PostgreSQL | Next.js (React framework) + server-side routes/actions as deliberately designed + PostgreSQL | Integrated web app; good public-page rendering/SEO; cohesive routing and server/client boundaries; can reduce separate app/deployment complexity. | Must be disciplined about server/client separation, API design and long-running/background work; may not be ideal to mix every domain concern into route handlers. | Strong candidate for a single web product with public marketing pages, protected student area and CMS. |
| D. Next.js + separate Node/Express API + PostgreSQL | Next.js frontend + separately deployed API + PostgreSQL | Clear backend boundary; API can support future clients; independent scaling/deployment. | More complexity, CORS/auth/session decisions, more deployments and monitoring. | Compare if API reuse or backend separation is a concrete requirement. |
| E. Next.js + MongoDB | Next.js + MongoDB | Integrated framework with flexible document storage. | Still needs strict relationship/state design for assessments, purchases, audit and reporting; selecting Next.js doesn't solve the database choice. | Alternative if document model is a clear owner priority. |

**Preliminary technical observation, not an approved decision:** the structured relationships and history in assessment results, question versions, user eligibility, orders, and payments make a PostgreSQL-based option worth serious evaluation. The final choice must be made with the owner after discussing costs, hosting, team familiarity, scalability, integration fit and maintainability.

## 7.2 Other decisions to compare

| Area | Options to evaluate | Decision criteria |
|---|---|---|
| Language | JavaScript vs TypeScript | Owner preference, codebase consistency, type-safety benefit, team skill and maintenance. Do not convert to TS without approval if the project preference is JS. |
| Frontend structure | React SPA (e.g. Vite) vs Next.js | SEO/public pages, routing, server rendering, complexity, API architecture, deployment. |
| ORM/data layer | Prisma, Drizzle, Mongoose (only for Mongo), or controlled SQL | Migration workflow, schema clarity, query needs, transactions, developer experience. |
| Authentication | Custom server-managed sessions, Auth.js/compatible library, managed auth provider | Security ownership, email/password, OAuth if approved, cost, account lifecycle, authorization integration. |
| UI/styling | Custom CSS/CSS Modules, Tailwind, component system, hybrid | Design control, preference, accessible primitives, maintainability, bundle impact. Compare before choosing. |
| Animation | CSS transitions vs Framer Motion/another maintained library | Interaction needs, accessibility/reduced motion, bundle/complexity, compatibility. |
| Forms/validation | React Hook Form + schema validation, framework forms, alternatives | Consistent client/server validation and developer ergonomics. |
| Database hosting | Managed PostgreSQL providers, app-host provider database, self-managed database | Reliability, region, price, backup/restore, access controls, connection limits and support. |
| File storage | S3-compatible storage, Cloudflare R2, managed platform storage | Private access, egress, media size, signed URLs, CDN, backup and cost. |
| Email | Transactional email API vs SMTP provider | Deliverability, domain verification, password reset/verification, logs, cost. |
| Testing | Unit/integration framework + Playwright or equivalent E2E | Stack compatibility, CI fit, database test isolation, browser coverage. |
| Hosting | Managed web platform, separate API host, VPS | Operational burden, deployment, background work, logs, TLS, backups, uptime and cost. |
| Monitoring | Sentry or equivalent; platform logs/uptime monitoring | Error visibility, privacy, alerts, environment separation, pricing. |
| Analytics | Privacy-conscious product analytics vs database reporting only | Business questions, consent/privacy, cost, implementation scope. |

For every option, the agent must produce `docs/TECH_STACK_OPTIONS.md` with pros, cons, projected cost/operations, lock-in, security implications, fit to the stated product, and a recommendation. Then stop and ask the owner to approve a complete stack. Do not install or code against a contested option before approval, except isolated disposable experiments explicitly approved by the owner.

## 7.3 Decision record required

Write `docs/DECISIONS.md` with the selected frontend/framework, backend/API shape, language, database, ORM, auth, file storage, email provider, UI/styling approach, animation approach, payment adapter shape, hosting, CI/CD, testing and monitoring. Record alternatives rejected and why. Never present a proposal as approved without an owner response.

---

# 8. Credentials, Environment and External Services

## 8.1 Environment management rules

- Create a committed `.env.example` containing variable names and safe placeholders only.
- Keep actual local `.env` files ignored by Git.
- Set production secrets in the chosen deployment provider's secret manager/settings.
- Never print secrets in logs, client bundles, screenshots, issue reports, or the public repository.
- Variables prefixed for public/client exposure must contain public values only. Payment secret keys, database URLs, signing keys, auth secrets, SMTP keys and storage secrets must remain server-only.
- Use sandbox mode and provider-issued test credentials until the integration is fully tested. Never fabricate a secret or claim production integration works using placeholders.
- Ask for required account details at the correct milestone, not all credentials before their purpose and provider setup are known.

## 8.2 Environment inventory to maintain

Exact names depend on the approved framework and provider. Maintain an inventory with variable, required environments, secret/public flag, owner/provider, purpose, acquisition steps, validation, and rotation procedure.

**Likely application/database groups - candidates, not a final `.env` contract:**

- Runtime: `NODE_ENV`, `APP_URL`, `API_BASE_URL` or approved equivalent, allowed CORS origins if separated.
- Database: `DATABASE_URL` plus any direct/migration URL required by the chosen provider/ORM.
- Authentication: server-only session/auth secret, token/signing keys if applicable, OAuth client configuration only if OAuth is approved.
- Email: provider API key or SMTP host/port/user/password, verified sender, reply-to, and template identifiers if applicable.
- Media: storage account/bucket, region/endpoint, server access key/secret, public URL/CDN base if applicable, signed-access settings.
- Payments: separate test/production environment settings and provider-issued merchant IDs, public identifiers, secret keys, signing material/certificates, callback/return URLs and permitted IP/config values required by each current provider spec.
- Observability: server-side error-tracking DSN/API key and environment/project identifiers if approved.
- Deployment/CI: provider project identifiers, deployment tokens and workflow secrets where needed.

The agent must not assume all listed groups will be used. It must adapt the final inventory to the approved architecture and selected services.

## 8.3 Payment provider intake

Before implementing each gateway, identify the official merchant onboarding process, account approval requirements, sandbox/live environments, product/version of the payment API, request-signing/verification requirements, transaction status lookup, callback/IPN/webhook behavior, allowed return URLs, settlement/reporting workflow, and required fields. Confirm details directly against current official documentation and the owner's registered merchant account.

The project must support the required providers:

- **eSewa:** official developer docs start at `https://developer.esewa.com.np/pages/Introduction`; the ePay v2 guide is available at `https://developer.esewa.com.np/pages/Epay-V2`.
- **Khalti:** official payment gateway docs at `https://docs.khalti.com/`, including web ePayment at `https://docs.khalti.com/khalti-epayment/`.
- **connectIPS:** merchant/service information at `https://connectips.com/` and official NCHL technical documentation at `https://doc.connectips.com/`. Merchant-specific payment-processor access and current technical documents may require direct onboarding with connectIPS/NCHL or the relevant bank; do not infer undocumented credentials or API flows.

These URLs are starting points, not permission to rely on an old SDK/sample. The agent must verify the currently supported product and integration flow before coding.

## 8.4 Payment safety rules

1. The server creates an order and derives amount/currency from the stored product and approved pricing; never trust an amount sent by the browser.
2. Payment initiation happens server-side where the provider flow requires it.
3. Treat return/success URLs as user navigation, not proof of payment.
4. Verify transaction status/signature with the provider according to the current official spec before marking an order paid.
5. Use idempotency and unique provider references to handle duplicate callbacks/notifications/retries.
6. Validate merchant, amount, currency, reference, and expected order association.
7. Keep payment state changes in a controlled state machine and keep immutable event/audit records.
8. Activate access/entitlements only after verified success.
9. Handle pending, success, failure, cancellation, timeout/expiry, provider unavailable, late callback, duplicate callback, amount mismatch, invalid signature, refund (if approved), and reconciliation cases.
10. Do not store sensitive payment credentials or payment authentication data that the provider says not to store.
11. Provide operational reconciliation instructions for transactions whose state is uncertain.

## 8.5 Payment state model

Candidate state model to validate against each provider and business policy:

`CREATED -> INITIATED -> PENDING -> SUCCEEDED | FAILED | CANCELLED | EXPIRED | RECONCILIATION_REQUIRED`

Refund flow, if approved, may add `REFUND_REQUESTED -> REFUNDED | REFUND_FAILED`. Do not force one provider's terminology onto another without a mapping layer. Keep provider status and normalized internal status separately when useful.

---

# 9. Full Build Roadmap and Required Gates

The phase prompts in Section 11 are the runnable work instructions. Use one at a time. Each may require multiple sessions; a phase is complete only when its acceptance criteria are tested and documented.

| Phase | Name | Main outputs / exit gate |
|---:|---|---|
| 0 | Repository and requirements discovery | Actual repository audit; requirements register; open questions; no feature implementation. |
| 1 | Product rules and owner decisions | Approved business rules, acceptance criteria, resolved blockers or explicitly deferred scope. |
| 2 | Technology alternatives and approval | `TECH_STACK_OPTIONS.md`; owner-approved stack recorded in `DECISIONS.md`. |
| 3 | Visual direction and journey/design plan | Approved art direction, screen inventory, accessibility/motion guidance and design-system plan. |
| 4 | System architecture | Architecture diagram, repository structure, API boundaries, security/data flows. |
| 5 | Database/domain design | Reviewed ERD/model, migrations plan, indexes/constraints, versioning and retention decisions. |
| 6 | Project/backend foundation | App configuration, database connectivity, migrations, errors/logging/health checks and baseline tests. |
| 7 | Authentication and authorization | Student/admin auth, session lifecycle, roles/permissions and access tests. |
| 8 | Shared frontend foundation | Design tokens, reusable components, route/API state patterns and responsive shell. |
| 9 | Admin CMS framework | Role-aware Admin shell, reusable CRUD patterns and one verified end-to-end CRUD slice. |
| 10 | Student route gates | Backend/UI determination checks and bypass-prevention tests. |
| 11 | Level determination engine | N5-first progression, approved thresholds, fail-stop, final assignment, history and idempotency. |
| 12 | Study materials and media | N5/N4/N3 material CRUD, approved media formats, publication and eligibility checks. |
| 13 | Examination configuration | Approved NAT/JLPT/JFT taxonomy, levels and section data managed dynamically. |
| 14 | Question bank and import/export | Question CRUD, explanation/media/versioning and validated import/export workflows. |
| 15 | Mock-test builder | Admin test configuration, preview, validation, publication and version snapshots. |
| 16 | Student test runner | One-question UI, answer handling, timer/deadline, manual and auto-submit. |
| 17 | Results and review | Server scoring, section results, answer review and stable historical results. |
| 18 | Public site and dynamic pages | Approved public pages, CTA/content CMS, responsive design and no unsupported claims. |
| 19 | Products, checkout and entitlements | Owner-approved product/access model, server-priced orders and entitlement rules. |
| 20 | Shared payment foundation | Current provider specs, integration abstraction, environment placeholders and state machine. |
| 21 | eSewa | Current official flow plus provider-issued sandbox verification and recorded test evidence. |
| 22 | Khalti | Current official flow plus provider-issued sandbox verification and recorded test evidence. |
| 23 | connectIPS | Current official flow plus provider-issued test configuration and recorded evidence. |
| 24 | Approved secondary features | Only approved email, support, notices, coupons/refunds or other secondary modules. |
| 25 | Integration and E2E regression | Critical user journeys, admin operations, exam edge cases and sandbox payment tests pass. |
| 26 | Security/performance/accessibility | Verified defects fixed; quality risks, mitigations and residual blockers documented. |
| 27 | Deployment and operations | Production environment plan, domain/TLS, migration, backup/restore, monitoring, rollback runbook. |
| 28 | Final production audit/release | Evidence-based requirement audit, release status, remaining blockers and owner go/no-go. |

**Gate rule:** Do not begin a phase that depends on unresolved product or architecture decisions. If only one small part of a phase is feasible within the current rate limit, break that phase into a bounded subtask, record it in `IMPLEMENTATION_PLAN.md`, finish/tests what is safely possible, and hand off. Do not compress several phases into one prompt just to make progress appear faster.

# 10. Master Prompt for Claude Code / Any Coding Agent

Copy the following prompt into the agent session with this playbook attached and the actual repository opened.

> You are the Principal Software Architect, Full-Stack Engineer, Database Engineer, Product/UX Designer, QA Engineer, Security Engineer, Payment Integration Engineer, and DevOps Engineer for the Japanese Mock Test System.
>
> This is a production web product, not a demo. Read the attached `JAPANESE_MOCK_TEST_SYSTEM_PRODUCTION_BUILD_PLAYBOOK.md` in full and treat it as the project operating manual. The PDF may be used for human review; the Markdown is the agent-friendly source of truth.
>
> **Critical rule: do not begin broad implementation immediately.** First inspect the actual repository, current code, dependencies, scripts, tests, environment examples, migrations, assets, Git status and history. Then read or create the persistent project documents specified by this playbook. Report what truly exists, what is partial, what is broken, and what is missing with file/test evidence.
>
> Create/update `docs/REQUIREMENTS_REGISTER.md`, `docs/OPEN_QUESTIONS.md`, `docs/PROJECT_STATE.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/DECISIONS.md`, and `CLAUDE.md`. Separate confirmed owner requirements from recommendations awaiting approval, architecture choices, technical safety rules, and open questions. Do not silently invent a business rule. Ask the smallest complete grouped set of questions at the appropriate decision gates, then stop and wait for the owner's answers.
>
> Compare complete stack alternatives, explicitly explaining that MERN is MongoDB + Express + React + Node; PostgreSQL is a database and Next.js is a React framework; React + Express + PostgreSQL is commonly called PERN. Evaluate pros/cons, cost, maintenance, deployment, data integrity, SEO, auth, API shape and fit. Do not install/commit to a contested stack until the owner approves it.
>
> Confirm the level-determination rules, exam levels and threshold policies, student access restrictions, test interruption behavior, result semantics, and monetization/access model before implementing related behavior. Level determination must start at N5, forbid bypass/skip, progress only by configured pass/fail rules, assign the highest successfully passed level, and assign N5/Beginner if N5 is failed. Enforce gates on server-side APIs, not only in the UI.
>
> Treat eSewa, Khalti and connectIPS as required payment providers for the approved purchasing model. Before implementing each, verify its current official merchant documentation and onboarding requirements. Use sandbox/provider-issued test credentials, `.env.example` placeholders and server-side payment verification. Never fabricate credentials, commit secrets, trust a browser redirect as payment proof, or grant access before verified success.
>
> The Admin CMS must manage all approved student-facing content and supported configuration dynamically through real database/API operations. Build complete CRUD/workflow patterns, role-based authorization, audit trails, validated question imports, media management and version-safe exam/result behavior. Public marketing/product details and CTAs are proposed requirements that must be confirmed with the owner before scope is locked.
>
> Design must be premium, coherent, accessible, responsive and purposefully animated. Before locking the visual direction, propose two or three materially different design directions and request owner approval. Respect reduced motion and keep exams low-distraction. Never generate fake testimonials, fake analytics, fake payment states or fake production data to imply readiness.
>
> Work in small, testable, dependency-ordered milestones. Write real persistent behavior, add tests, run them, inspect outcomes, and update project-state/handoff documents at every safe stopping point. Never claim a feature is complete without end-to-end evidence. Before declaring release readiness, create the evidence-based production audit and release report defined in this playbook.
>
> **First response requirement:** do discovery only. Show the repository findings, current architecture if identifiable, missing critical decisions grouped by topic, proposed architecture options, and next decision gate. Do not implement the application in the first response.

---

# 11. Phase-by-Phase Agent Prompts

**Operating rule:** Copy only the prompt for the current phase into Claude Code (or the selected coding agent). Do not ask it to execute all phases at once. The agent must respect approval gates, stop where a prompt says stop, and update project state before each safe handoff. If rate-limited mid-phase, use Section 12 to resume that same phase from repository evidence.

Every phase starts from the real repository state. Unless a phase explicitly permits implementation, do not write application code in discovery/design phases. Phase names are stable tracking labels; an approved phase may be divided into smaller implementation sessions if a provider quota or task size requires it.

## 11.1 Phase 0 - Repository and requirements discovery only

> **Start Phase 0 only. Do not implement the application.** Read this playbook and inspect the actual repository, Git status/history, current source, scripts, tests, assets, package/dependency files, environment examples and existing documentation. Identify the project's actual state with file-level evidence. Create or update `CLAUDE.md`, `docs/PROJECT_STATE.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/REQUIREMENTS_REGISTER.md`, `docs/OPEN_QUESTIONS.md`, `docs/DECISIONS.md`, `docs/KNOWN_ISSUES.md`, `docs/TEST_STATUS.md`, and `docs/SESSION_HANDOFF.md` as appropriate. Separate confirmed requirements, recommendations awaiting approval, technical safety rules and open decisions. Ask a concise but complete set of grouped questions only for decisions that block the next step. Stop after discovery and report the exact next phase. Do not install a major stack, make destructive changes or start broad implementation.

## 11.2 Phase 1 - Product rules and owner decisions

> Resume from actual repository state. Read the requirements/decision documents and apply only the answers I have supplied. Resolve the business rules needed before architecture: evaluation passing thresholds and level order; highest-level outcome; reassessment policy; mock-test eligibility by assigned student level; JFT level representation; timing/resume/abandon rules; scoring, negative-marking and rounding; historical-result visibility; whether payment gates access to individual tests, test packs or a subscription; product pricing/validity/refunds; supported languages; brand/content assets; and launch scope for optional features. Do not invent missing answers. Update `REQUIREMENTS_REGISTER.md`, `OPEN_QUESTIONS.md`, `DECISIONS.md` and acceptance criteria. Report remaining blockers and stop before implementing dependent behavior.

## 11.3 Phase 2 - Technology alternatives and approval

> Create/update `docs/TECH_STACK_OPTIONS.md`. Compare complete architectures, including MERN (MongoDB + Express + React + Node.js), PERN (PostgreSQL + Express + React + Node.js), and Next.js + PostgreSQL. Explain that PostgreSQL is a database and Next.js is a React framework, so they are not interchangeable stack choices. Compare frontend/framework, backend/API layout, database, ORM, authentication/session approach, validation, forms, state management, CSS/design system, animation, media/file storage, email, testing, deployment, monitoring and CI/CD. For each option explain pros, cons, operating complexity, likely cost drivers, lock-in and fit. Recommend a preferred stack with reasons, but do not install or lock major choices until I approve it. Record approved choices in `DECISIONS.md` and list rejected/parked alternatives.

## 11.4 Phase 3 - Visual direction, user journeys and design system plan

> Using only confirmed requirements and approved brand inputs, map public, student, admin, exam, result and checkout journeys. Inventory every required page and its states. Propose 2-3 distinct visual directions with palette rationale, typography, layout, component style and motion approach. The target is polished, memorable and modern - not a generic dashboard template. Consider Japanese text, kanji/kana readability, responsive layouts, accessible contrast, keyboard navigation and reduced-motion preferences. Ask me to approve the preferred direction before locking the visual identity. Create/update `docs/UI_SCREEN_INVENTORY.md` and `docs/DESIGN_SYSTEM.md`, with tokens and reusable component guidance. Do not implement the full frontend yet.

## 11.5 Phase 4 - System architecture and repository structure

> Read approved requirements, stack and design decisions. Design the end-to-end architecture for public website, student area, Admin CMS, backend/API, database, authentication, media storage, payments, email and monitoring. Define module boundaries, server/client responsibilities, authentication and authorization flow, error model, API style/versioning, configuration strategy, audit events and data flow. Show a text or Mermaid architecture diagram and recommended repository structure. Create/update `docs/ARCHITECTURE.md`, `docs/API_DOCUMENTATION.md`, repository setup notes and `docs/PROJECT_STATE.md`. Identify any remaining architectural blockers. Do not start feature implementation until the key boundaries and data ownership are consistent.

## 11.6 Phase 5 - Database/domain design

> Design the data model for the approved database. Include ERD/entity relationships, constraints, indexes justified by query patterns, unique/idempotency keys, migrations, seed data, retention, soft-delete/archive policy, audit trails and backup/restore assumptions. Model users/sessions/roles, level-determination stages and attempts, evaluation configuration versions, materials/media, exam types and levels, questions/options/explanations, question versions, test configuration versions, test attempts/answers, result snapshots, orders/payments/entitlements when the paid model is approved, CMS pages/settings and audit events as applicable. Explain how historical results remain stable if a question is edited later. Create/update `docs/DATABASE_ARCHITECTURE.md`. Do not perform destructive migrations; wait for approval of the schema design before applying it.

## 11.7 Phase 6 - Project and backend foundation

> Implement only the approved technical foundation. Set up the approved repository/package structure, configuration parsing and startup validation, database connection, migrations, request validation, centralized error handling, structured non-secret logging, health/readiness endpoints, lint/format/type-check/test commands and baseline CI checks where approved. Use real persistence. Do not implement student features or create permanent mock production APIs in this phase. Add tests for configuration, health, database connectivity and error handling. Update `.env.example`, `docs/ENVIRONMENT_REQUIREMENTS.md`, project state, test status and session handoff. Report exact commands and outcomes.

## 11.8 Phase 7 - Authentication, sessions, roles and permissions

> Implement the approved authentication and authorization flows for students and administrators: registration, login, logout, password reset and session/token lifecycle as specified by approved requirements. Add role/permission enforcement for Admin CMS modules and secure account status handling. Implement rate limits and appropriate security protections for the chosen architecture. Do not add unapproved social login, SMS/OTP or MFA. Add unit/integration tests for valid and invalid credentials, reset flow, session expiry/revocation, unauthorized access, privilege escalation and cross-user access. Update API docs, environment docs, test status and handoff.

## 11.9 Phase 8 - Shared frontend foundation and design system

> Build the approved public/student/admin frontend foundation using the approved stack and visual direction. Implement design tokens, typography, spacing, responsive breakpoints, reusable buttons/inputs/cards/tables/dialogs/toasts, page containers, navigation, form validation patterns, accessible focus styles and motion preferences. Establish API-client/error/loading patterns and route protection appropriate to the stack. Do not hard-code live educational content or pretend API actions succeed. Demonstrate the shared foundation in representative pages with responsive checks and component tests. Update `docs/DESIGN_SYSTEM.md` and project state.

## 11.10 Phase 9 - Admin CMS shell and reusable CRUD patterns

> Build the Admin Portal shell with role-aware navigation, dashboard structure, reusable paginated tables, validated forms, filters, search, sort, bulk selection where appropriate, confirmations, loading/empty/error/success states and audit-aware mutation patterns. Connect one representative module end-to-end to the real API/database before scaling the pattern. Enforce permissions in the backend, not only by hiding UI controls. Do not build every module in a single session. Test CRUD, validation, pagination, access denial and data persistence. Update project state and handoff.

## 11.11 Phase 10 - Student route gates and access control

> Implement student route behavior and server-side guards for the unresolved/determined level state. After successful login, check the persisted determination status. A student without a determined level must be routed to Level Determination; Study Materials, Mock Tests and Results must be denied by the backend until determination is completed. Prevent bypass through direct URLs, API calls, stale client state, new browser tabs and manipulated requests. Returning students with a determined level should enter the normal student interface. Do not assume that hiding navigation is a security control. Add end-to-end bypass tests.

## 11.12 Phase 11 - N5-first level determination engine

> Implement the approved evaluation progression rules only. Start at N5; reject student-selected starting levels and level skipping. Apply the approved per-level passing thresholds and sequential progression. Stop at the first failed stage, assign the highest successfully passed level, and assign N5/Beginner when N5 fails. Store attempts, answers, configuration/version used, outcomes and assignment rationale. Make submission/finalization idempotent and safe against retries or concurrent requests. Handle the approved highest-level and reassessment policies. Add automated tests for every pass/fail branch, bypass attempt, duplicated submission, race, returning login and incomplete/interrupted attempt. Update `docs/API_DOCUMENTATION.md`, test status and handoff.

## 11.13 Phase 12 - Study-material CMS and media

> Implement CMS CRUD and publication workflow for the confirmed N5/N4/N3 study library and approved categories such as Listening, Grammar, Reading and Kanji. Support approved text, image, audio and PDF/document content. Add media upload validation, storage metadata, preview, ordering, publish/unpublish/archive/restore as approved, and real student-facing APIs. Enforce current/lower-level eligibility and prohibit materials above N3 from appearing in student APIs. Verify an admin-created published item becomes available without code deployment, while draft/unpublished/ineligible content remains inaccessible.

## 11.14 Phase 13 - Examination types, levels and section configuration

> Implement the approved data-driven exam catalogue for NAT, JLPT and JFT. Use only the owner-approved level list and precise JFT representation. Add admin management for examination names, levels, sections/categories, ordering, descriptions and active/publication status, where approved. Do not hard-code configurable catalogues into the frontend. Validate referential integrity and prevent deactivation/deletion from breaking existing attempts/results. Add tests for invalid combinations, disabled levels, unpublished catalogue items and historical records.

## 11.15 Phase 14 - Question bank and import/export

> Implement the approved question bank: question text, multiple-choice options, correct answer, explanation, exam type/level, section/topic, approved marks/scoring metadata, and text/image/audio assets. Ensure Japanese text and any approved kana/kanji/furigana rendering are handled correctly. Add search/filter/pagination, duplicate, archive/version and question preview. Provide CSV/XLSX templates with field validation, import preview, duplicate detection, row-level errors and import summary; include export if approved. Prevent invalid questions from being used in published tests. Add tests for question validation, import edge cases, media references, permissions and version history.

## 11.16 Phase 15 - Mock-test builder and publication validation

> Build the Admin Mock Test Builder, distinct from Level Determination configuration. Allow authorized admins to configure approved examination type, level, sections, question selection, question/option ordering, duration, scoring, attempt policy, availability and publication state. Support manual or randomized selection only if approved. Add preview using the real student renderer. Reject tests with missing answers, invalid question/section mappings, incompatible levels, insufficient question counts or inconsistent scoring. Preserve versioned test configuration for every attempt. Test draft/publish/unpublish, access permissions and historical stability.

## 11.17 Phase 16 - Student mock-test runner

> Implement the approved student test flow with one question at a time, multiple-choice answers, text/image/audio rendering, question progress, remaining-time display, answer persistence per approved policy, manual submission confirmation and automatic submission at the authoritative deadline. Enforce test availability and attempt eligibility server-side. Handle reconnect, duplicate submission, expired timer, multiple tabs/devices, late answer requests and interrupted sessions according to approved policy. Do not expose correct answers during an active test unless explicitly approved. Add end-to-end tests and report any unresolved policy that blocks reliable behavior.

## 11.18 Phase 17 - Scoring, result pages and answer review

> Implement server-side score calculation using the versioned test/scoring configuration. Persist totals, correct/incorrect counts, marks, percentage, pass/fail according to approved rules, section breakdowns, date/time and per-question answer-review snapshots. Support review of both correct and incorrect answers, including the selected answer, correct answer and explanation. Show a student's own historical results and block access to other students' results. Preserve historical review if an admin edits a question or explanation later. Add scoring unit tests, API authorization tests and end-to-end result/history tests.

## 11.19 Phase 18 - Dynamic public website and CMS-managed pages

> Implement only approved public pages and page components. Add CMS-managed headings, copy, supported page sections, images, CTAs, links, exam overview/catalogue cards, FAQ and legal/static content where confirmed. Ensure supported page content and order are loaded from the backend/CMS rather than duplicated in source. Make the experience polished, responsive, fast and accessible, with restrained purposeful animation. Do not invent testimonials, ratings, exam success claims, official affiliations or unsupported exam facts. Verify a CMS content change reaches the public website without a code change.

## 11.20 Phase 19 - Products, checkout model and entitlements

> Implement the owner-approved purchase/access model only. Before coding, verify decisions for what is sold (individual test, test pack, course, subscription or another approved item), price/currency/tax, validity, refunds, receipt requirements and what access the purchase grants. Model server-priced products, orders and entitlements with clear state transitions. The browser must not set the price or mark an order paid. If decisions remain open, complete only the non-business-specific checkout interface/design plan and stop before activating paid access. Add tests for tampered price, expired/unpublished product and unauthorized entitlement access.

## 11.21 Phase 20 - Shared payment abstraction and environment preparation

> Prepare the common payment integration layer for eSewa, Khalti and connectIPS after the approved purchase model is documented. Compare the current official docs for the provider products that the owner can access. Define normalized internal payment states, idempotency keys, provider references, event/audit records, status reconciliation and environment variables. Create/update `.env.example` with placeholders and `docs/PAYMENT_INTEGRATION_RUNBOOK.md`; never place real values in docs or source. Do not simulate successful live transactions or activate access from a client return URL. Request merchant onboarding/configuration only when required.

## 11.22 Phase 21 - eSewa integration

> Implement eSewa using the current official integration documentation and provider-issued sandbox credentials available for this project. Record the exact product/API version, initiation request, signed fields, return handling, server-side status verification, amount/reference checks, callback/retry behavior and production configuration requirements. Do not guess signatures or response formats. Test success, failure, cancellation, pending/timeout where supported, duplicate callback, invalid signature/reference/amount, late confirmation and repeated requests. Keep client return navigation separate from proof of payment. Update the payment runbook and test evidence.

## 11.23 Phase 22 - Khalti integration

> Implement Khalti using its current official merchant documentation and provider-issued sandbox credentials. Verify the exact API flow and server-side lookup/verification requirements before coding. Map provider states into the approved internal state model, validate amount/reference/order ownership, and ensure idempotent finalization and entitlement activation. Test success, failure, cancel/expiry/pending where supported, duplicate or replayed requests, amount mismatch, invalid reference, provider unavailability and recovery/reconciliation. Update environment and payment documentation; do not fabricate credentials or mark unverified flows complete.

## 11.24 Phase 23 - connectIPS integration

> Implement connectIPS using the current official NCHL/connectIPS merchant documentation and available test/sandbox configuration. Confirm merchant/institution onboarding requirements and the applicable initiation, signing, return/notification and transaction-verification rules before coding. Validate amount, currency where applicable, merchant/order references, provider status and idempotency. Test success and all provider-supported failure, cancellation, pending, duplicate, mismatch and reconciliation scenarios. Document anything blocked by merchant onboarding; never simulate production verification.

## 11.25 Phase 24 - Approved email, notices, support and secondary features

> Implement only the secondary features that are explicitly approved in `DECISIONS.md`, such as transactional email, password-reset email, order receipts, announcements, support/contact workflow, notification preferences, coupons or refunds. Compare provider choices and required environment variables before integrating. Provide templates/content management where approved, safe retry handling and clear delivery status. Do not add SMS, push notifications, marketing automation or a new pricing feature just because it is technically possible. Test failure and retry cases; update documentation.

## 11.26 Phase 25 - Full integration and end-to-end regression

> Freeze new feature scope. Run systematic end-to-end tests for registration/login/reset, mandatory level determination, all pass/fail transitions, bypass prevention, material access, admin CRUD/publishing, question import, test configuration, question-by-question test taking, timing, manual/automatic submission, scoring, results, history, checkout and all provider sandbox flows that are configured. Include role/ownership/level authorization tests, empty/error/loading states, mobile/tablet/desktop responsive checks, accessibility checks and migrations from a clean database. Fix verified defects only, rerun tests, and update `docs/TEST_STATUS.md`, `docs/KNOWN_ISSUES.md` and `docs/PROJECT_STATE.md`.

## 11.27 Phase 26 - Security, performance and accessibility hardening

> Perform a focused security and quality pass; do not add new features. Inspect authentication/session protections, role permissions, IDOR/BOLA, CSRF/XSS/injection risks as applicable, file uploads/media access, secret leakage, environment validation, rate limits, admin escalation, question/answer exposure, exam deadline races, duplicate submission, payment callback verification, data retention, dependencies, query/index performance, caching, responsive layout, keyboard access, contrast and reduced-motion support. Reproduce and fix verified issues, add regression tests, and record remaining risks with severity and mitigation.

## 11.28 Phase 27 - Deployment, backups and operations

> Prepare a deployment plan for the approved hosting architecture. Document separate production environment variables, build/start commands, domain/TLS, database provisioning, migration/release order, media storage, payment URLs/allowlists, CORS/origin settings, monitoring/logging, error alerts, backup schedule, restore test, rollback and incident steps. Add CI/CD only as approved and supported by the repository. Use staging and provider sandbox before production. Never print secrets or commit `.env` files. Do not deploy or enable live payments without owner approval and verified provider credentials/configuration.

## 11.29 Phase 28 - Final production audit and release gate

> Audit the real implementation against every confirmed requirement, approved decision, acceptance test, architecture/database/API document, CMS module, payment runbook, environment requirement and deployment procedure. Assign each feature `COMPLETE`, `PARTIAL`, `MISSING`, `BROKEN`, `BLOCKED` or `UNVERIFIED` and cite the code/API/database/test evidence. Identify permanent mocks, hard-coded editable content, broken direct API authorization, missing CRUD, scoring/result history issues, insecure media, unresolved provider onboarding, missing environment values and operational gaps. Create/update `docs/PRODUCTION_READINESS_AUDIT.md` and `docs/RELEASE_READINESS.md`. Report go/no-go status and remaining blockers. Do not claim production-ready or enable live payments unless critical checks pass and the owner approves release.

# 12. What to Do When the Agent Rate-Limits or Stops

Rate limits, context limits, IDE restarts and interrupted tool calls are normal. **Do not ask only `Did you complete the task?`** That question encourages an unsupported yes/no claim and does not establish what is actually in the repository. Use a repository-audit resume prompt instead.

## 12.1 Standard resume prompt - copy/paste after a rate limit

> **RESUME THE JAPANESE MOCK TEST SYSTEM FROM THE ACTUAL REPOSITORY STATE.** The previous Claude Code/AI-agent session may have stopped because of rate limits, context limits, or an interrupted task. Do not assume it completed anything, and do not restart the project from scratch.
>
> Before modifying code:
>
> 1. Read `CLAUDE.md` and, if present, `docs/PROJECT_STATE.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/SESSION_HANDOFF.md`, `docs/DECISIONS.md`, `docs/REQUIREMENTS_REGISTER.md`, `docs/OPEN_QUESTIONS.md`, `docs/KNOWN_ISSUES.md`, `docs/TEST_STATUS.md`, and the current phase instructions in this playbook.
> 2. Inspect the repository tree, `git status`, recent Git history/diffs, package scripts, relevant source files, tests, schema/migrations, API routes and environment examples.
> 3. Compare the docs with the actual code. Report what is verified complete, partial, missing, broken, blocked or unverified. Do not infer progress from the previous chat transcript alone.
> 4. Identify the exact phase, milestone and task that was in progress; list files changed, commands/tests run, last known failure, and the next smallest step.
> 5. **Continue only the unfinished approved task.** Do not recreate completed work, rewrite unrelated modules, switch approved technologies, or start a later phase without its gate being passed.
> 6. Make progress on that bounded task. If it cannot be completed within this session, stop at a safe checkpoint, retain working changes, document the precise continuation point, and do not falsely mark the task complete.
> 7. Run relevant tests and inspect their actual output. Update `PROJECT_STATE.md`, `IMPLEMENTATION_PLAN.md`, `SESSION_HANDOFF.md`, `TEST_STATUS.md`, `KNOWN_ISSUES.md` and `CHANGELOG.md` as appropriate. Include exact next steps and the remaining blocker.
>
> Start your response with: `CURRENT PHASE`, `CURRENT TASK`, `VERIFIED COMPLETE`, `PARTIAL/IN PROGRESS`, `MISSING/BLOCKED`, `FILES/DATABASE/APIS CHANGED`, `TESTS AND RESULTS`, and `NEXT EXACT STEP`. Then continue the unfinished task instead of stopping after merely summarizing, unless a product decision or owner approval is required.

## 12.2 If you want the new session to inspect first and wait

Use this shorter variant if you do not want the agent to write more code before showing you the state:

> Resume from the real Japanese Mock Test System repository. Read the persistent project-state/decision/handoff documents, inspect Git status/diffs and the relevant implementation/tests. Do not modify code yet. Report the current phase, verified completed work, partial work, missing work, test results, blockers and exact recommended next action with evidence. Do not rely on conversation memory or ask yourself whether the previous agent said it was done. Wait for my approval before continuing implementation.

## 12.3 Resume a specific phase or module

> Resume the approved Japanese Mock Test System task: **[PHASE / MODULE / TASK NAME]**. Inspect the real repository and all relevant state, decision, handoff and test documents. Determine exactly what is complete, partial, broken and missing. Continue from the smallest unfinished implementation point only. Do not duplicate completed work or change approved architecture. Run relevant tests and update state/handoff documents before stopping. If blocked by an unresolved owner decision or missing credentials, explain the blocker and stop at that boundary.

## 12.4 What the agent must do before a rate-limit stop

When work is progressing normally, instruct the agent at the start of a phase to leave the repository resumable. At every safe stopping point it must record the current phase/task, actual completed work, unfinished work, files changed, migrations/API changes, tests and outcomes, known issues, required environment variable **names** (never values), pending owner decisions and exact next command/action. A new agent should verify that record against the code before relying on it.

# 13. End-of-Session Handoff

## 13.1 End-of-session prompt - copy/paste before closing a session

> Prepare the repository for a clean continuation by another session. Do not claim unfinished work is complete. Inspect the actual diff and test outputs, then update `docs/PROJECT_STATE.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/SESSION_HANDOFF.md`, `docs/KNOWN_ISSUES.md`, `docs/TEST_STATUS.md` and `docs/CHANGELOG.md`; also update requirements/open questions/decisions if they changed. The handoff must state the current phase, bounded task, verified completed items, partial/uncompleted items, exact changed files, database/API changes, commands and tests with actual results, known defects, blockers, environment variable names still needed (no values), owner decisions required and the exact next step. Do not revert good partial work merely to make the tree look clean. Ensure no secrets were added. Finish with a short factual summary and the next copy-paste prompt the owner should use.

At every safe stopping point, update:

- `docs/PROJECT_STATE.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/SESSION_HANDOFF.md`
- `docs/KNOWN_ISSUES.md`
- `docs/TEST_STATUS.md`
- `docs/CHANGELOG.md`
- `docs/OPEN_QUESTIONS.md` and `docs/DECISIONS.md` if decisions or questions changed

`SESSION_HANDOFF.md` must include current phase/milestone, exact task, completed items with evidence, partial items, unfinished work, next commands/steps, changed files, schema/migration changes, API changes, design changes, tests run and results, known issues, blockers, environment variables still required (names only, never values), owner decisions required, and any deployment/payment state. If the task is partially implemented, name the exact module/files and current failure point.

---

# 14. Production Audit Prompts

## 14.1 Implementation-versus-requirements audit

> Perform a full production-readiness audit without modifying code first. Compare the actual repository against the confirmed requirements register, approved decisions, implementation plan, architecture/database/API docs, student app, Admin CMS, payment runbooks, security rules, tests, environment documentation and deployment plan. For every requirement report `COMPLETE / PARTIAL / MISSING / BROKEN / BLOCKED / UNVERIFIED`, evidence, reproducible test or file/route, impact and recommended fix. Identify hard-coded content, permanent mocks, fake metrics/payment verification, broken direct API access, missing admin permissions, non-versioned historical results, absent tests and deployment gaps. Create/update `docs/PRODUCTION_READINESS_AUDIT.md`; stop before changing code.

## 14.2 Fix approved audit findings

> Implement only owner-approved findings in priority order. Reproduce/confirm the issue, make the smallest safe fix, add/regress tests, run relevant checks, update the audit status and project-state files. Do not add unrelated features or close a finding without evidence.

## 14.3 Final release audit

> Verify production build, required environment variables, no committed secrets, database migrations/constraints/indexes, backup and restore rehearsal, authentication/authorization, level determination gates, question/test version snapshots, timers/submission/scoring, results and answer review, payment provider sandbox and production configuration, duplicate callback safety, entitlement correctness, logs/monitoring, error handling, accessibility, privacy/terms/refund policies supplied by the owner, domain/TLS, deployment and rollback instructions. Generate `docs/RELEASE_READINESS.md` with a go/no-go status and remaining blockers. Do not activate live payments or call the system production-ready without owner approval and all critical gates passing.

---

# 15. Backend, Data, and Security Non-Negotiables

1. Use the approved database as the canonical source of durable application data.
2. Use migrations/schema changes with review, constraints and indexes based on actual query patterns.
3. Model domain concepts and relationships; do not create a database design with one table/collection per screen.
4. Enforce every authorization and level-access rule server-side. UI checks are for user experience, not a security boundary.
5. Do not use the client-supplied user ID, level, price, marks, score, payment status, or completion flag as authoritative.
6. Calculate score and determination on the server from a versioned attempt/test configuration.
7. Make submit/finalization/payment-callback flows idempotent and protect against races and retries.
8. Preserve enough snapshots/version metadata to make historical result review stable.
9. Paginate large lists and avoid shipping the full question bank or all student records to the browser.
10. Use safe file validation and appropriate private/signed access for restricted media.
11. Use secure headers, rate limits, input validation, safe error messages and non-secret logs.
12. Keep financial, audit and completed assessment records protected from casual destructive deletion.
13. Keep secrets out of client bundles, source code, Git, error messages, screenshots and logs.
14. Validate environment configuration at startup and fail clearly when required variables are absent.
15. Use real APIs/database behavior in production paths. Mock providers only in isolated tests or explicitly labelled development environments.
16. Test authorization, not just the happy path: wrong user, wrong role, wrong level, expired access, unpublished content and manipulated IDs.
17. Never claim provider approval, merchant readiness, production keys, backups or successful deployment unless verified.

## 15.1 Suggested domain entities - subject to approved design

| Domain | Candidate entities |
|---|---|
| Identity/access | User, AdminProfile if needed, Role, Permission, RolePermission, Session/AuthEvent, EmailVerification/PasswordReset token records as applicable. |
| Level determination | LevelCatalogue, EvaluationStage, EvaluationConfigVersion, DeterminationAttempt, DeterminationAnswer, LevelAssignment/DeterminationHistory. |
| Learning | MaterialCategory, StudyMaterial, MaterialVersion, MediaAsset, MaterialLevelAccess/visibility records as needed. |
| Examination configuration | ExamType, ExamLevel, ExamSection, Topic/Tag, publication/configuration records. |
| Question bank | Question, QuestionVersion, QuestionOption/OptionVersion, QuestionMedia, AnswerExplanation, import batch/row error records, question report if approved. |
| Mock exams | MockTest, MockTestVersion, TestSection, TestQuestion/blueprint, Attempt, AttemptAnswer, ResultSnapshot, SectionResult. |
| Commerce (if approved products) | Product/Offer, Price/AccessRule, Order, OrderLine, PaymentTransaction, PaymentProviderEvent, Entitlement, Receipt/Invoice, Refund record if approved. |
| Operations | AuditLog, AppSetting, FeatureFlag, Notification/Announcement if approved, SupportTicket if approved, BackgroundJob status if applicable. |

This list is a discovery aid, not a final schema. Avoid premature tables/collections until business rules and the approved database are known. Entity names must align with the selected ORM/schema and actual requirements.

---

# 16. Testing Strategy and Acceptance Criteria

## 16.1 Test layers

- **Unit:** level progression, threshold/rounding, score calculations, permission policies, payment-state mapping, validation schemas.
- **Integration:** database transactions, auth/session lifecycle, CMS CRUD, media metadata, question import, attempt saves/finalization, provider verification adapters.
- **End-to-end:** visitor/register/login, mandatory evaluation, study materials, mock test, submission/result/review, admin content publication, checkout and verified payment in sandbox.
- **Security/negative tests:** direct API bypass, unauthorized admin actions, IDOR/BOLA, stale/expired tokens, malformed imports, file spoofing, duplicate requests, amount tampering, callback replay.
- **Operational tests:** migration on clean DB, backup restore, environment validation, production build, rollback/redeploy, monitoring signal.

Choose exact frameworks after the stack is approved. Run tests in CI with safe fixtures and isolated test credentials/data.

## 16.2 Required acceptance tests - level determination

- A new logged-in student is routed to N5 determination, not the normal feature area.
- Direct requests to materials, mock-test, or result APIs are rejected while level determination is unresolved.
- Client navigation tricks, manually edited URLs, forged request bodies and local-storage changes cannot bypass the backend check.
- The student cannot choose N4/N3/N2/N1 or skip a configured stage.
- Passing N5 starts N4; passing continues to the next configured stage.
- Failing any stage stops progression and assigns the highest successfully passed level.
- Failing N5 assigns N5 / Beginner.
- Refresh/relogin after completion goes to the normal student area without rerunning the evaluation.
- Duplicate submissions and retries do not create duplicate assignments or mutate the final result incorrectly.
- Historical determination evidence records the threshold/config version used.

## 16.3 Required acceptance tests - mock tests/results

- Student sees only published tests permitted by approved eligibility/access rules.
- One question is shown at a time; progress matches the saved/current question.
- Answers persist according to the approved autosave/navigation policy.
- Server enforces deadline and performs one final submission when time expires.
- Manual submission requires confirmation in the UI and is validated server-side.
- Multiple submit requests do not create duplicate results.
- Server scoring matches approved test version, marks and rounding rules.
- Results include all required metadata and section breakdown where applicable.
- Correct and incorrect answers both appear in review with the correct explanation.
- Edits to a question after a past attempt do not rewrite the historical review.
- Only the authorized student and allowed admin roles can view result details.

## 16.4 Required acceptance tests - CMS

- Each approved module has working CRUD against persistent storage.
- Every mutation validates fields and permissions server-side.
- Publishing supported content updates student-facing APIs without deployment.
- Unpublished/archived/restricted items are not exposed through normal student APIs.
- Import produces a validation preview and actionable per-row errors; invalid data is not silently accepted.
- Bulk actions identify affected record counts and outcomes.
- Sensitive changes have an audit record with actor, action, time and target entity.
- Published test or question edits preserve in-progress/completed attempt integrity according to the approved policy.

## 16.5 Required acceptance tests - payments

For each provider, cover success, failure, cancellation, pending, timeout, duplicate callback/return, invalid signature/verification, reference mismatch, amount mismatch, provider outage, late status confirmation, replay, and duplicate entitlement activation. Use actual provider sandbox credentials and record evidence. If merchant sandbox access is not available, mark provider integration `BLOCKED` or `UNVERIFIED`, not `COMPLETE`.

---

# 17. Deployment and Operations

Deployment design depends on the approved stack and hosting choice. The production plan must document:

- Environment separation: local, test/CI, staging/sandbox, production.
- Domain/DNS, HTTPS/TLS, secure cookie/session settings, CORS if relevant, trusted proxy settings, and allowed return/callback URLs.
- Database provisioning, least-privilege credentials, connection pooling where required, migration policy, backup schedule, and restore testing.
- Storage bucket permissions, media restrictions, CDN/signed URL policy and lifecycle/backups if required.
- Secret provision/rotation in the hosting secret manager; no secrets in Git or client bundles.
- CI checks: lint, formatting, tests, build, migrations review, and deployment gates appropriate to the stack.
- Staging smoke test before production deployment.
- Monitoring, logs, error alerting, uptime/health endpoint, and escalation owner.
- Rollback strategy for application deployment and backward-compatible schema changes.
- Payment production activation checklist, merchant access and support/escalation contacts.
- Operational runbooks for payment reconciliation, failed emails, database restore, outage and compromised credentials.

Do not choose a hosting provider solely on headline price. Compare backups, availability, operational burden, database locality/latency, log visibility, background processing needs, TLS, custom domains, bandwidth/egress, scaling, support and full expected monthly cost. No hosting/provider is locked by this playbook.

---

# 18. Definition of Done

| Area | Done when |
|---|---|
| Requirements | Critical business rules are confirmed; open decisions are documented with impact/owner; no silent assumptions. |
| Design | Approved art direction and design system are applied consistently; responsive and accessibility checks pass. |
| Public website | Approved pages, CTAs, catalogue/product details and legal/support content work; no dead or fake links. |
| Auth | Required registration/login/reset/session flows pass and endpoints enforce authentication/authorization. |
| Level determination | N5-first progression, pass/fail stop, N5 fallback, persistence and bypass prevention pass automated tests. |
| Study materials | N5/N4/N3 visibility and media playback work from real stored content; unsupported levels are blocked. |
| Question bank/CMS | Complete approved CRUD, validation, preview/publish, audit/versioning, import/export and search/filter behavior. |
| Mock runner | One-question flow, progress, answer persistence policy, timer, manual/automatic submission and edge cases pass. |
| Results | Correct server-side scoring, section results, historical answer review and permissions verified. |
| Payments | Each required provider has sandbox test evidence; verification and idempotency work; unresolved merchant approvals are clearly blocking production payment activation. |
| Database | Migrations, constraints, indexes, history/version semantics and backup/restore plan are verified. |
| Security | Critical authorization, input, upload, session, secrets, payment and common web/API risks addressed. |
| Testing | Critical unit/integration/E2E tests pass; remaining gaps are documented and accepted by the owner. |
| Operations | Environments, deployment, monitoring, backup/restore, rollback and incident runbooks documented. |
| Documentation | Architecture, API, env inventory, handoff, test status, decisions and changelog match real implementation. |
| Release | Audit is evidence-based; no unresolved critical blocker; owner approves release and production gateway activation. |

---

# 19. Common Agent Failure Modes and Required Response

| Failure | Required response |
|---|---|
| Agent immediately starts coding | Stop broad implementation; perform discovery and obtain the required decisions. |
| Stack is selected without approval | Produce comparison, explain trade-offs, record as pending, wait for owner. |
| The terms MERN/PostgreSQL/Next.js are treated as interchangeable | Correctly separate framework, runtime/API and database choices; compare complete combinations. |
| Product rules are guessed | Move the guess to `OPEN_QUESTIONS.md`; do not implement until answered if scope-critical. |
| UI is modern-looking but static | Connect to real APIs and DB; verify create/update/publish appears in student experience without a code release. |
| Client-side route protection only | Test direct API access and add backend authorization. |
| Student can bypass determination by URL/API | Treat as a critical defect; implement a shared server-side eligibility policy and regression tests. |
| Answers/results change after question edits | Introduce approved version/snapshot design and regression tests. |
| Test timer relies only on browser time | Validate a server deadline and idempotent finalization. |
| Payment success trusts return URL | Block access activation; implement provider-backed server-side verification and replay protection. |
| Secret values are fabricated or committed | Remove exposed values, rotate genuine secrets if needed, use placeholders/sandbox credentials, review Git history. |
| Mock APIs survive into release | Audit and replace production paths with persistent implementations or explicitly mark the feature blocked. |
| CMS delete breaks history | Replace destructive deletion with archive/soft-delete/referential policy suitable to the entity. |
| Fake analytics/testimonials appear | Remove them or label sample fixtures in development only; use real source data in production. |
| Agent adds many unsolicited features | Record them in the recommendation backlog and ask for approval. |
| Agent says “done” after compilation | Require relevant automated and end-to-end evidence. |
| Context resets and work is repeated | Resume from repository/state docs, inspect Git/code/tests, and continue only the precise unfinished task. |

---

# 20. Quick Copy-Paste Prompts

## 20.1 Audit before coding

> Before writing code for `[FEATURE]`, inspect the actual implementation, routes, database/schema, tests, permissions, and dependent modules. Report what is complete, partial, broken and missing with evidence. Identify relevant confirmed requirements, open decisions and dependencies. Propose the smallest safe implementation plan and wait if owner approval is required.

## 20.2 No assumptions

> Do not invent business rules, prices, thresholds, access duration, refund policy, scoring rules, credentials, provider behavior or user-facing claims. Separate confirmed requirements from recommended enhancements and technical choices. Ask grouped questions for decisions that materially affect scope, security, cost, data or behavior. Otherwise use a clearly labeled reversible technical default only when permitted by the approved stack.

## 20.3 Verify before claiming done

> Do not claim completion because code exists or compiles. Run the relevant unit/integration/E2E tests and verify the actual end-to-end behavior in the appropriate environment. Report commands run, results, evidence, limitations, environment, and remaining work. Update project state and test status.

## 20.4 Continue from here

> Read the project-state and decision docs; inspect `git status`, recent history and the related code/tests. Identify the exact unfinished task and continue without duplicating completed work. Update the handoff before stopping.

## 20.5 Review UI quality

> Review the approved design system and actual pages at desktop/tablet/mobile sizes. Check hierarchy, typography, palette, spacing, component consistency, responsive behavior, loading/empty/error states, accessibility, reduced motion, Japanese text wrapping, test focus and CTA clarity. Do not replace the approved visual direction casually; document evidence and propose targeted changes.

---

# 21. Owner Approval Checklist / Open Decisions Register

The agent should group and ask these questions at the relevant gate. It must not repeatedly ask a question whose answer is already recorded. Partial responses are acceptable; carry unanswered items forward.

## Product and audience

- [ ] Public brand/product name, logo, existing assets and domain.
- [ ] Primary audience and geographic markets.
- [ ] Supported interface/content languages: Japanese, English, Nepali, or other combinations.
- [ ] Required public pages, customer support channel and contact information.
- [ ] Approved claims/test descriptions, legal copy, privacy/terms and refund policy.

## Level determination

- [ ] Exact ordered evaluation levels and the behavior after passing the highest available stage.
- [ ] Passing threshold for each stage; whether thresholds can differ.
- [ ] Exact scoring, rounding and tie/unanswered rules.
- [ ] What students see immediately after level determination and what appears in the Results section.
- [ ] Whether/how reassessment is allowed after determination.
- [ ] Policy for interrupted/incomplete evaluations and admin correction/override.

## Examinations and mock tests

- [ ] Verify exact NAT/JLPT/JFT level taxonomy, especially JFT labels A1, A2.1, A2.2 and A2.
- [ ] Which mock-test levels each student may access, regardless of determined study level.
- [ ] Supported question types beyond multiple choice, if any.
- [ ] Section composition, question counts, durations, marks, negative marking and pass rules.
- [ ] Question navigation, autosave, resume/pause, multiple-device policy and abandoned-attempt rules.
- [ ] Whether correct answers/explanations appear immediately or only after submission.
- [ ] Whether mock tests are fixed question sets, randomized sets, or both.

## Study content and question data

- [ ] Who supplies content, audio, images, questions, correct answers and explanations; usage/licensing permissions.
- [ ] Japanese text rendering details, including furigana/ruby requirements.
- [ ] Question import template fields, duplicate identification and all-or-nothing vs partial import policy.
- [ ] Required media/storage and whether paid/restricted files need expiring signed access.

## Monetization and payments

- [ ] Product model: single test, test bundle/pass, subscription, premium access, or combination.
- [ ] Which features/tests are free vs paid.
- [ ] Pricing/currency, sale prices, access validity/expiry, tax/invoice requirements.
- [ ] Coupons/discounts, order cancellation, refunds, charge disputes and purchase transfer rules.
- [ ] Business/merchant onboarding for eSewa, Khalti and connectIPS; who owns each merchant account.
- [ ] Sandbox credentials and production activation process for each gateway.
- [ ] Receipt/invoice format, support contact and reconciliation owner.

## Admin and operations

- [ ] Final admin roles/permissions and who can publish, change thresholds, export data, or view payment records.
- [ ] Whether MFA is required for administrators.
- [ ] Email provider and verification/reset-email policy; OAuth/social sign-in if needed.
- [ ] Support/ticketing and notification requirements.
- [ ] Analytics/monitoring requirements and privacy preferences.
- [ ] Hosting, domain/DNS, database/storage provider, budget, region, backup and recovery expectations.
- [ ] Deployment target, CI/CD preferences and ongoing operations owner.
- [ ] Required uptime/performance target and expected initial traffic/concurrency.

## Technology and design

- [ ] Approve complete architecture after reviewing options in Section 7.
- [ ] Approve UI styling, animation, authentication, ORM, storage, email, testing and monitoring choices.
- [ ] Approve one visual art direction from 2-3 proposals.
- [ ] Confirm JavaScript vs TypeScript if not already recorded for the project.

The agent should ask for a grouped set of the **critical** questions first rather than overwhelm the owner with every optional detail at once. Decisions can be staged according to the roadmap; no code agent should demand production secrets before an integration is approved and its sandbox step is ready.

---

# Appendix A. Recommended `CLAUDE.md` Permanent Rules

1. This repository is the source of truth for the Japanese Mock Test System.
2. Read project-state, requirements, decisions, open questions and handoff docs at session start.
3. Reconcile documents against actual code and Git before modifying files.
4. Never silently invent requirements or claim a proposed item is approved.
5. Compare major stack choices and wait for owner approval before locking them.
6. Enforce level determination and authorization on the server.
7. Calculate attempt outcomes on the server using an approved, versioned configuration.
8. Do not trust client prices, scores, levels, payment success or completion flags.
9. Do not fabricate production credentials or commit secrets.
10. Verify payment via current official provider mechanisms before granting purchased access.
11. Use real database/API behavior in production paths; clearly isolate test mocks.
12. Preserve the historical meaning of completed tests/results.
13. Validate all imported content and media before publication.
14. Keep CMS changes auditable and permissions explicit.
15. Follow the approved design system, accessibility and reduced-motion guidance.
16. Run relevant tests and provide evidence before marking work complete.
17. Update project state, test status and session handoff after material work.
18. Do not introduce unapproved features just because they appear useful; propose and ask first.

---

# Appendix B. Project State Template

Use this as the concise continuation record. Keep it truthful and update it after each bounded milestone.

```md
# Project State
Current phase / milestone:
Overall status: NOT STARTED / IN PROGRESS / PARTIAL / BLOCKED / RELEASE-READY
Last verified commit:

## Work status
- Verified complete (with evidence):
- Partial / unverified:
- In progress:
- Remaining:

## Changes
- Files changed:
- Database / migrations:
- API / integrations:
- Student UI / CMS UI:

## Verification and blockers
- Tests run and actual results:
- Known issues / risks:
- Blockers:
- Owner decisions required:
- Environment variable names still needed (never values):
- Exact next task and command/action:
```

---

# Appendix C. Payment and Environment Readiness Checklist

- [ ] Provider's current official web/API product and version verified.
- [ ] Merchant onboarding and business approval status recorded.
- [ ] Sandbox/test account provisioned by provider; credentials not fabricated.
- [ ] `.env.example` contains names/placeholders only and is committed safely.
- [ ] Real local `.env` is ignored by Git; production variables are stored in host secret settings.
- [ ] Server-side order/price creation and transaction-reference generation implemented.
- [ ] Provider-specific signature/authentication and status verification tested.
- [ ] Callback/return route validation and idempotency tested.
- [ ] Pending, failure, cancel, timeout and uncertain-state behavior tested.
- [ ] Duplicate payment cannot create duplicate entitlement/order effects.
- [ ] Payment reconciliation and support runbook written.
- [ ] Production callback/return URLs confirmed with merchant dashboard/provider.
- [ ] Live credentials and production switch are added only after owner approval and successful sandbox sign-off.

---

# Appendix D. Official Payment Documentation Starting Points

These official resources were checked while preparing this playbook. The implementation agent must re-check current documentation when each integration is actually built, because provider products and requirements can change.

- eSewa developer documentation: <https://developer.esewa.com.np/pages/Introduction>
- eSewa ePay v2: <https://developer.esewa.com.np/pages/Epay-V2>
- Khalti Payment Gateway documentation: <https://docs.khalti.com/>
- Khalti web ePayment integration: <https://docs.khalti.com/khalti-epayment/>
- connectIPS official site / merchant entry point: <https://connectips.com/>
- Nepal Clearing House technical documentation: <https://doc.connectips.com/>

Provider onboarding, merchant approval, credentials and the exact connectIPS payment-processor integration must be confirmed with the respective provider. This document does not invent or promise merchant credentials or approval.

---

**End of playbook.** Use the roadmap, requirements register, open-questions list, and approval gates as the operating workflow. The next implementation action must always be based on the actual repository and the owner's approved decisions.
