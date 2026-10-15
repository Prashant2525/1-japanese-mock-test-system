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
| Level check intro | Rules, number of stages (enabled levels), time per stage | Shown on first login until determination completes (LD-R01) |
| Stage runner (N5 → N4 → N3) | Same runner component as mock tests, in determination mode | **Calm screen** (UX-R04); server deadline; auto-submit |
| Stage complete (between stages) | "Stage complete — next stage" | Copy from CMS; never offers a skip |
| "Your level" summary | Assigned level, per-stage scores | D-012; one celebratory animation is allowed here |
| Student home | Assigned level, continue links to materials/tests, latest result | Minimal required landing; richer dashboard widgets = REC-04 (pending) |
| Study library | Levels (current and lower), categories, published materials | SM-R03 server-enforced |
| Material detail | Rich text with furigana, images, audio player, PDF viewer/download | Private media via signed URL |
| Mock-test catalogue (student) | Published tests at any enabled level, with entitlement status (Free / Owned until … / Buy) | D-015 |
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
