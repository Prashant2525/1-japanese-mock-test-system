# Open Questions — Owner Decisions Register

Owner decisions that block or shape later phases. Answer by ID (e.g. "MT-4: accept default").

**Priority key:** **P1** blocks the next phase · **P2** needed by Phases 3–5 · **P3** needed later (phase named).
"Suggested default" values are **PROPOSED - APPROVAL REQUIRED** until accepted.

Last updated: 2026-10-16 (Phase 13: EX-1 added).

---

## Still open

| ID | Pri | Question | Needed by | Suggested default | Owner response |
|---|---|---|---|---|---|
| EX-1 | P3 | **Exam sections:** the defaults were seeded from the official guides (D-103). For NAT-TEST I could confirm the 5Q layout (文字・語彙 / 文法・読解 / 聴解) but not whether 1Q/2Q combine sections as JLPT N1/N2 do. Please check Admin → Exam catalogue → Exam sections and correct anything (all editable). | Phase 15 (mock-test builder) | Keep the seeded sections; NAT uses the same three for every level until you change it. | |
| PAY-3b | P3 | Merchant onboarding: which registered business (name/PAN) will own the eSewa, Khalti and connectIPS merchant accounts? | Phase 20 (live) | Use the provider sandboxes until then. | Owner 2026-10-16: "For now use test sandbox and later i will provide the details" |
| CON-1b | P3 | Please share a sample of existing question content (any format), if any exists, to shape the import template. | Phase 14 | — | |
| DOM-1 | P3 | Domain name: the owner will buy it later (2026-10-15). It is needed for the Resend sender domain, `APP_URL` and hosting. The guide is in `.env` / `.env.example` ("WHEN YOU BUY YOUR DOMAIN"). | Before staging | — | Owner: "For now I haven't bought domain … when I buy domain I will add required keys." |
| TECH-5 | P3 | Hosting provider and monthly budget ("I will decide it later"). Phase 2 will propose host-agnostic options. | Before first staging deployment (Phase 6/27) | — | |

---

## Closed — answered 2026-10-16 (reference review)

Owner responses verbatim (line breaks joined); decisions D-092..D-099 in `docs/DECISIONS.md`.

| ID | Question | Owner response | Decision |
|---|---|---|---|
| RV-7 | **Deletion policy** (owner: content "cannot be deleted" is a defect). What may be permanently deleted, and what stays archive-only? | I recommend the proposed deletion policy, with additional safeguards: · - Permanently delete: unused media and files, unused study materials, empty categories, and unpublished questions that are not referenced by any historical record or exam snapshot. · - Block deletion: anything currently referenced by another record. Show the admin exactly where it is being used. · - Archive or deactivate: published questions, exam configurations, levels, level-check versions, student attempts and results, orders, payments, audit events, and accounts whose history must be retained. · - Protect financial and audit records: never permanently delete completed payment records or audit events through the ordinary CMS interface. · - Protect stored files: delete the underlying file only after verifying that no other record uses it. · - Permissions: add materials.delete, media.delete, and questions.delete, following least-privilege access. Super Admin can have full access; Content Editor should receive only the permissions needed for their role. · One important adjustment: Do not make student or admin account deletion an ordinary permanent-delete action. Use deactivation, with a separately controlled privacy-compliant process for requests requiring personal-data erasure. · This is the safest approach for protecting student history, exam integrity, and payment records. | D-092 |
| RV-1 | **Free / premium / preview for study materials.** D-019 says study materials are free. Should each material (and each attachment) be Free, Premium, or Premium with a free preview? | Premium + preview and also admin should be able to control like which content to make free or premium or free + premium | D-093 |
| RV-2 | **What do students buy?** D-019: single tests and fixed bundles with a validity period, no recurring subscriptions. The reference sells "plans" that cover all courses including new ones. | Launch with these two product types: · - Single test: one specific test with a defined validity period. · - Fixed bundle: a defined collection of tests with a defined validity period. · Do not introduce recurring subscriptions. I would also defer rule-based access plans covering future content until there is a demonstrated need, because they add entitlement and access-management complexity. · Keep product prices, validity, purchase history, and access entitlements manageable through the existing admin CMS. And also make sure i should be able to add plans or change this single test, fixed bundle or add other options also | D-094 |
| RV-3 | **Coupons at launch?** (D-019 says no.) | Yes and both % and fixed amount | D-095 |
| RV-4 | **Refunds?** (D-019 says no.) | Yes | D-095 |
| RV-5 | **Sale prices** with a start/end window on products (reference plan screen)? | Yes | D-095 |
| RV-6 | **Communication modules:** (a) Notices/announcements (REC-09: kind, EN/JA title and text, attached PDFs, pin, publish window/expiry, shown on student home and a Notices page); (b) home-page banners/CTAs; (c) email campaigns to groups of students; (d) Help/FAQ, About, Privacy, Terms, Refund, Contact pages. | Follow the proposed scope: · - Notices and announcements: implement in Phase 24, with English/Japanese content, attached PDFs, pinning, publishing windows, and expiry. · - Home-page banners and CTAs: include in Phase 18's page-block system. · - Email campaigns: exclude from launch. · - Help/FAQ, About, Privacy Policy, Terms, Refund Policy, Contact: include as approved in Phase 18. · Keep these features manageable from Payload CMS rather than creating another content-management system. | D-096 |
| RV-8 | **Watermark** premium files with the student's email? | Yes | D-097 |
| RV-9 | **Premium PDF downloads:** allow "Download", or view-in-browser only? | No download option for both. But i should able to control from Payload CMS like for which content should i toggle download on/off | D-097 |
| RV-10 | **Student area layout:** left sidebar on desktop + bottom tab bar on phones (like the reference), replacing today's top tabs? | Implement the best one. Like which you like the most and the user will like | D-098 |
| RV-11 | **Admin look and menu:** theme Payload's admin to Tokyo Transit (light + dark), regroup the menu like the reference, and add custom views (dashboard, reports, order detail, student detail) — rather than building a separate admin. | Don't build new separate admin. Customize the existing PayLoad CMS | D-098 |
| RV-12 | **Study progress:** track "studied" per material (reference shows % progress, "continue learning")? | Approved | D-099 |
| RV-13 | **Staff invitations by email** (they set their own password; you never see it), plus a sessions list with "Sign out everywhere" for students and staff? | Approved | D-099 |
| RV-14 | **Dates in the admin:** show Bikram Sambat (BS) dates next to AD, as in the reference reports? Reports by Nepal-time day? | Approved | D-099 |
| PA-6 | Who reviews the Japanese translations of UI text and the drafted page/legal copy before launch? | Both and there should be option in CMS that who can verify Japanese translations | D-099 |
| PAY-4b | Is a VAT/tax invoice required on receipts, and what details must a receipt show (business name, PAN/VAT no., address)? | I should be able to manage it from CMS | D-095 |

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
