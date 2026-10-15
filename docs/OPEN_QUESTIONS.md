# Open Questions — Owner Decisions Register

Owner decisions that block or shape later phases. Answer by ID (e.g. "MT-4: accept default").

**Priority key:** **P1** blocks the next phase · **P2** needed by Phases 3–5 · **P3** needed later (phase named).
"Suggested default" values are **PROPOSED - APPROVAL REQUIRED** until accepted.

Last updated: 2026-10-16 (reference review, RV-1..RV-14).

---

## Still open

| ID | Pri | Question | Needed by | Suggested default | Owner response |
|---|---|---|---|---|---|
| RV-7 | **P1** | **Deletion policy** (owner: content "cannot be deleted" is a defect). What may be permanently deleted, and what stays archive-only? | Phase 12b (next) | **Delete (with confirmation, audited, stored file removed too):** learning media that nothing uses (no material, draft, version or question); study materials (no history depends on them); study categories with no materials; question drafts never published and never in a snapshot. **Blocked with a "used by …" list:** media still attached somewhere, categories still in use. **Archive/disable only (history depends on them):** published questions, exam types, levels, level-check versions, attempts, results, orders, payments, audit events, admins, students (student self-deletion = REC-05). New permission keys `materials.delete`, `media.delete`, `questions.delete` (Super Admin + Content Editor by default). Media also gets an `archived` flag (hide from pickers, keep for existing materials). | |
| RV-1 | P2 | **Free / premium / preview for study materials.** D-019 says study materials are free. Should each material (and each attachment) be Free, Premium, or Premium with a free preview? | Before Phase 19 | Per material: Free · Premium · Premium + preview. Preview = title, summary, the first part of the text the editor marks, and attachments the editor ticks as "preview" (a separate shorter preview PDF/audio can be uploaded; the app does not cut files). Premium opens with an entitlement from a product (Phase 19). Level gating (D-015) still applies on top. | |
| RV-2 | P2 | **What do students buy?** D-019: single tests and fixed bundles with a validity period, no recurring subscriptions. The reference sells "plans" that cover all courses including new ones. | Phase 19 | Three one-time-payment product kinds with a validity in days: single test · bundle (fixed list) · access plan (a rule such as "all JLPT N4 tests and premium N4 materials, including ones added later"). No auto-renewal; buying again extends from the current end. | |
| RV-3 | P2 | **Coupons at launch?** (D-019 says no.) | Phase 19 | If yes: % or fixed amount, largest discount, applies to all/selected products, start/end (Nepal time), total and per-student limits, minimum price, "works on sale prices" toggle, switch off (never deleted); the server computes the discount and the order keeps it. | |
| RV-4 | P2 | **Refunds?** (D-019 says no.) | Phase 20 | If yes: staff record a request on the order → someone with `refunds.approve` approves/rejects with a reason → the money is sent back through the eSewa/Khalti/connectIPS merchant portal → staff record the provider's reference; only then is the refund marked done and access revoked. The app never claims a refund without that reference. Needs a refund policy text (legal page). | |
| RV-5 | P3 | **Sale prices** with a start/end window on products (reference plan screen)? | Phase 19 | Allowed: optional sale price + window; orders keep the price they were created with. | |
| RV-6 | P2 | **Communication modules:** (a) Notices/announcements (REC-09: kind, EN/JA title and text, attached PDFs, pin, publish window/expiry, shown on student home and a Notices page); (b) home-page banners/CTAs; (c) email campaigns to groups of students; (d) Help/FAQ, About, Privacy, Terms, Refund, Contact pages. | Phase 18 / 24 | (a) yes, Phase 24 (in-app only; push stays excluded); (b) yes, part of Phase 18 page blocks; (c) not at launch; (d) already approved (PUB-R01, Phase 18). | |
| RV-8 | P3 | **Watermark** premium files with the student's email? | Before Phase 19 | Yes for premium only: a faint on-page overlay over images and the in-app viewer, and a stamped copy for premium PDF downloads. It deters sharing; it cannot stop screenshots or photos. | |
| RV-9 | P3 | **Premium PDF downloads:** allow "Download", or view-in-browser only? | Before Phase 19 | Free: open + download. Premium: open in browser only (no download button), watermarked. A determined user can still save what the browser shows. | |
| RV-10 | P3 | **Student area layout:** left sidebar on desktop + bottom tab bar on phones (like the reference), replacing today's top tabs? | Before Phase 16 | Yes, in Tokyo Transit style; exam screens unchanged (calm, no navigation). | |
| RV-11 | P3 | **Admin look and menu:** theme Payload's admin to Tokyo Transit (light + dark), regroup the menu like the reference, and add custom views (dashboard, reports, order detail, student detail) — rather than building a separate admin. | Phase 13 onwards | Yes, step by step as each module is built. | |
| RV-12 | P3 | **Study progress:** track "studied" per material (reference shows % progress, "continue learning")? | Phase 24 | Optional: a "Mark as studied" button and "continue where you left off" on home. Not at launch unless approved. | |
| RV-13 | P3 | **Staff invitations by email** (they set their own password; you never see it), plus a sessions list with "Sign out everywhere" for students and staff? | Phase 24 (needs the email domain, DOM-1) | Yes. | |
| RV-14 | P3 | **Dates in the admin:** show Bikram Sambat (BS) dates next to AD, as in the reference reports? Reports by Nepal-time day? | REC-10 reports | Nepal time (Asia/Kathmandu) everywhere; BS shown next to AD in reports and CSV. | |
| PA-6 | P3 | Who reviews the Japanese translations of UI text and the drafted page/legal copy before launch? | Phase 18 | Owner or a nominated Japanese speaker; drafts stay marked DRAFT until reviewed. | |
| PAY-3b | P3 | Merchant onboarding status: which registered business (name/PAN) will own the eSewa, Khalti and connectIPS merchant accounts, and has onboarding started? | Phase 20 | Owner starts onboarding now (D-019). | |
| PAY-4b | P3 | Is a VAT/tax invoice required on receipts, and what details must a receipt show (business name, PAN/VAT no., address)? | Phase 19 | — | |
| CON-1b | P3 | Please share a sample of existing question content (any format), if any exists, to shape the import template. | Phase 14 | — | |
| DOM-1 | P3 | Domain name: the owner will buy it later (2026-10-15). It is needed for the Resend sender domain, `APP_URL` and hosting. The guide is in `.env` / `.env.example` ("WHEN YOU BUY YOUR DOMAIN"). | Before staging | — | Owner: "For now I haven't bought domain … when I buy domain I will add required keys." |
| TECH-5 | P3 | Hosting provider and monthly budget ("I will decide it later"). Phase 2 will propose host-agnostic options. | Before first staging deployment (Phase 6/27) | — | |

---

## Closed — answered 2026-10-14

Owner responses are recorded verbatim; the resulting decision is in `docs/DECISIONS.md`.

### A. Product, audience and language
- **PA-1** (market/currency) — "accept defaults" → **D-003**
- **PA-2** (UI languages) — "English + Japanese (With toggle at navbar)" → **D-004**
- **PA-3** (brand) — "Brand Name: Nihongo Mock, brand logo/assets is in the folder `D:\Japanese Mock Test System\nihongo-mock-logo-assets`" → **D-005**
- **PA-4** (public pages, legal text) — "Add the information by yourself now and make sure i can manage it from CMS so that if any change is require i will make it through CMS" → **D-006**

### B. Level determination
- **LD-1** (stage range) — "The level determination sequence must cover N5 → N4 → N3 only for the initial launch, because the currently available study materials stop at N3. The assessment must always begin at N5 and follow the established level determination rules. Do not assign or recommend N2 or N1 through this sequence until the required assessment content and learning materials are available. However, design the system so that N2 and N1 can be added later through the Admin CMS without requiring major code changes. Keep the determination logic configurable where practical, and do not display unavailable levels as supported features." → **D-008**
- **LD-2** (thresholds), **LD-3** (scoring/rounding) — "accept defaults and make it entirely managable from CMS" → **D-009**, **D-020**
- **LD-4** (timing), **LD-7** (interruption) — "accept defaults and make it entirely managable from CMS" → **D-010**
- **LD-5** (post-determination screen) — "accept defaults and make it entirely managable from CMS" → **D-012**
- **LD-6** (reassessment), **LD-9** (override) — "accept defaults and make it entirely managable from CMS" → **D-013**
- **LD-8** (fixed vs random sets) — "accept defaults and make it entirely managable from CMS" → **D-011**

### C. Examinations and mock tests
- **MT-1** (catalogue) — "accept defaults and make it entirely managable from CMS" → **D-014**
- **MT-2** (eligibility) — "accept defaults and make it entirely managable from CMS" → **D-015**
- **MT-3** (navigation) — "accept defaults and make it entirely managable from CMS" → **D-016**
- **MT-5** (retakes), **MT-8** (fixed/random), **MT-9** (question types), **MT-10** (sections) — "accept defaults and make it entirely managable from CMS" → **D-018**
- **MT-6** (scoring), **MT-7** (answer reveal) — "accept defaults and make it entirely managable from CMS" → **D-017**

### D. Monetization and payments
- **PAY-1**, **PAY-2**, **PAY-3**, **PAY-4** — "accept defaults and make it entirely managable from CMS" → **D-019** (follow-ups PAY-3b, PAY-4b above)

### E. Content and question data
- **CON-1**, **CON-2**, **CON-3**, **CON-4** — "accept defaults and make it entirely managable from CMS" → **D-024** (follow-up CON-1b above)

### F. Accounts, admin and operations
- **OPS-1** — "accept defaults and make it entirely managable from CMS" → **D-021**
- **OPS-2** — "accept defaults and make it entirely managable from CMS" → **D-022** (follow-up OPS-2b above)
- **OPS-3** — "accept defaults and make it entirely managable from CMS" → **D-023**

### G. Technology
- **TECH-1** — "Next.js + PostgreSQL"; in chat: "the tech stack i choose is Option C. Next.js + PostgreSQL" → **D-025**
- **TECH-2** — "accept defaults" (TypeScript) → **D-025**
- **TECH-3** — "Me with my one Friend" → **D-026**
- **TECH-4** — "accept defaults" (no separate client; API-clean design) → **D-025**
- **TECH-5** — "I will decide it later" → still open (above)
- **TECH-6** — "500 at launch and expandable when user got too large. There should be flexibility" → **D-026** (clarification TECH-6b above)

### Second round (2026-10-14)
- **MT-4** (pause/resume) — "Go with the suggested one" → **D-027**
- **TECH-6b** (meaning of 500) — "Just assuming" → **D-032**
- **PA-5** (default language) — "English but there should be the toggle button on the navbar so that they can use japanese language also" → **D-028**
- **DS-1** (tagline) — "Keep the tagline: Practice Smart. Pass JLPT. And if you have better tagline then this then you can put that also" → **D-031**
- Owner directives: "IMPORTANT: Make sure that the Client side UI should be the best one with the proper animation, parallax effect all of the modern designs." → **D-029**; "VERY IMPORTANT: Make everything managable through Admin Panel(CMS)" → **D-030**

### Phase 2 (2026-10-14)
- **STACK-1** (admin approach), **STACK-2** (rest of the stack), **STACK-3** (Docker packaging) — "Continue with your suggestions and recommendation" → **D-033..D-045**
- Commit/push to a planning branch with a PR — same answer → approved.

### Phase 3 (2026-10-14)
- **DS-2** — "Go with B. If any UI changes are required then i will tell you to do." → **D-046**
- **DS-3** — "Use Tagline \"Practice Smart. Pass with Confidence.\"" → **D-047**
- **DS-4** — "Yes" → **D-048**
- Merchant onboarding — "I will do this later." (PAY-3b stays open)

### Phase 5 (2026-10-14)
- **DB-1** — "Approved." → **D-049**
- **DB-2**, **ARCH-1** — covered by the same "Approved." reply; recorded as accepted defaults → **D-050** (owner may amend)

### Phase 7 (2026-10-14)
- **OPS-2b** — "Yes, admins enter a code from an authenticator app when logging in." → **D-058** (applied to all admins)
- Resend account created and API key added to `.env` by the owner; key verified with `pnpm email:check` (sending-only permission). Sending domain not yet verified.

### Cross-cutting interpretation
- "make it entirely managable from CMS" — interpreted with guardrails in **D-020**. The owner may amend it.
