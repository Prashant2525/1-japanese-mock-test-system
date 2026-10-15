# UI Screen Inventory

Every screen the approved scope needs, its states and data source. **All user-facing text, images and section content come from the CMS (D-030)**, in EN/JA (D-004, D-028). "Payload" means a standard Payload admin screen; "custom view" means a custom React screen inside the Payload admin.

Last updated: 2026-10-14 (Phase 3 — proposal).

**States every screen must define (PB §6.5):** loading (skeleton), empty, validation error, server error with retry, success, disabled, unauthenticated → login, unauthorized (403 page), expired session → re-login keeping the return path, offline/retry where relevant.

---

## 1. Public website (showcase motion allowed — D-029)

| Screen | Route (EN; JA under `/ja`) | Content / data | Notes |
|---|---|---|---|
| Home | `/en` | CMS page built from blocks: hero (parallax layers), exam types, how level check works, featured tests, FAQ teaser, CTA | Signature motion moment of the site |
| Exam overview ×3 | `/en/exams/jlpt` · `/nat` · `/jft` | Exam type record + CMS blocks; levels list (enabled only) | Non-affiliation notice (PUB-R03) |
| Mock-test catalogue | `/en/mock-tests` | Published tests; filters: exam type, level, free/paid; search; pagination | Empty state when no tests match |
| Test detail | `/en/mock-tests/[slug]` | Exam, level, sections, question count, duration, price/free, validity, CTA | Price always from the server |
| Bundle detail | `/en/bundles/[slug]` | Included tests, price, validity | |
| Pricing | `/en/pricing` | Products/bundles from the CMS | |
| About · FAQ · Contact | `/en/about` · `/faq` · `/contact` | CMS pages; contact = CMS-managed form (D-023) | Contact: success, rate-limited and error states |
| Legal ×3 | `/en/privacy` · `/terms` · `/refund-policy` | CMS pages; DRAFT banner visible only to admins until signed off | Release gate (PUB-R02) |
| Any CMS page | `/en/[slug]` | Page-builder blocks | New pages without deployment |
| 404 · 500 · Maintenance | — | CMS-managed copy with code fallback | |

## 2. Authentication

| Screen | Notes |
|---|---|
| Sign up | Email, password, name, language preference; non-enumerating errors |
| Check your email | Resend verification (rate-limited) |
| Email verified / link expired | Expired → resend |
| Log in | Lockout message after repeated failures |
| Forgot password → Reset password | Generic responses; single-use expiring token |

## 3. Student area (rich motion, except the runner)

| Screen | Data | Gate / notes |
|---|---|---|
| Level check intro | Rules, number of stages (enabled levels), time per stage | Shown on first login until determination completes (LD-R01). **Implemented Phase 10** (stages from the CMS; Start enabled in Phase 11) |
| Stage runner (N5 → N4 → N3) *(implemented Phase 11)* | Same runner component as mock tests, in determination mode | **Calm screen** (UX-R04); server deadline; auto-submit |
| Stage complete (between stages) *(implemented Phase 11)* | "Stage complete — next stage" | Copy from CMS; never offers a skip |
| "Your level" summary *(implemented Phase 11)* | Assigned level, per-stage scores | D-012; one celebratory animation is allowed here |
| Student home | Assigned level, continue links to materials/tests, latest result | Minimal required landing (**implemented Phase 10**: level badge in CMS colour, links, account); latest result after Phase 17; richer widgets = REC-04 (pending) |
| Study library *(implemented Phase 12)* | Levels (current and lower), categories, published materials | SM-R03 server-enforced. Level and category filter chips (links, work without JS), cards with category symbol, level badge, title, summary and file counts; states: empty library, nothing for this filter |
| Material detail *(implemented Phase 12)* | Rich text with furigana, images, audio player, PDF viewer/download | Private media via signed URL. PDF: open/download links; inline frame on tablet/desktop only (phones show just the first page in frames). Unavailable → 404 |
| Mock-test catalogue (student) *(Phase 13: exam catalogue — exams, level groups and their sections as a route line; tests from Phase 15)* | Published tests at any enabled level, with entitlement status (Free / Owned until … / Buy) | D-015 |
| Test intro | Instructions, sections, duration, attempts used/limit | "Start" creates the attempt server-side |
| Mock-test runner | One question at a time, progress, timer, mark for review, question palette, previous/next | **Calm screen**; autosave with retry and offline indicator |
| Review-before-submit | Answered / unanswered / flagged counts, jump to a question | |
| Submit confirmation | Dialog | |
| Time up | "Time is up — your answers were submitted" | Auto-submit at the server deadline |
| Session moved | "This test continues in another tab or device" | D-027 latest tab wins |
| Result summary | Totals, marks, %, pass/fail, section results | |
| Answer review | Question, your answer, correct answer, explanation; filter: all / incorrect / flagged | From the stored snapshot (RS-R06) |
| Results history | Mock tests + determination attempts; filters | |
| Purchases | Orders, status, receipts | |
| Account | Language preference, change password, log out | Profile editing and account deletion = REC-05 (pending) |

## 4. Checkout

| Screen | Notes |
|---|---|
| Order review | Server-priced line items, validity |
| Choose payment method | eSewa / Khalti / connectIPS (enabled and ordered in the CMS) |
| Redirecting to provider | |
| Payment status: verified success / pending / failed / cancelled | A return URL is never proof; the page polls the server's verified state |

## 5. Admin CMS (Payload admin, branded)

| Area | Screens | Type |
|---|---|---|
| Access | Login (+ MFA if OPS-2b), forgot password | Payload |
| Home | Admin home with shortcuts and pending items | Payload widget dashboard: setup checklist, students, exam catalogue, recent activity (**implemented Phase 9**); analytics = REC-10 (pending) |
| People | Students (status, level, determination history, reset, override), Admins, Roles & permissions | Payload + custom actions |
| Catalogue | Exam types, Levels (enabled flag, N-level mapping), Sections | Payload (**exam types and levels implemented Phase 9**; sections Phase 13) |
| Level determination | Stage configuration (order fixed N5-first, threshold, duration, question set, versions), summary copy | **Custom view** with invariant validation |
| Question bank | Questions (bilingual explanations, furigana, media, marks, versions), preview | Payload + custom preview |
| Import | Upload → validation preview → commit (all-or-nothing) → summary | **Custom view** |
| Mock tests | Test builder (sections, questions, marks, pass mark, section minimums, shuffle, duration, attempt limit, free flag, availability), live preview with the real runner | **Custom view** |
| Results | Attempts and results (read-only), filters, export if approved | Payload (read-only) |
| Study library | Categories, Materials | Payload |
| Media | Library: images, audio, PDFs | Payload uploads |
| Site content | Pages (blocks with animation presets and parallax layers), Navigation, Footer, Site settings (logo, favicon, tagline, contact, social), UI Labels, Theme (colours with contrast validation), SEO defaults, Email templates | Payload collections/globals |
| Commerce | Products, Bundles, Payment methods (enable/order/labels), Orders, Transactions | Payload |
| Support | Contact submissions | Payload |
| Operations | Audit log (read-only), Jobs status, Settings | Payload |

## 6. Email templates (CMS-managed copy)

Verify email · Reset password · Contact form notification · Order receipt (after Phase 19).

## 7. Reference review (2026-10-16)

The owner supplied 24 screenshots of another product in `Reference Design/` (git-ignored, local only) plus a 24-page PDF containing the same 24 images (the PDF could not be rendered here; the PNGs were inspected one by one). They guide **structure and workflow**, not exact design; the product, its rules and its brand stay ours. Decisions and requirements arising from them are in `OPEN_QUESTIONS.md` (RV-1..RV-14) and `REQUIREMENTS_REGISTER.md` §10a.

### 7.1 Files inspected and what they map to

| Reference file | Shows | Our equivalent | Status |
|---|---|---|---|
| Student - Overview Section | Greeting + level, stats (tests, average, best), recommended materials and tests, recent results | Student home (`/app`) | PARTIAL — level, links and account exist (Phase 10); recommendations and stats need Phases 15–17 data (REC-04) |
| Student - Study Materials Section | Catalogue with search, category tabs, cards with progress | Study library (`/app/study`) | PARTIAL — level/category filters and cards done (Phase 12); **search missing**; progress tracking not approved (RV-12) |
| Student - Mock Test Section | Exam-type cards, filters (exam, level, section, difficulty, status), test cards | Mock-test catalogue (`/app/mock-tests`) | PLANNED — Phases 15–16 (placeholder page today) |
| Student - Results Section | Summary band, results table (test, level, score, outcome, date) | Results (`/app/results`) | PARTIAL — level-check results listed (Phase 11); mock-test results and answer review Phase 17 |
| Student - Profile Section | Account details, assigned level (system-controlled), activity, password reset | — (header "My page" only) | MISSING — REC-05 (proposed, needs approval) |
| Admin - Side Panel | Dashboard with student stats, 2FA status, quick links; full sidebar | Payload dashboard widgets (Phase 9) + menu groups | PARTIAL — widgets exist; menu to be regrouped (RV-11) |
| Admin - Report Section | Period picker, Sales/Students/Learning/Tests tabs, charts, CSV export | — | PLANNED in parts (REC-10 proposed; sales after Phase 19) |
| Admin - Plans Section (+ new plan, plan detail) | Plans list; bilingual name/description/features, covers, slug, order, highlight, price + sale price + sale window, validity days, publishing | Products/bundles (Phase 19, CMS-R13) | PLANNED — "plans that cover all content incl. new" is new (RV-2); sale prices new (RV-5) |
| Admin - Coupons Section (+ new coupon) | Codes, % or fixed, max discount, applies-to, window, total/per-student limits, minimum price, sale-price toggle, switch off | — | EXCLUDED by D-019 unless approved (RV-3) |
| Admin - Orders Section (+ order detail) | Order list with search/status/"needs attention"; detail with items, each payment attempt, gateway reference, "check with gateway", access given | Orders/transactions (Phases 19–23) | PLANNED — the detail layout is a good model for Phase 20 |
| Admin - Refund Section | Refund requests: approve/reject, record money-back reference | — | EXCLUDED by D-019 unless approved (RV-4) |
| Admin - Notice Section (+ new notice) | Notices: kind, bilingual title/text, attached PDFs, expiry, pin, push/email | — | MISSING — REC-09 (proposed); push excluded |
| Admin - Student Section (+ student detail) | Search/status filter; detail: account, signed-in devices, sign out everywhere, suspend, granted access | Students (Payload) + level actions (Phase 11) | PARTIAL — search, status, suspend, level history exist; **sessions list / sign out everywhere button** missing; access panel after Phase 19 |
| Admin - Staff Section (+ invite) | Staff list with role, 2FA state, last sign-in; invite by email (they set their own password) | Admins (Payload) + required 2FA (D-058) | PARTIAL — no email invitation (RV-13) |
| Admin - Roles & Permissions Section (+ new role) | Roles as cards; grouped permission checkboxes; cannot grant what you do not hold | Roles + 28 permission keys (D-053) | IMPLEMENTED — grouped/"cannot grant what you lack" presentation could be improved |
| Admin - System Settings | ~30 setting cards (devices, verification, 2FA scope, purchase channels, question types, app versions, assessment defaults, exam timing, reminders, emails, leaderboards, reviews, challenges, payment methods, VAT, receipts, referrals, mistake notebook, analytics, offline, planner, certificates, maintenance) | Settings globals (sign-in, level check, UI labels) | PARTIAL — only items matching approved features apply (see 7.3) |

### 7.2 Design improvements (keep Direction B "Tokyo Transit", D-050)

- **Signed-in student area:** a left sidebar on desktop (≥1024 px) with the level badge at its foot, and a bottom tab bar on phones, instead of the current top tabs (RV-10). Pages open with an eyebrow label + large heading + one-line purpose, as in the references, but in our type scale and with Japanese-friendly line height.
- **Home:** hero greeting with the station-badge level, then "Continue studying", "Recommended tests", "Recent results" — each from real data; empty states when there is none (no sample data in production).
- **Cards:** keep our signal-red top rule and station badges; add duration/file counts and free/premium/preview labels once approved (RV-1).
- **Tables (results, admin lists):** status pills with text, not colour alone; row links with a visible focus ring.
- **Admin:** keep Payload, but theme it to Tokyo Transit (light and dark), regroup the menu (Overview · Exams & content · Sales · Communication · People · Configuration · Security), and add custom views where Payload's default is weak: dashboard, reports, order detail, student detail (RV-11). A second, fully custom admin is not recommended (duplicates tested CRUD, versions and access control).
- **Exam screens stay calm** (UX-R04): no sidebar, no promotions, no animation beyond progress.

### 7.3 Reference items that do not apply (omitted)

Courses/subjects/papers/category types (our model is exam type → level → section, and study categories), live classes, instructors, certificates, course reviews, discussions, question reports, subjective grading, referrals, "interested on iPhone", app versions and store links, purchase channels, device limit, SMS verification, push notifications, leaderboards, daily challenge, mistake notebook, offline lessons, study planner, question types beyond single choice. All are outside the approved scope (Appendix A rule 14, D-018, D-019); any of them can be proposed later.
