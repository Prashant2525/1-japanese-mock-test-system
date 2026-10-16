# Decisions Log

Only owner-approved decisions are recorded here. Pending choices live in `docs/OPEN_QUESTIONS.md`.
Where a decision is an agent **interpretation** of an owner answer, it is marked *(interpretation — owner may amend)*.

Last updated: 2026-10-15 (Phase 11).

---

## Process and product

| ID | Date | Decision | Source |
|---|---|---|---|
| D-001 | 2026-10-14 | The Production Build Playbook (v1.1) is the operating manual. Phases run in order with approval gates; the repository is the implementation truth; the owner holds authority over unresolved product and approval-gated technical decisions. | Owner master prompt |
| D-002 | 2026-10-14 | The product is a production web application: public site, student area, Admin CMS, backend/API, database and payments. Native mobile apps are out of scope. | Owner master prompt; PB §2.1, §2.4 |
| D-003 | 2026-10-14 | Primary market is Nepal. Currency NPR. Business time zone Asia/Kathmandu (dates are stored in UTC and displayed in that zone). | PA-1 |
| D-004 | 2026-10-14 | UI languages are **English and Japanese**, switched by a language toggle in the navbar. Every CMS-managed user-facing text field supports both EN and JA; application UI strings live in translation catalogues. The model must allow adding more locales later. | PA-2 |
| D-005 | 2026-10-14 | Brand name is **Nihongo Mock**. Official assets are in `nihongo-mock-logo-assets/nihongo_mock_logo/` (horizontal logo SVG/PNG, square icon SVG/PNG). Phase 3 design directions must build on this logo and its palette (reds `#E64646`→`#B91F2B`, `#C92732`; navy `#142B4A`; greys `#5B6575`, `#AAB7C8`). | PA-3 |
| D-006 | 2026-10-14 | All proposed public pages are in launch scope: home, NAT/JLPT/JFT overviews, mock-test catalogue, test/product detail, pricing, about, FAQ, contact, privacy policy, terms, refund policy. The agent drafts the initial EN + JA copy (legal pages included). Drafts are seeded as CMS content marked **DRAFT – owner review required**, and the owner edits them in the CMS. Legal drafts are templates, not legal advice; owner sign-off on every legal page is a release gate. No fake testimonials, ratings, statistics or official-affiliation claims. | PA-4 |
| D-007 | 2026-10-14 | Every rule, value and piece of content below is managed from the Admin CMS, within the boundary set by D-020. | Owner answer "make it entirely manageable from CMS" |

## Level determination

| ID | Date | Decision | Source |
|---|---|---|---|
| D-008 | 2026-10-14 | Launch sequence is **N5 → N4 → N3** only. N2/N1 stages (and their study materials) can be enabled later through the CMS without major code changes. Levels that are not enabled are not shown or offered anywhere. Passing the highest enabled stage assigns that level (N3 at launch). | LD-1 |
| D-009 | 2026-10-14 | Each stage has its own pass threshold (%), editable in the CMS and versioned. Unanswered = wrong. Pass if score ≥ threshold, with no rounding before the comparison. | LD-2, LD-3 |
| D-010 | 2026-10-14 | Each stage is timed; the duration is set per stage in the CMS. An interrupted stage resumes with the **original server deadline**, and expiry auto-submits. | LD-4, LD-7 |
| D-011 | 2026-10-14 | Each stage version has a fixed question set, assigned in the CMS. | LD-8 |
| D-012 | 2026-10-14 | Right after the final stage, the student sees a **"Your level" summary screen** (assigned level and per-stage scores; copy managed in the CMS). Once determination is complete, determination attempts appear in Results history with full answer review. | LD-5 |
| D-013 | 2026-10-14 | Reassessment happens only through an admin-triggered reset in the CMS, with a mandatory reason and an audit entry. Manual level override: Super Admin only, with a mandatory reason and an audit entry. | LD-6, LD-9 |

## Examinations and mock tests

| ID | Date | Decision | Source |
|---|---|---|---|
| D-014 | 2026-10-14 | The exam/level catalogue is CMS-managed data. Seed values: JLPT N5–N1. NAT 5Q–1Q, each mapped to an equivalent N-level (5Q≈N5 … 1Q≈N1). JFT A1, A2.1, A2.2, A2, which the owner may rename, reorder or restructure in the CMS. | MT-1 |
| D-015 | 2026-10-14 | Once determination is complete, a student may take mock tests at **any** enabled level. Study materials stay level-gated (current and lower levels). | MT-2 |
| D-016 | 2026-10-14 | Free back/forward navigation; answers editable until submission; "mark for review" flag included. | MT-3 |
| D-017 | 2026-10-14 | Scoring: per-question marks, total marks, percentage and an overall pass mark per test, plus optional per-section minimum marks configurable per test. No negative marking. Correct answers and explanations are shown only after final submission. | MT-6, MT-7 |
| D-018 | 2026-10-14 | Fixed question sets at launch; option shuffle configurable per test. Single-answer multiple choice only at launch. Each exam type has default sections that a test can override. Retakes of free tests are unlimited. *(interpretation — owner may amend)*: retakes of paid tests are unlimited while access is valid, with an optional per-test attempt limit in the CMS. | MT-5, MT-8, MT-9, MT-10 |

## Commerce and payments

| ID | Date | Decision | Source |
|---|---|---|---|
| D-019 | 2026-10-14 | Products: individual mock tests plus bundles, each with an access-validity period; no recurring subscriptions. Free: level determination, study materials, and one sample test per exam type (any test can be marked free in the CMS). Prices, products, bundles and validity are managed in the CMS; the server always derives the charge. No coupons or refunds at launch. The owner starts merchant onboarding with eSewa, Khalti and connectIPS in parallel with development. | PAY-1..4 |

## CMS configurability boundary

| ID | Date | Decision | Source |
|---|---|---|---|
| D-020 | 2026-10-14 | *(interpretation — owner may amend)* **"Entirely manageable from the CMS" means:** **Admins can configure** values (thresholds, durations, marks, prices, validity, attempt limits), toggles between approved options (level enabled, free flag, option shuffle, section minimums, payment method enabled/display order), catalogue entries, all bilingual content and copy, media, roles and permission assignments. Every config change is validated server-side and audited. Changes that affect scoring are versioned and apply to **new attempts only**. **Fixed in code — not CMS-editable**, because they are safety invariants from the playbook: determination always starts at N5 and progresses sequentially with no skipping; the server is authoritative for scores, levels and deadlines; correct answers are never exposed during an active attempt; payment verification happens server-side; completed results cannot be edited as free text; audit logging cannot be switched off. **Payment credentials and other secrets are never stored or edited in the CMS**; they live in environment variables / the host's secret manager (PB §8.1). | Owner answers + PB §5.4, §5.16, §8.1, §15 |

## Accounts and administration

| ID | Date | Decision | Source |
|---|---|---|---|
| D-021 | 2026-10-14 | Student sign-up is email + password with **email verification**; no social, SMS or phone login. This requires a transactional email provider (selected in Phase 2). | OPS-1 |
| D-022 | 2026-10-14 | Launch roles: Super Admin, Content Editor, Support (read-only). Granular permissions sit underneath, so a Super Admin can edit role-permission assignments or add roles in the CMS. | OPS-2 |
| D-023 | 2026-10-14 | Support at launch: a contact form plus a support email address (contact details managed in the CMS). | OPS-3 |
| D-024 | 2026-10-14 | Content: the owner supplies all questions, media and explanations and confirms rights before publication. Furigana is optional per text field (ruby markup). Imports show a preview, then commit all-or-nothing. Duplicates are detected by normalized question text + exam + level. | CON-1..4 |

## Technology

| ID | Date | Decision | Source |
|---|---|---|---|
| D-025 | 2026-10-14 | **Architecture: Option C — Next.js + PostgreSQL**, written in **TypeScript**. One integrated application (no separately deployed API service). Domain logic sits in a server-side service layer behind clean, versionable HTTP endpoints, so a mobile client could be added later without a rewrite. | Owner choice (Option C); TECH-1, TECH-2, TECH-4 |
| D-026 | 2026-10-14 | Maintainers are the owner plus one friend, so prefer mainstream, well-documented tools with low operational burden. Initial scale target is ~500 users, growing over time: keep the app stateless and connection-pooled so it can scale horizontally. Hosting provider is deferred (TECH-5) but must be chosen before staging deployment. | TECH-3, TECH-5, TECH-6 |

## Phase 1 addendum (owner answers, 2026-10-14, second round)

| ID | Date | Decision | Source |
|---|---|---|---|
| D-027 | 2026-10-14 | Mock tests cannot be paused. The timer keeps running if the student leaves; they resume until the original server deadline, and expiry auto-submits. One active attempt per test per student; the most recent tab/device takes over. Same rule as level determination (D-010). | MT-4 ("Go with the suggested one") |
| D-028 | 2026-10-14 | Every first-time visitor sees **English**. A navbar toggle switches to Japanese, and the choice is remembered (cookie; account preference once logged in). A missing Japanese translation falls back to English. | PA-5 |
| D-029 | 2026-10-14 | **Showcase-quality client UI** ("the best one, with proper animation, parallax effect, all of the modern designs"). The public site and the student non-exam areas use rich, purposeful motion: scroll-driven reveals, parallax layers, page/section transitions, micro-interactions. Guardrails (PB §6.4): `prefers-reduced-motion` gets a calm version; Core Web Vitals stay in the "good" range on mid-range phones; motion never hides content or delays CTAs; the **exam runner stays calm and low-distraction**. | Owner directive "IMPORTANT" |
| D-030 | 2026-10-14 | **Maximal CMS coverage** ("VERY IMPORTANT: make everything manageable through Admin Panel"). In addition to D-007, the following are admin-manageable in EN/JA: all user-facing UI labels and messages (code defaults with a CMS override layer), page sections and their order, images/parallax layers and an animation preset per section (from a safe list), navigation, footer, SEO metadata, logo/favicon/tagline, contact details and social links, email copy for approved emails, theme colours (with server-side contrast validation). Any hard-coded user-facing content found later is treated as a defect and checked in the release audit. The D-020 boundary (safety invariants, secrets) still applies. | Owner directive "VERY IMPORTANT" |
| D-031 | 2026-10-14 | Tagline stays **"Practice Smart. Pass JLPT."** The logo artwork is unchanged. The site tagline is a CMS-editable EN/JA field; the agent may propose alternatives in Phase 3 for the owner to pick. The owner accepts the messaging risk noted in RISK-06. | DS-1 |
| D-032 | 2026-10-14 | "500" is a rough estimate. Working capacity assumption: design and load-test for **500 concurrent test-takers** (the conservative reading), with horizontal scaling beyond that. | TECH-6b ("Just assuming") |

## Phase 2 — approved stack (2026-10-14)

Owner: "Continue with your suggestions and recommendation" → approves STACK-1 (Option A), STACK-2 (set as proposed) and STACK-3 (Docker packaging). Details and rationale: `docs/TECH_STACK_OPTIONS.md`. Exact versions are pinned in Phase 6.

| ID | Area | Decision |
|---|---|---|
| D-033 | Admin CMS | **Payload CMS embedded in the Next.js app.** Phase 6 decides whether to start on 3.x stable or v4 if it has reached GA (RISK-08). Exam logic (determination, deadlines, finalization, scoring, snapshots, payment state machine) lives in a **framework-independent TypeScript domain module** with its own unit tests. |
| D-034 | Data | PostgreSQL via Payload's Postgres adapter (Drizzle-based) and Payload migrations; Drizzle directly for transactional/locking queries. **No Prisma** (one migration system only). |
| D-035 | Auth | Payload built-in auth with separate `admins` and `students` collections, email verification, reset, lockout; app-level rate limiting; TOTP for admins if OPS-2b requires it; session revocation verified in Phase 7. |
| D-036 | i18n | next-intl with `/en` and `/ja` routes (English default, D-028) + Payload field-level localization + a CMS "UI Labels" override layer over code defaults. |
| D-037 | UI | Tailwind CSS v4 + CSS-variable design tokens (CMS-editable theme colours with contrast validation); own component library on accessible primitives (shadcn/ui pattern over Radix UI or Base UI). |
| D-038 | Motion | GSAP + ScrollTrigger for parallax/scroll storytelling (loaded on marketing routes only) + Motion for React for UI transitions and micro-interactions + CSS for simple states; per-section animation presets from a safe list; full reduced-motion variants. Smooth-scroll library decided in Phase 3. |
| D-039 | Content & forms | Lexical rich text (JSON, safe rendering) with a custom furigana/ruby feature; Zod shared schemas + React Hook Form; Payload form builder for the contact form; Server Components by default, TanStack Query for the test runner and interactive widgets. |
| D-040 | Jobs | Payload Jobs Queue (Postgres-backed) for emails, expired-attempt sweeps, payment reconciliation, scheduled publishing; attempts also finalize lazily on the next request. |
| D-041 | Media | Cloudflare R2 (S3-compatible) via Payload's storage adapter; private files via short-lived signed URLs after a server-side access check. |
| D-042 | Email | Resend via Payload's email adapter; SMTP adapter as a fallback; email copy managed in the CMS. |
| D-043 | Quality | pnpm, TypeScript strict, ESLint + Prettier, Husky pre-commit; Vitest (unit/integration against real Dockerized Postgres), Playwright E2E (desktop + mobile, Chromium + WebKit), axe-core accessibility, a reduced-motion E2E run, k6 load test at 500 concurrent. |
| D-044 | Ops | Sentry error tracking, uptime monitor on the health endpoint, structured logs without secrets; GitHub Actions CI. |
| D-045 | Packaging | Docker image (Next.js standalone + worker process); Docker Compose Postgres for local dev. Hosting provider still deferred (TECH-5), preferring a region near Nepal (Mumbai/Singapore). |

## Phase 3 — design (2026-10-14)

| ID | Decision | Source |
|---|---|---|
| D-046 | Visual direction **B — "Tokyo Transit"**: railway-signage identity; the level check drawn as a route line (N5 → N4 → N3) that recurs in the dashboard and results; layered skyline parallax; per-level line colours. Final tokens in `docs/DESIGN_SYSTEM.md`. The owner will request any UI changes later. | DS-2 ("Go with B") |
| D-047 | Tagline changed to **"Practice Smart. Pass with Confidence."** (EN default; JA translation drafted, CMS-editable). Supersedes the tagline in D-031. RISK-06 is closed. | DS-3 |
| D-048 | Logo variants approved, with no change to the artwork: (1) wordmark converted to outlines; (2) reversed version (white "Nihongo") for dark backgrounds; (3) monochrome small icon; (4) because the tagline changed, lockups carry the new tagline, plus a tagline-free header version. The original files in `nihongo-mock-logo-assets/` stay untouched. Produced in Phase 8 when assets enter the app. | DS-4 ("Yes") |

## Phase 5–6 (2026-10-14)

| ID | Decision | Source |
|---|---|---|
| D-049 | Database design in `docs/DATABASE_ARCHITECTURE.md` **approved**. | DB-1 ("Approved.") |
| D-050 | *(interpretation of "Approved." — owner may amend)* Retention: keep attempts, results, orders, payments and audit records indefinitely until a policy is set. Answer-save grace window: 3 seconds, adjustable 0–10 s in CMS system settings. | DB-2, ARCH-1 |
| D-051 | Foundation versions: **Payload 3.90.2** (latest stable; 4.0 still beta, RISK-08), **Next.js 16.3.8** (newest patch of the mature 16.3 line; 16.4.0 was 8 days old), React 19.2.6 (Payload template pin), **PostgreSQL 17**, Node 24, pnpm 12.8.1. Payload REST at `/api/cms`, GraphQL disabled, schema changes only through migrations (`push: false`). Standalone Next output only for Docker builds (`NEXT_OUTPUT_STANDALONE=1`). | Phase 6 technical choice within D-033..D-045 |

## Phase 7 — authentication and authorization (2026-10-14, technical choices within the approved stack)

| ID | Decision | Source |
|---|---|---|
| D-052 | `APP_ENV` (`local`/`test`/`staging`/`production`) names the deployment. Strict production checks (Resend email, real sender) depend on `APP_ENV=production`, not `NODE_ENV` (every `next build` runs with NODE_ENV=production). | Phase 7 build finding |
| D-053 | Permission catalogue of 28 keys in `src/server/auth/permissions.ts`. Roles are CMS-editable bundles of keys; the Super Admin system role always has every key. Access checks fail closed: unpopulated roles, disabled admins and students get nothing. Admin roles and status can be changed only with `admins.manage`. Admins cannot be deleted (disable instead). The last active Super Admin cannot be disabled or demoted. | D-022 implementation |
| D-054 | Students authenticate only via `/api/v1/auth/*` (rate limits, identical responses for unknown emails, audit). Payload's own student auth and create REST endpoints are blocked in `src/proxy.ts`. Sessions are server-side and revocable: logout ends the current session; password reset and suspension end all sessions. Passwords must be 10–128 characters. | AUTH-R01/R02 implementation |
| D-055 | Session cookies are accepted only with same-origin browser signals (Payload's CSRF rule), **and** `/api/v1` rejects cross-site mutations. Future mobile clients will use `Authorization: JWT <token>`. | AUTH-R02 |
| D-056 | Rate limits are stored in PostgreSQL (`rate_limits`, hashed keys). Per-IP limits apply only when `TRUST_PROXY=true`. Initial limits: login 20/15 min per IP and 10/15 min per account; emails 3/15 min per address; registration 10/hour per IP. Payload lockout: 5 failures → 15 min. To be tuned in Phase 26. | ARCHITECTURE §4 |
| D-057 | Email copy lives in the CMS `email-templates` collection (EN/JA, allow-listed `{{variables}}`, escaped into a fixed branded layout). Code defaults are used if a template is missing. Transport: Resend in staging/production, console in development, memory in tests. | D-030, D-042 |
| D-058 | **Admin two-factor login is required for every admin** (OPS-2b, owner: "Yes, admins enter a code from an authenticator app when logging in"). It uses the `payload-totp` plugin **3.0.6, pinned exactly** after a source review: `forceSetup` on, every collection's access wrapped, the code required each session, wrong codes counted toward the 5-attempt/15-minute lockout, Japanese UI included. The issuer shown in the authenticator app is "Nihongo Mock". Students are not affected. *(interpretation: "admins" = all admin roles; the owner may relax this to Super Admins only)* | OPS-2b |
| D-059 | E2E tests start their own production server on port **3100** (`APP_URL` set accordingly), so they never reuse a developer's `pnpm dev` on 3000. | Phase 7b finding |

## Phase 8 — shared frontend foundation (2026-10-15, technical choices within the approved stack)

| ID | Decision | Source |
|---|---|---|
| D-060 | Frontend libraries (pinned, each ≥ 2 weeks old at install): Tailwind CSS 4.3.3, next-intl 4.14.8, react-hook-form 7.89.0 + @hookform/resolvers 5.9.1, Radix Slot/Dialog/Toast, clsx + tailwind-merge, @axe-core/playwright. Fonts self-hosted through `next/font`: Zen Kaku Gothic New, Barlow Condensed, Noto Sans JP, IBM Plex Mono. The Motion library is deferred until a feature needs it; the fade-up preset is CSS-only, so content is readable without JavaScript. | D-037, D-038 |
| D-061 | Locale routing is done in `src/proxy.ts`, not by next-intl's middleware. Unprefixed paths redirect to the `NEXT_LOCALE` cookie or English (never Accept-Language), and the cookie is refreshed on localized pages. Every layout and page calls `setRequestLocale` before translating. | D-028 |
| D-062 | UI labels are overridable in the CMS through three globals generated from `messages/en.json` (`labels-site`, `labels-accounts`, `labels-messages`). Each must stay under 80 labels because Payload reads a global's localized columns in one PostgreSQL function call (100-argument limit); a unit test enforces it. Overrides are cached for 60 s per instance and cleared on save. | D-030 |
| D-063 | Level line colours N2 → `#8F64DA` and N1 → `#D04A86` (from `#7A4FC8` / `#B0306A`), because the originals were below the 3:1 visibility minimum on the night background. Checked by `tests/unit/contrast.test.ts`. | DESIGN_SYSTEM §3, UX accessibility |
| D-064 | Session cookies are `Secure` whenever `APP_URL` is https, not whenever `NODE_ENV=production` (a local production build on http://localhost would otherwise set cookies Safari refuses). | Phase 8 E2E finding |
| D-065 | Error detection never relies on `instanceof` across bundles: `AppError`/`ZodError` are recognised by name, and Payload login failures are classified by HTTP status (401 = wrong credentials or locked, 403 = unverified or suspended). | Phase 8 E2E finding (production build) |

## Google sign-in (2026-10-15, owner-approved feature)

| ID | Decision | Source |
|---|---|---|
| D-066 | **"Continue with Google" for students** (owner, 2026-10-15: "please add OAuth also"). Students only; admins keep password + authenticator code (D-058). OpenID Connect code flow with PKCE, state and nonce, written without a library; the ID token comes straight from Google's token endpoint over TLS, so its claims are checked (issuer, audience, expiry, nonce, verified email) and its signature is not re-verified (OIDC Core §3.1.3.7). Linking: same Google ID → that student; same email → link (an unconfirmed account is confirmed and its password replaced, against pre-registration takeover); otherwise a new confirmed student with an unusable password ("Forgot password" sets one). Suspended accounts are refused; an email already linked to another Google ID is refused. Sessions are ordinary revocable Payload sessions. Shown only when `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` are set **and** the CMS switch (Settings → Sign-in options) is on; keys never in the CMS (D-020). Other social logins remain out of scope. | Owner request; PB §2.4 |
| D-067 | An empty line in `.env` (e.g. `GOOGLE_CLIENT_ID=`) means "not set". Previously an empty optional value failed startup validation. | Found while adding D-066 |

## Phase 9 — admin CMS framework (2026-10-15, technical choices within the approved stack)

| ID | Decision | Source |
|---|---|---|
| D-068 | **Admin patterns.** Lists, search, sort, filters, pagination, bulk select/edit, confirmations and loading/empty/error/success states come from Payload's own admin views (configured per collection: `defaultColumns`, `listSearchableFields`, `pagination`, `defaultSort`), not rebuilt. Every module adds: a menu group from `ADMIN_GROUPS`; access through `hasPermission()`; `auditTrail()` hooks (records only the changed fields, with old and new values and the content language); validation messages in EN/JA via `say()`; no delete where history depends on the record (switch off instead). Rules that involve other records run as **field validators**, not hooks, so Payload shows each message under its field. | PB §11.10, CMS-R02 |
| D-069 | **Dashboard** uses Payload's widget dashboard (`admin.dashboard`, marked experimental in Payload 3.90.2, version pinned). Widgets: setup checklist (`settings.manage`), students (`students.read`), exam catalogue (`catalogue.manage`), recent activity (`audit.read`). The default layout includes only the widgets the admin may see; each widget re-checks the permission (saved layouts survive role changes). Admins can rearrange them. | PB §11.10, UI_SCREEN_INVENTORY §5 |
| D-070 | **Exam catalogue rules.** Exam type codes are fixed after creation. Exam types and levels are never deleted (no delete access; database foreign keys RESTRICT). The level check and the study library use JLPT levels only. The levels enabled for the level check must be the easiest JLPT level plus an unbroken run above it (N5, N5→N4, …); the easiest one cannot be switched off. One code per exam type. NAT/JFT levels may point to an equivalent JLPT level; JLPT levels may not. Level colours are checked for contrast (badge ≥ 4.5:1 with white text, route line ≥ 3:1 on night). Any active admin can read the catalogue; `catalogue.manage` edits it. The student-facing catalogue API comes with Phase 13. Seed: JLPT N5–N1, NAT 5Q–1Q (→ N5–N1), JFT A1, A2.1, A2.2, A2; level check and study N5–N3; mock tests at every level. | D-008, D-014, D-015, D-020 |
| D-072 | Seed data inside migrations is written in plain SQL, never through the Payload API (which always uses the latest configuration). Values outside a migration's enums are skipped. | KI-26 |
| D-071 | **Payload is loaded once from `node_modules` in production too** (`serverExternalPackages: ['payload']`), as `pnpm dev` already did. Bundled, each route had its own copy of Payload's classes while sharing one Payload instance, so Payload's internal `instanceof` checks failed (KI-23). | Phase 9 finding |

## Phase 10 — student route gates (2026-10-15)

| ID | Decision | Source |
|---|---|---|
| D-073 | **Level gate.** A student "has a level" only when `determinationStatus = completed` **and** `assignedLevel` is set (fails closed). `requireStudentWithLevel()` (`src/server/student/gate.ts`) is the first call of every study, mock-test-attempt and results service; refusals are `403 LEVEL_NOT_DETERMINED` with `details.nextStep = "level_check"`. Pages use one server guard (`studentPage()`): no level → `/app/level-check`; level → the level check is closed and sends them to `/app`. The decision uses only the stored student of the session, re-read on every request (stale tabs follow at once). `/api/v1/me` and the login response include `assignedLevel {id, code}` and `nextStep`. `students.assignedLevel` / `assignedAt` are writable only by services (the database refuses deleting a level a student holds). | LD-R01, LD-R02, PB §11.11, §16.2 |
| D-074 | Until their phases, the gated areas answer with their real current state: no study materials (Phase 12), no mock tests (`POST /api/v1/attempts` → 404, Phase 16), no results (Phase 17); the level-check Start button is disabled until Phase 11 (KI-27). | PB §11.11 |

## Fix: session after arriving from another site (2026-10-15)

| ID | Decision | Source |
|---|---|---|
| D-075 | Pages read the session with `currentStudentForPage()`, which treats a **top-level document navigation** from another site (`Sec-Fetch-Mode: navigate`, `Sec-Fetch-Dest: document`) as same-site, matching what the SameSite=Lax cookie already allows. Embeds, fetches and cross-site form posts (Origin header) are not affected. API routes keep Payload's strict rule. Page renders must never change data. Login and logout end with a full page load (`window.location.assign`) instead of a client-side transition plus refresh. | KI-29 (owner report) |

## Fix: signed-in states (2026-10-15)

| ID | Decision | Source |
|---|---|---|
| D-076 | A signed-in, active student is never offered sign-up or login: the home hero shows "Welcome back" and **Go to my page**; `/login` (respecting a safe `next`) and `/signup` redirect to the student area. The header shows **My page** and **Log out** inline from the `sm` breakpoint; on phones one **Menu** button opens both. Admin lists show checkbox columns as ✓ / – (`YesNoCell`), and Levels are sorted by exam type, then order. Before every report, `pnpm sweep` screenshots every page in every state (signed out, no level, with level, admin; EN/JA; desktop/iPhone) and the screenshots are reviewed. | KI-30 (owner report and feedback) |

## Fix: separate student and admin sessions (2026-10-15)

| ID | Decision | Source |
|---|---|---|
| D-077 | Students use their own session cookie, **`nm_student_session`** (HTTP-only, SameSite=Lax, Secure on https, 7 days); Payload's `payload-token` is for admins only. The server reads the student cookie and passes it to Payload as `Authorization: JWT …` (`studentAuthHeaders`), so an admin cookie never counts as a student session and vice versa; both can be signed in in one browser. The cookie counts only on requests from our own site (matching Origin, or Sec-Fetch-Site same-origin/same-site/none), plus top-level page loads from other sites for pages (KI-29); non-browser clients use the Authorization header (D-025). The proxy removes leftover student tokens from `payload-token`. Sessions stay revocable Payload sessions. Supersedes the "one browser, one session" note in ARCHITECTURE §4. | KI-32 (owner report) |

## Phase 11 — the level check (2026-10-15)

| ID | Decision | Source |
|---|---|---|
| D-078 | Browser tests (E2E and `pnpm sweep`) run on their own database, `nihongo_mock_e2e`, created and migrated automatically by `tests/e2e/prepare-db.ts`; CI keeps its throwaway database. Test accounts, questions and published test level checks never reach the development data. | Phase 11 |
| D-079 | **Questions (core of the bank, built early for the level check):** single-answer multiple choice; stable key `Q-000001` from a database sequence; exam type and level; question text as plain text with optional furigana `{漢字|かんじ}` (rich text and media arrive in Phase 14); 2–6 lettered options; correct letter must exist; EN/JA explanation; marks; "rights confirmed" required to publish (CON-2); drafts with a Publish step (`questions.manage` for drafts, `questions.publish` to publish); never deleted, `archived` instead. Students never read questions directly, only published snapshots. | D-018, D-024, PB §11.12 |
| D-080 | **Level-check settings** are a draft-and-publish global (`level-check-settings`): stages = level, pass mark %, time limit, ordered published questions. Publishing (`determination.publish`) checks the D-008 rules (exactly the enabled JLPT levels in order from N5, each with published, rights-confirmed questions of its level) and freezes everything into an immutable numbered `level-check-versions` row with a checksum; identical content creates no new version. Page text (intro, between stages, summary) is edited as UI labels, not in the settings. | D-008..D-012, D-020, DATABASE_ARCHITECTURE §3.6 |
| D-081 | **Attempts:** server deadline = start + stage time, 3 s grace for saves; answers saved one by one with a sequence number (newer wins) and a tab session ID (latest tab wins, D-027); every request touching an expired attempt submits it first (`timeout`). Submitting locks the attempt and its session in one transaction, scores from the snapshot (unanswered = wrong, exact comparison), writes the result and per-question items, and advances or completes the level check (level assignment history, student level). Repeats and races return the same result. Hot paths are plain SQL. | ARCHITECTURE §5.1–5.2, LD-R08..R13 |
| D-082 | **Screens:** the stage runner is a calm full-screen page without site navigation (one question at a time, timer, question map, mark for review, review dialog, save status, takeover screen); between stages the student sees "Stage passed" and starts the next stage when ready (its timer starts then); after the last stage, "Your level" shows the level and each stage's score with one celebratory animation (off for reduced motion). Admin: reset (`students.reset_determination`) and level change (`students.override_level`) on the student record, each with a written reason, audit event and level-assignment entry. | D-012, D-013, UI_SCREEN_INVENTORY §3 |
| D-083 | `pnpm seed:sample-level-check` creates 15 clearly marked 【サンプル】 questions and publishes a sample level check for local trial; it refuses `APP_ENV=production` and is never part of migrations (D-024: real questions come from the owner). | D-024 |

## Phase 12 — study library and media (2026-10-15)

| ID | Decision | Source |
|---|---|---|
| D-084 | **Study library model:** `material-categories` (stable `key`, symbol, EN/JA name, order, on/off; seeded Kanji & vocabulary 漢, Grammar 文, Reading 読, Listening 聴; new ones added in the CMS) and `study-materials` (EN/JA title and summary, JLPT level limited to levels enabled for study, category, unique address name `slug`, display order, rich-text body with furigana `{漢字|かんじ}`, ordered attachments from the media library, `archived`). Drafts with a Publish step (`materials.manage` for drafts, `materials.publish` to publish); never deleted, archived instead. A published change is live at once (no deployment). | SM-R01..R06, CMS-R06, D-020 |
| D-085 | **Who sees what:** the server lists only published, non-archived materials of enabled categories whose level is enabled for study and at or below the student's level (pure rule `studyLevelIds`, `src/domain/study.ts`). Anything else — draft, archived, higher level, unknown — answers 404 alike; level/category filters only narrow that set. | SM-R01..R03, D-015 |
| D-086 | **Media rules:** `learning-media` accepts JPEG/PNG/WebP images up to 5 MB, MP3/M4A/WAV/OGG audio up to 30 MB and PDFs up to 20 MB; the file content must match its type (checked from the bytes); SVG and other types are refused; images need alt text. `media.manage` to upload; never deleted. | SM-R05, SM-R06, PB §4.4 |
| D-087 | **Private files through signed links:** students never get a storage address. Each attachment URL is `/api/v1/media/{id}?exp&sig`, an HMAC (from `PAYLOAD_SECRET`) bound to the file, the student and a 2-hour expiry; the route also re-checks the session, the level gate and that the file belongs to a material the student may open now (archiving closes it at once). Byte ranges (206) are supported for audio seeking. | D-041, SM-R05 |
| D-088 | **Storage until R2 exists:** files are stored on local disk (`LEARNING_MEDIA_DIR`, default `./media/learning`, git-ignored) behind `src/server/media/storage.ts`; tests use their own folders. The Cloudflare R2 adapter (D-041) is built and verified as soon as the owner provides the R2 keys — before any production deployment (KI-37). | D-041 |

## Reference review (2026-10-16)

| ID | Decision | Source |
|---|---|---|
| D-089 | **Owner instruction:** content access is managed in the CMS as Free, Premium or Premium with a free preview, enforced on the server for every protected file and item (ACC-R01..R04). This amends D-019's "study materials are free" to "study materials are free by default and can be made premium". How premium is bought (products, plans) and what a preview contains are open (RV-1, RV-2); nothing premium is built before those answers and the entitlement model (Phase 19). | Owner 2026-10-16 |
| D-090 | **Owner instruction:** the student home becomes a real-data dashboard (REC-04 → STU-R01) and the admin gets real-data reports with filters and CSV export (REC-10 → ADM-R01). | Owner 2026-10-16 |
| D-091 | **Owner instruction:** content that cannot be deleted is a defect (LC-R01..R04). The earlier blanket "never deleted" for study materials, categories and learning media (D-084, D-086) is under review; the per-module policy is RV-7. Records that history depends on (results, attempts, orders, payments, audit, published question versions) stay archive-only. | Owner 2026-10-16 |

## Owner answers RV-1..RV-14 (2026-10-16)

| ID | Decision | Source |
|---|---|---|
| D-092 | **Deletion policy.** Permanently deletable (confirmed, audited): unused learning media and their stored files, study materials, empty study categories, question drafts never published and not in any snapshot. Blocked while referenced, with an exact "used by …" list. Archive/deactivate only: published questions, exam configuration, levels, level-check versions, attempts, results, orders, payments, audit events, student and admin accounts. Completed payments and audit events are never deleted through the CMS. A stored file is removed only after checking nothing else uses it. Account erasure for privacy requests is a separate, controlled process (later; not an ordinary delete). New permission keys `materials.delete`, `media.delete`, `questions.delete`: *(interpretation of "least privilege")* granted to Super Admin only by default; a Super Admin can add them to other roles in the CMS. | RV-7 |
| D-093 | **Access classes per item, admin-controlled:** Free · Premium · Premium with free preview. Preview = title, summary, the part of the text the editor marks and the attachments ticked as preview (a separate short preview file may be uploaded). Built with entitlements in Phase 19; level gating still applies. | RV-1 |
| D-094 | **Products at launch:** single test and fixed bundle, each with a validity period; no recurring subscriptions; rule-based "all content" plans deferred. Products are fully CMS-managed (create, price, validity, contents, publish), and the product model keeps a `kind` so new kinds can be added later without restructuring. *(interpretation)* A bundle's contents may include premium study materials as well as tests, so premium materials can be bought (D-093). | RV-2 |
| D-095 | **Coupons** (percentage and fixed amount, with the RV-3 rules), **refunds** (RV-4 workflow: request → approve/reject → money returned through the provider portal → provider reference recorded → access revoked; never claimed without the reference) and **sale prices with a window** (RV-5) are in scope. Receipt and VAT details (VAT registered, rate, business name, PAN/VAT number, address, receipt numbering) are managed in the CMS (PAY-4b). Supersedes D-019's "no coupons or refunds". | RV-3, RV-4, RV-5, PAY-4b |
| D-096 | **Communication:** notices/announcements (EN/JA, attached PDFs, pin, publish window, expiry) in Phase 24; home banners/CTAs in Phase 18 page blocks; Help/FAQ, About, Privacy, Terms, Refund policy, Contact in Phase 18; no email campaigns at launch; all in Payload. | RV-6 |
| D-097 | **Downloads and watermark:** no download option by default for any file, free or premium; a per-attachment "Allow download" switch in the CMS turns it on. Without it, PDFs open in an in-app viewer (no file link shown, browser viewer toolbar not used), audio players hide their download menu, and files are served `inline`. Premium files carry a watermark with the student's email (Phase 19). None of this stops screenshots or a determined user. | RV-8, RV-9 |
| D-098 | **Layout and admin look:** signed-in student area uses a left sidebar on desktop and a bottom tab bar on phones (agent's choice, as asked); exam screens unchanged. The admin stays Payload, themed to Tokyo Transit (light and dark) with regrouped menus and custom views added module by module — no separate admin. | RV-10, RV-11 |
| D-099 | **Approved for later phases:** study progress ("mark as studied", continue where you left off) — Phase 24; staff invitations by email and session lists with "sign out everywhere" — Phase 24; Nepal time everywhere with BS next to AD in reports and CSV; translation review by the owner and nominated reviewers, with a CMS permission for who may mark Japanese text as verified (Phase 18). | RV-12, RV-13, RV-14, PA-6 |

## Phase 12b — content lifecycle (2026-10-16)

| ID | Decision | Source |
|---|---|---|
| D-100 | **How D-092 is enforced:** `src/payload/hooks/contentLifecycle.ts`. `guardLiveChanges(permission)` (beforeOperation) refuses, without the publish permission, any non-draft save of an item that is published now (unpublish, archive, direct edit); draft saves stay open to editors. Delete guards (beforeDelete) check live documents **and** latest drafts and answer 409 with the users' titles; they run for the local API too. Payload removes the stored file and the material's versions on delete; audit events record every deletion. Learning media get `archived` (hidden from the picker unless the saved material already uses the file) and a "Used by" sidebar panel. | D-092, LC-R01..R04 |
| D-101 | **In-app PDF viewer (D-097):** PDFs are drawn with pdf.js (`pdfjs-dist` 6.3.289, pinned) onto canvases inside the page — no browser viewer toolbar, so no download/print button — on desktop and phones alike (replaces the desktop-only iframe; phones now see every page). Each page's text is kept in a visually hidden block for screen readers, read with a plain stream reader because Safari cannot iterate streams. Open/download links and the audio download item appear only when the attachment allows downloads; images and players without it block the context menu and dragging. All files are served `inline`. | D-097, SM-R08 |
| D-102 | Study search (SM-R07): `q` matches title, summary and address name in the student's language, only within what the student may already see. | SM-R07 |

## Phase 13 — examination configuration (2026-10-16)

| ID | Decision | Source |
|---|---|---|
| D-103 | **Exam sections** are their own collection (`exam-sections`: exam type, key unique per exam and fixed after creation, EN/JA name and description, order, optional list of levels it applies to — empty = every level —, enabled), not an array on the exam type: questions (Phase 14), tests (Phase 15) and results can then point at a stable record. Seeded from the official guides — JLPT N3–N5: Language Knowledge (Vocabulary) / Language Knowledge (Grammar)・Reading / Listening; N1–N2: Language Knowledge (Vocabulary/Grammar)・Reading / Listening (jlpt.jp); JFT-Basic: Script and Vocabulary / Conversation and Expression / Listening Comprehension / Reading Comprehension (Japan Foundation); NAT-TEST: 文字・語彙 / 文法・読解 / 聴解 for every level (mirrors JLPT; 1Q/2Q to be confirmed, EX-1). All editable in the CMS; never deleted (switch off). The exam type page lists its sections. | D-018, MT-R09, playbook §11.14 |
| D-104 | **Integrity rules:** a section can only be limited to levels of its own exam; an exam type cannot be switched off while any of its levels is used by the level check or the study library (in practice JLPT) — switch those levels off first; exam types, levels and sections are never deleted. Records that hold history or live content (level assignments, level-check sessions, questions, study materials, level-check stages, students) refer to the catalogue with ON DELETE RESTRICT; results keep their own copies of exam/level codes and section names. | §11.14 |
| D-105 | **Public catalogue:** `GET /api/v1/catalogue/exams` (no sign-in) and the student Mock tests page show enabled exam types in order, their levels switched on for mock tests and each level's enabled sections, from the CMS. Levels with the same sections are grouped (e.g. JLPT N5·N4·N3 and N2·N1). | MT-R02, §11.14 |
| D-106 | **Student shell first (owner asked when the new student UI arrives):** Phase 13b builds the D-098 layout now — desktop sidebar, phone bottom tab bar, profile page, dashboard layout with real data only and honest empty states — before Phase 14, instead of "before Phase 16". | Owner 2026-10-16, D-098, STU-R01 |

## Phase 13b — student shell and dashboard (2026-10-16)

| ID | Decision | Source |
|---|---|---|
| D-107 | **Study progress brought forward from Phase 24** (RV-12 was approved; the dashboard needs it): `study-progress` rows per student and material — first/last opened (recorded when the material page opens) and `studiedAt` (only the "Mark as studied" button; undo allowed; pressing again keeps the first time). No time-on-page is measured. Progress = studied ÷ materials the student may see now (published, not archived, their level and below, enabled categories), rounded down; archived/hidden materials stop counting. Continue = most recently opened, not yet studied. Recommendations = up to 3 unstudied: own level first, then lower levels, category order, then display order. Pure rules in `src/domain/study-progress.ts`; rows cascade when a material is deleted. Read-only in the admin (Study library → Study progress, `students.read`). | RV-12, D-099, owner 2026-10-16 |
| D-108 | **Dashboard content (STU-R01):** welcome with level and how it was set, one primary next step (continue / start / library) plus mock tests; three real figures (materials studied x / y, last studied date, level-check stages passed); progress by category with the calculation explained and "not an exam result" note; study next (continue + recommendations); exams you will be able to practise (catalogue); recent results. Empty states everywhere; no sample data; no exam-readiness claims. Notices join when that module exists (D-096); score trends and weak areas when mock-test results exist (Phase 17). | STU-R01, owner 2026-10-16 |
| D-109 | **Shell and pages:** sidebar (level badge on top, Home, Study, Mock tests, Results, Profile) on screens ≥1024 px, sticky bottom tab bar below; exam screens unchanged. Profile (read-only account details, sign-in methods as yes/no, how the level was set and its history without staff notes, "Change password" via the reset email). Results page now lists the student's real results (level-check stages) instead of the placeholder; answer review stays in Phase 17. Dashboard and profile wording live in their own label namespaces (`dashboard`, `profile` → CMS global "UI labels: home & profile") to keep each label global under the database limit. | D-098, D-106 |

## Dashboard extras and layout fix (2026-10-16)

| ID | Decision | Source |
|---|---|---|
| D-110 | **Approved dashboard extras (Phase 13c):** study days and current/longest streak exactly as DASH-1 defines them; a 7-day activity chart of study actions (DASH-2); a daily goal counted in materials, chosen by the student (DASH-3 default — no minute tracking); milestones computed from existing records, no points (DASH-4, built now rather than Phase 24); **no leaderboard at launch** (DASH-5 default). | DASH-1..DASH-5 |
| D-111 | **Study calendar (owner request):** a month calendar on the dashboard showing study days and the student's own study plans (a short note on a date, add/tick/remove), today and the streak; plans are private to the student. | Owner 2026-10-16 |
| D-112 | **Student shell height (fix):** `main` becomes a flex column when it holds the student shell (`has-[>[data-student-shell]]`), the shell grows to fill it, and the shell shows the footer in its content column (the full-width footer is hidden there). The sidebar column therefore always runs from the header to the bottom of the page — the bottom of the screen on short pages. Public pages keep normal flow. | Owner 2026-10-16 (bug) |

## Rejected / parked alternatives

| Alternative | Status | Reason |
|---|---|---|
| A. MERN (MongoDB) | Rejected 2026-10-14 | Owner chose Option C. Relational integrity suits attempts/results/orders/payments. |
| B. PERN (separate React SPA + Express) | Rejected 2026-10-14 | Owner chose Option C. Extra deployment boundary not needed. |
| D. Next.js + separate API | Parked | Revisit only if a mobile/third-party client becomes a concrete requirement (TECH-4). |
| E. Next.js + MongoDB | Rejected 2026-10-14 | Owner chose PostgreSQL. |
| Custom-built admin panel | Rejected 2026-10-14 | Payload approved (D-033); custom admin would rebuild localization, versions, media and permissions. |
| Separate headless CMS (Strapi/Directus/Sanity) | Rejected 2026-10-14 | Second service; contradicts D-025. |
| Prisma | Rejected 2026-10-14 | Would create a second migration system beside Payload. |
| Better Auth / Auth.js | Parked | Revisit only if Payload auth fails AUTH-R02 checks in Phase 7. |
| Directions A (Ink & Sun) and C (Washi Layers) | Rejected 2026-10-14 | Owner chose B (D-046). |
| Vercel serverless hosting | Parked | Weaker fit for the background worker and static-IP payment callbacks; hosting still open (TECH-5). |
