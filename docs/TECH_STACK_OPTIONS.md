# Technology Stack Options — Phase 2

**Status:** APPROVED 2026-10-14 as recommended (D-033..D-045 in `docs/DECISIONS.md`). Hosting provider still deferred (TECH-5).
**Fixed by earlier decisions:** Next.js (App Router) + PostgreSQL + TypeScript, one integrated app (D-025). Bilingual EN/JA (D-004, D-028). Showcase motion (D-029). Maximal CMS coverage (D-030). 2-person maintenance team (D-026). ~500 concurrent test-takers as the working assumption (D-032). Hosting deferred (TECH-5).

Researched: 2026-10-14. Exact package versions are pinned in Phase 6 at install time, after re-checking compatibility.

---

## 0. Summary — recommended stack

| Layer | Recommendation | Main alternative |
|---|---|---|
| Framework | Next.js 16.x (App Router), React Server Components, TypeScript strict | — (fixed) |
| **Admin CMS approach** | **Payload CMS (3.x stable), embedded in the same Next.js app** | Custom-built admin panel |
| Database / ORM / migrations | PostgreSQL via Payload's Postgres adapter (Drizzle-based) + Payload migrations; Drizzle directly for complex transactional queries | Prisma 7 (only with a custom admin) |
| Auth | Payload's built-in auth: separate `admins` and `students` collections, email verification, password reset, login lockout; app-level rate limiting; TOTP for admins if OPS-2b requires it | Better Auth |
| Internationalisation | next-intl (UI, `/en` and `/ja` routes) + Payload field-level localization (content) + a CMS "UI labels" override layer | Paraglide JS |
| Styling | Tailwind CSS v4 + design tokens as CSS variables (CMS-editable theme colours) | CSS Modules |
| Components | Own component library built on accessible primitives (shadcn/ui pattern over Radix UI/Base UI), fully restyled to the brand | MUI / Chakra (rejected: generic look) |
| Motion | GSAP + ScrollTrigger (parallax and scroll storytelling, public pages) + Motion for React (UI transitions, micro-interactions) + CSS for simple cases | Motion only |
| Rich text | Payload's Lexical editor (stored as JSON, safely rendered) + a custom furigana/ruby feature | Tiptap |
| Forms / validation | Zod schemas shared by client and server + React Hook Form (student side); Payload's form builder for the CMS-managed contact form | Conform |
| Client data | Server Components by default; TanStack Query only for the test runner (autosave, retry) and interactive widgets | SWR |
| Background jobs | Payload Jobs Queue (stored in Postgres): emails, deadline sweeps, payment reconciliation, scheduled publishing | pg-boss; BullMQ + Redis |
| Media storage | S3-compatible object storage — **Cloudflare R2** (no egress fees, good for audio/PDF) via Payload's storage adapter; private files via signed URLs | AWS S3; Backblaze B2; local disk on a VPS |
| Email | **Resend** via Payload's email adapter (SMTP adapter kept as a fallback) | Postmark; Amazon SES; Brevo |
| Testing | Vitest (unit/integration) + real Postgres in Docker for integration tests + Playwright (E2E, mobile viewports, WebKit) + axe-core (accessibility) + k6 (load test at 500 concurrent) | Jest; Cypress |
| Code quality | pnpm, ESLint + Prettier, TypeScript strict, Husky pre-commit (lint/format) | Biome |
| Monitoring | Sentry (errors, performance) + an uptime monitor + structured server logs | Host logs only |
| CI/CD | GitHub Actions (repo is already on GitHub): lint, typecheck, tests, E2E, build, migration check | — |
| Packaging / hosting | **Docker image** (Next.js standalone output) so any host works; local dev with Docker Compose Postgres. Host chosen later (TECH-5). | Vercel serverless |

**The one decision that matters most is the Admin CMS approach (§1).** Most other rows follow from it.

---

## 1. Admin CMS approach (the pivotal decision)

The owner's top priority is that *everything* is manageable from the Admin Panel, in two languages, with drafts, publishing, media, permissions and audit. That is a large amount of generic CMS machinery before any exam-specific work begins.

### Option A — Payload CMS embedded in the Next.js app (recommended)

Payload is an open-source (MIT), TypeScript, Next.js-native CMS. Since v3 it installs directly into a Next.js app and shares its server, routes and build. It supports PostgreSQL through a Drizzle-based adapter. It is actively released: 3.90.2 is the current stable (Sept 2026), and v4 entered beta in Oct 2026. The team joined Figma in June 2025, and its official announcement says Payload remains open source and nothing changes for users.

**What we get without building it:**
- A full admin panel (list/search/filter/paginate, forms, validation, bulk actions), themable with the Nihongo Mock brand.
- **Field-level localization** (EN/JA, with fallback to EN): matches D-004/D-028 exactly.
- Drafts, versions, autosave, scheduled publish, restore: matches PB §5.1.
- Access control functions at collection, document and field level: supports Super Admin / Content Editor / Support plus granular permissions (D-022).
- Auth for multiple user types: email verification, forgot/reset password, lockout after failed logins.
- Upload collections + an S3-compatible storage adapter (R2): the media library (PB §5.12).
- **Blocks field**: a safe, predefined page builder. Each block can carry its own animation preset and parallax images (D-030, PB §5.10 "safe predefined content blocks, not arbitrary code").
- Live preview of pages before publishing.
- Hooks (before/after change) for the audit log and validation; a jobs queue; the Local API for fast server-side data access in Server Components.
- Custom React components inside the admin for exam-specific screens: test builder, import preview, determination configuration.

**Costs and risks:**
- Learning curve and framework lock-in: the schema is defined in Payload's config, not Prisma.
- Exam logic (attempt state machine, deadlines, idempotent finalization, scoring, snapshots) still has to be written by us. Plan: keep it as a **framework-independent TypeScript domain module** with its own unit tests, calling Payload/Drizzle only through a thin data layer. This also limits lock-in.
- The admin panel looks like Payload (branded, but not fully bespoke). The showcase design effort goes into the **student and public site**, where the owner asked for it.
- **v4 is in beta** (RISK-08): a major upgrade may land during the build. Decide in Phase 6 whether to start on 3.x stable or wait briefly for v4 GA.
- Admin MFA is not built in; it would be a small custom TOTP addition if OPS-2b requires it.
- Payload's built-in session and revocation behaviour must be verified in Phase 7 against AUTH-R02. If it falls short, add a server-side token-version check.

### Option B — Custom-built admin panel

Build every admin screen ourselves with the same component library, TanStack Table, React Hook Form and Prisma or Drizzle.

- **Pros:** total control over UX and look; a single ORM of our choice; no CMS framework to learn or upgrade.
- **Cons:** we must build localization, drafts/versions, scheduled publishing, media library, permission system, audit, page builder and CRUD for roughly 20 modules. For a 2-person team this is the largest single block of work in the project, and the most likely place for gaps in "everything manageable".
- **Fit:** reasonable only if the owner wants a fully bespoke admin look and accepts a noticeably longer timeline.

### Option C — Separate headless CMS (Strapi, Directus, Sanity)

- **Rejected:** a second service to deploy and secure; contradicts D-025 (one integrated app). Sanity is not PostgreSQL.

**Recommendation: Option A (Payload, embedded).** It delivers the owner's "everything manageable, in two languages" requirement fastest and most completely, while the exam engine stays our own tested code.

---

## 2. Database access, ORM and migrations

| Option | Pros | Cons | Fit |
|---|---|---|---|
| **Payload Postgres adapter (Drizzle-based) + Drizzle for custom queries** | One schema source, one migration system; Drizzle gives raw SQL power (row locks, `SELECT … FOR UPDATE`, transactions) for finalization and payments | Two layers to understand (Payload API vs Drizzle) | **Recommended with Option A** |
| Prisma 7 | Mature tooling, readable schema; v7 dropped the Rust engine (smaller, faster cold starts) | Running Prisma beside Payload means **two migration systems on one database** — rejected for Option A | Best choice for Option B |
| Drizzle alone | Lightweight, SQL-like, TypeScript schemas | Less tooling than Prisma | Alternative for Option B |

PostgreSQL features we will rely on: transactions, unique constraints (one active attempt per student+test, D-027; idempotency keys for payments), partial indexes, JSONB for result snapshots, `pg_trgm` for search (Japanese search behaviour checked in Phase 5).

## 3. Authentication

| Option | Pros | Cons |
|---|---|---|
| **Payload built-in auth (recommended with A)** | Already integrated with the admin and access control; email verification, reset, lockout; separate `admins`/`students` collections | Admin MFA and shared rate limiting need small additions |
| Better Auth | Feature-rich (2FA, rate limiting, sessions); MIT; now also maintains Auth.js; acquired by Vercel in July 2026 and stated to stay open source | Integrating it with Payload's admin login adds complexity; vendor-direction questions after the acquisition |
| Auth.js (NextAuth) | Familiar | Now under Better Auth's stewardship; not recommended for new projects |
| Fully custom | Full control | Highest security risk; not justified |

## 4. Internationalisation (EN/JA)

- **next-intl:** mature App Router support; `/en/...` and `/ja/...` URLs with `hreflang` for SEO; English default (D-028); the toggle is remembered by cookie or account preference.
- **Content:** Payload `localized: true` fields with fallback to EN.
- **UI labels (D-030):** default EN/JA message files in code, overridden by a CMS "UI Labels" global, so an admin can reword any button or message without a deployment. The code defaults guarantee the site never shows a blank label.
- Japanese typography: a self-hosted Japanese font subset (e.g. Noto Sans JP / an approved alternative) chosen in Phase 3, with `font-display: swap` and furigana via `<ruby>`.

## 5. Styling, components and motion

- **Tailwind CSS v4 + CSS-variable design tokens.** Theme colours are CMS-editable (D-030) and mapped to the variables at render time, with server-side WCAG AA contrast checks before saving.
- **Components:** our own library on accessible primitives (shadcn/ui pattern over Radix UI or Base UI). The code lives in the repo, so the look is fully custom, never a template.
- **Motion (D-029):**
  - **GSAP + ScrollTrigger** for parallax layers, pinned scroll sections, text-split reveals and scroll-linked timelines on public pages. GSAP and all its plugins are now free, including commercial use. Loaded only on marketing routes to protect performance.
  - **Motion for React** (formerly Framer Motion) for component enter/exit, layout transitions, hover/tap micro-interactions, page transitions in the student area.
  - CSS transitions for simple states.
  - Optional smooth scrolling (e.g. Lenis) decided in Phase 3. It is disabled under reduced motion because it can harm accessibility.
  - Every section block in the CMS gets an **animation preset** (none / fade-up / stagger / parallax / …) from a safe, tested list.
  - `prefers-reduced-motion` switches every preset to a calm version. The exam runner uses only minimal motion.

## 6. Forms, validation and client data

- **Zod** schemas shared between client and server; the server always re-validates. **React Hook Form** on student-facing forms.
- **Payload form builder** for the contact form, so fields, labels and the notification email are CMS-managed.
- **Server Components** by default; **TanStack Query** only where interaction demands it (test-runner autosave with retry and offline buffer, live timer sync).

## 7. Background jobs

The **Payload Jobs Queue** (tasks stored in Postgres, no Redis) handles: sending emails, sweeping expired attempts (finalization also happens lazily on the next request), payment status reconciliation, scheduled publish. It needs a long-running worker or a scheduled trigger, which favours a container host (see §11). Alternatives: pg-boss (similar); BullMQ (requires Redis); hosted Inngest/Trigger.dev (extra vendor).

## 8. Media storage

| Option | Pros | Cons |
|---|---|---|
| **Cloudflare R2 (recommended)** | S3-compatible, **no egress fees** (audio and PDF downloads are bandwidth-heavy), CDN in front, signed URLs for private files | Another account to create |
| AWS S3 | The standard | Egress charges |
| Backblaze B2 | Cheap | Fewer integrations |
| Local disk on a VPS | Simplest | Backups and scaling are on us; single point of failure |

Free study materials can use public CDN URLs. Media for paid tests and question audio use private storage and short-lived signed URLs after a server-side access check (TSR-07).

## 9. Transactional email (required by D-021)

| Option | Notes |
|---|---|
| **Resend (recommended)** | Simple API, official Payload adapter; email copy comes from the CMS (D-030) |
| Postmark | Excellent deliverability for transactional email |
| Amazon SES | Cheapest at volume; more setup |
| Brevo | Generous free tier |

All of them need DNS records (SPF/DKIM) on the sending domain. Pricing tiers to be confirmed at signup.

## 10. Testing, quality and monitoring

- **Vitest** for the domain module (progression, scoring, deadlines, payment state machine) and API integration tests against a **real Postgres in Docker**. No mock databases in integration tests.
- **Playwright** for E2E (desktop + mobile viewports, Chromium + WebKit), plus **axe-core** accessibility scans and a reduced-motion run (UX-R02).
- **k6** load test for 500 concurrent test-takers (D-032) in Phase 26.
- **Sentry** for error tracking; an uptime monitor on the health endpoint; JSON logs without secrets.
- **GitHub Actions** CI: lint → typecheck → unit → integration (Postgres service) → build → E2E → migration check.

## 11. Packaging and hosting (decision deferred — TECH-5)

Recommendation now: **build a Docker image** (Next.js standalone output plus a worker process for jobs) so the choice of host stays open. Local development uses Docker Compose for Postgres.

| Host type | Pros | Cons | Fit |
|---|---|---|---|
| VPS (e.g. DigitalOcean, Hetzner, or a Nepal-based provider) + Docker | Lowest cost; **static IP** (useful if a payment provider whitelists server IPs); long-running worker is easy | We manage OS updates, backups, monitoring | Good value; more ops work |
| Managed containers + managed Postgres (e.g. Railway, Render) | Easy deploys, managed backups | Higher monthly cost than a VPS | **Good balance for a 2-person team** |
| Vercel (serverless) + managed Postgres (e.g. Neon) | Best Next.js developer experience | Background worker needs workarounds; no static egress IP by default; cost rises with traffic | Weaker fit for jobs and payment callbacks |

Region: closest to Nepal (Mumbai or Singapore) for latency. To decide before the first staging deployment.

## 12. Indicative monthly cost at launch (rough, to verify at signup)

- App + database: from a low-cost VPS to a moderate managed-platform bill, depending on host choice.
- R2: likely within the free tier at launch volumes.
- Email: likely within the free tier at launch volumes.
- Sentry: free developer tier.
- Payload, Next.js, GSAP, Motion, next-intl, Tailwind: free, open source.

## 13. What the owner needs to approve

1. **Admin CMS approach:** Option A (Payload, recommended) or Option B (custom admin).
2. **The rest of the stack in §0 as a set**, or name the lines to change.
3. Hosting stays deferred, but the **Docker-based, host-agnostic packaging** is approved now so hosting can be chosen later without rework.
