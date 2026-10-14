# Open Questions — Owner Decisions Register

Owner decisions that block or shape later phases. Answer by ID (e.g. "MT-4: accept default").

**Priority key:** **P1** blocks the next phase · **P2** needed by Phases 3–5 · **P3** needed later (phase named).
"Suggested default" values are **PROPOSED - APPROVAL REQUIRED** until accepted.

Last updated: 2026-10-14 (Phase 4–5).

---

## Still open

| ID | Pri | Question | Needed by | Suggested default | Owner response |
|---|---|---|---|---|---|
| DB-1 | **P1** | Approve the database design in `docs/DATABASE_ARCHITECTURE.md` (summary in §8), so Phase 6 can create it. | Phase 5 → Phase 6 | Approve | |
| DB-2 | P2 | Data retention: keep attempts, results, orders, payments and audit records indefinitely until you set a policy? (Nepal tax/accounting rules may require keeping payment records for a minimum period.) | Phase 26–27 | Keep indefinitely for now | |
| ARCH-1 | P2 | Answer-save grace window: accept answers up to 3 seconds after the deadline to absorb slow networks (adjustable 0–10 s in the CMS)? | Phase 16 | 3 seconds | |
| OPS-2b | P3 | Is MFA (authenticator-app code) **required** for admin accounts at launch, or optional? | Phase 7 | Required for Super Admin, optional for other roles. | |
| PA-6 | P3 | Who reviews the Japanese translations of UI text and the drafted page/legal copy before launch? | Phase 18 | Owner or a nominated Japanese speaker; drafts stay marked DRAFT until reviewed. | |
| PAY-3b | P3 | Merchant onboarding status: which registered business (name/PAN) will own the eSewa, Khalti and connectIPS merchant accounts, and has onboarding started? | Phase 20 | Owner starts onboarding now (D-019). | |
| PAY-4b | P3 | Is a VAT/tax invoice required on receipts, and what details must a receipt show (business name, PAN/VAT no., address)? | Phase 19 | — | |
| CON-1b | P3 | Please share a sample of existing question content (any format), if any exists, to shape the import template. | Phase 14 | — | |
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

### Cross-cutting interpretation
- "make it entirely managable from CMS" — interpreted with guardrails in **D-020**. The owner may amend it.
