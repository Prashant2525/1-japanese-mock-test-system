# Test Status

Last updated: 2026-10-15 (Phase 11).

## Environment

- Local: Windows 11, Node v24.15.0, pnpm 12.8.1, Docker 29.8.1, PostgreSQL 17 (Docker, 127.0.0.1:5433). Databases: `nihongo_mock` (dev) and `nihongo_mock_test` (integration tests).
- Integration tests run with `EMAIL_TRANSPORT=memory` (emails captured for assertions) and `TRUST_PROXY=true` (per-IP limits exercised).
- CI: GitHub Actions `ubuntu-latest`, Postgres 17 service (password-free, ephemeral), per-run random `PAYLOAD_SECRET`.

## Commands and latest local results (2026-10-16, Phase 12b)

| Purpose | Command | Result |
|---|---|---|
| Lint | `pnpm lint` | 0 problems |
| Type-check | `pnpm typecheck` | Pass |
| Formatting | `pnpm format:check` | Pass |
| Unit tests | `pnpm test:unit` | **182/182** |
| Integration tests | `pnpm test:int` | **184/184** |
| Build | `pnpm build` | Pass |
| Schema drift | `payload migrate:create ci_drift_check --skip-empty` | No drift |
| E2E | `pnpm test:e2e` | **128/128 + 1 skipped**, first try, no retries (desktop Chrome + iPhone 13 WebKit for `tests/e2e/ui`; own production server on port 3100) |

## What the Phase 12b tests prove

- **Integration `content-lifecycle` (12):** a drafter (edit-only role) can save drafts of a published material but cannot unpublish or archive it (403, KI-41 - failed before the fix), can still edit a never-published one; same rule for published questions; an unused file is deleted together with its stored file and audited; a file used by a published material or only by a newer draft is refused (409) with the material named; after deleting the material the file can go; `media.delete` needed (Content Editor 403); an archived file stays valid where already used but cannot be picked by a new material (400); material delete removes its versions and is audited, Content Editor 403; a category in use is refused with the material named, an empty one deleted; a never-published question can be deleted; a once-published question is archive-only (409).
- **Integration `study` (+2):** search narrows within what the student may see; `allowDownload` per attachment in the detail API; files always served `inline`.
- **E2E `admin-study` (1, extended):** editor uploads and publishes; N5 student sees it, PDF drawn in the page without links; Super Admin: file delete refused while used ("Used by" panel names the material); Unpublish; the student gets 404 at once; delete material; "Not used by any material"; delete file; gone from the list.
- **E2E `ui/study` (4 x 2 browsers):** downloads allowed: open/download links and in-page PDF; not allowed: no links, audio `controlslist=nodownload`, PDF still drawn in the page (iPhone WebKit too); search; axe clean.

## What the Phase 12 tests prove

- **Unit `domain/study` (8):** levels a student may study (own and lower, enabled for study, JLPT only; no level → none; disabled levels skipped). **`media` (13):** file types and size limits, content must match the type (disguised files refused), signed links bound to file + student + expiry, tampering and expiry refused, byte-range parsing.
- **Integration `study` (21):** uploads (kind set by the server; SVG, disguised and oversized files refused; alt text required for images; Support cannot upload; nothing can be deleted); visibility matrix N5/N4/N3 and a disabled N2 (an N2 material is refused); draft, archived, disabled-category and higher-level items → 404; no level → 403; filters only narrow; publishing is visible at once and a later draft edit keeps the published version; Support cannot write; media streaming with Range 206; tampered, other-student and expired links → 403; archiving closes the files at once; a valid link to a higher-level file → 404.
- **E2E `ui/study` (3 × 2 browsers):** an N4 student sees N5 + N4 materials, filters by level, opens one: furigana, image with alt text, audio and PDF fetched through signed links with byte ranges; an N5 student does not see N4 even by its address (404); the Japanese page; axe clean. **`admin-study` (1):** a Content Editor uploads a PDF, writes and publishes a material in the admin panel, and an N5 student opens it and its PDF without any deployment.

## What the Phase 11 tests prove

- **Unit `domain/determination` (25):** scoring (unanswered = wrong, marks, display rounding), exact pass-mark boundaries (59/60/61 of 100, 2/3 at 66.67 vs 66.66), every next-step branch (fail N5 → N5, N5 pass/N4 fail → N5, … pass all → N3, extra stages), refusing skipped/out-of-order/after-failure outcomes, deadlines and the 3 s grace. **`ruby` (3):** furigana parsing.
- **Integration `level-check` (29):** publishing freezes a numbered version with answers and explanations, identical content makes no new version, refuses wrong stage lists/empty stages/draft or other-level questions, publish permission; starting at N5 only (a level in the body → 400), one session even under concurrent starts, the stage attempt is always the current one; correct answers never sent during an attempt; all four outcome branches end to end (student level, level history, summary, gate opens, results list); unanswered = wrong; exact boundary; no rerun after completion; repeat and 5 concurrent submits → one result and one assignment; saves (newer wins, timestamp-sized sequence numbers, takeover → 409, unknown option → 400, other student → 404, after submit → 410); original deadline on reopen; expiry auto-submit counts answers saved in time; editing a question does not change a running attempt; reset and override with reason, permissions and audit.
- **E2E `ui/level-check` (5 × 2 browsers):** the full journey N5 passed → N4 not passed → "Your level N5" with stage scores and no second run; reload keeps answers, review marks and the deadline; a second tab takes over; calm screen without site navigation; Japanese screen; axe on the runner and result. **`admin-level-check` (2):** reset from the student record (reason required) and settings visible to an editor who cannot publish.

## What the Phase 10 tests prove

- **Unit `level-gate` (6):** the gate opens only with "completed" plus an assigned level; fails closed otherwise; refusal carries `LEVEL_NOT_DETERMINED` and `nextStep`.
- **Integration `level-gate` (15):** no session → 401 everywhere; not started / in progress / in progress with a stale level / completed without a level → 403 on materials, results and attempts; forged bodies and preference updates can't open it; students can't edit their own record through the CMS API; even an admin edit can't set the level fields; with a level → real (empty) answers, 400/404 for attempts; suspension and a reset close access on the next request; login and `/me` report `nextStep` and the level code; a level a student holds can't be deleted.
- **E2E `ui/level-gate` (5 × 2 browsers):** a new student lands on the level check; direct URLs to home, study, mock tests and results send them back; the APIs refuse whatever the body or `localStorage` says; a student with a level goes home, sees the badge and tabs, and can't reopen the level check; an open tab follows a reset and a new level on reload; Japanese pages and axe scans.

## What the Phase 9 tests prove

- **Unit `catalogue` (17):** level-check ladder (accepts N5, N5–N3, all; rejects missing N5 and gaps; uses configured order); colour format and contrast; audit diff (changed fields only, relationships by ID); seed matches D-014/D-008 and passes the same rules.
- **Integration `catalogue` (26):** seeded catalogue and EN/JA names; pagination, sort and search; Content Editor creates/edits in both languages; Support read-only (403 on write); anonymous 403; delete refused even for Super Admin, and by the database; one code per exam type; malformed code/colours; JLPT-only level check and study; equivalent-level rules; ladder rules incl. reordering; exam type code fixed; audit records actor, changed fields and language, and skips no-op saves; dashboard widgets count from the database, draw the route from CMS switches, refuse unpermitted admins and never show secrets.
- **E2E `admin-cms` (4):** Super Admin sees branding, all menu groups and live widgets; Content Editor lists/searches/edits levels, sees the level-check message under the field, and edits persist; Support sees no catalogue/setup widgets or Content menu, no create button, and the server refuses PATCH/DELETE; anonymous API reads get 403.

## What the Phase 8b (Google) tests prove

- **Unit `google` (17):** the Google link carries PKCE (S256), state, nonce and language; values are fresh per attempt; the flow cookie rejects tampering, another secret and expiry; ID-token claims are rejected for wrong issuer, audience, authorized party, expiry, future issue time, nonce, unverified or missing email, missing subject, malformed tokens. **`env` (+2):** empty lines are unset; both Google values or neither.
- **Integration `google-auth` (17):** new Google user → confirmed account in their language + working session; same user again → same account; existing confirmed account linked and its password still works; unconfirmed account confirmed and its old password stops working; suspended refused; email linked to another Google ID refused; Google sessions end on logout; forged/stale state, missing cookie, replayed nonce, unverified email and refused code all fail safely; cancel keeps language and destination; `next` can't leave the student area; CMS switch off → unavailable; per-IP rate limit.
- **E2E `ui/google` (5 × 2 browsers):** the button sends the browser to Google with the right client, return address and PKCE; Japanese sign-up page shows 「Google で続ける」 and passes axe; every failure reason is explained on the login page; a stale return lands on the login page; switching Google off in the CMS hides the button on the production build at once (KI-22 regression).

## What the Phase 8 tests prove

- **Unit:**
  - `labels` (8): EN/JA have identical keys, no empty labels, identical `{placeholders}`, every validation key exists, label globals cover every namespace once and stay under 80 labels, override merging.
  - `contrast` (22): every text/background token pair ≥ 4.5:1; level badges ≥ 4.5:1 with white text; route lines and focus rings ≥ 3:1.
  - `login-errors` (4): login failures classified by HTTP status, not class identity; lock decided from the state before the attempt (deterministic).
  - `ui-lib` (10): open-redirect protection for `?next=`; API client success, error code + Retry-After, network failure, non-JSON error.
- **Integration, `ui-labels` (4):** a CMS override reaches the merged messages and clearing it restores the default; EN overrides don't leak into JA; saves are audited; only `content.manage` can edit.
- **E2E, `ui/routing` (6 × 2 browsers):** English for first-time visitors even with a Japanese browser; the switch keeps the page and is remembered; merely seeing the switch (background prefetch) does not change the remembered language; translated 404; the student area redirects to login with `next`; no sideways scrolling.
- **E2E, `ui/auth-flow` (5 × 2):** full sign up → verify → log in → student home → log out; translated validation and the "email or password is incorrect" error; an unverified student can resend the link; forgot → reset → log in with the new password; reset page without a token.
- **E2E, `ui/a11y` (14 × 2, skip-link test desktop only):** axe WCAG 2.2 AA scans of 11 pages (EN and JA) with no serious or critical violations; errors linked with `aria-describedby`; the skip link moves focus; reduced motion disables entrance animation.

## What the Phase 7 tests prove

- **Unit:**
  - `permissions` (5): Super Admin has every permission; a fake "Super Admin" role gets nothing extra; the rest fail closed.
  - `email-templates` (5): allow-listed variables, escaping, fallback to code defaults, subject newline stripping.
  - `client` (5): CSRF same-origin rules, client IP parsing.
  - `env` (+3): email/proxy rules, APP_ENV production checks.
- **Integration, `rbac` (14):**
  - seeded role sets; system roles undeletable; Super Admin permissions can't be reduced; `isSystem` can't be set;
  - an editor can't create admins, escalate themselves, edit another admin or edit roles;
  - Support is read-only; only `audit.read` sees the audit log, and it can't be edited;
  - a disabled admin is locked out at once; the last Super Admin is protected.
- **Integration, `student-auth` (23):**
  - sign-up sends an EN/JA verification email with HTML escaped;
  - duplicate sign-up and unknown emails get the same answer; weak passwords and extra fields are rejected;
  - no login before verification; verification tokens work once; re-send works;
  - wrong password and unknown email give identical answers; the cookie is HttpOnly and SameSite;
  - the cookie is ignored without browser signals; `/me` shows no secrets;
  - logout revokes only that device; 5 failures lock the account; the per-IP limit sends Retry-After;
  - suspension ends sessions; CSRF is rejected; login and logout are audited;
  - reset is single-use, revokes all sessions and swaps the password;
  - a student can't read others, can't change protected fields, and can change only the language preference.
- **Integration, `admin-mfa` (6):** a password-only admin session is blocked (not enrolled, and enrolled without a code); a verified session works; the secret is never returned through access-controlled reads, is redacted from the audit log, and cannot be written by another admin; students are unaffected.
- **E2E, `admin-mfa` (3):** after the password, the admin API returns 403 until the code is entered, then 200; a wrong code keeps the admin on the code page; a new admin is forced through QR setup before using the panel.
- **Integration, `database` (9), `health` (3):** connectivity, migrations, session tables, rate-limit table, admin access closed.
- **E2E, `auth` (8):** Payload student endpoints return 404; anonymous listing returns 403; a real-browser login sets an HTTP-only cookie invisible to JavaScript; `/me` and logout work; cross-site login is rejected; a Super Admin sees roles, the audit log and email templates, and an editor does not.
- **E2E, `foundation` (8):** as in Phase 6.

## Coverage gaps (planned)

- Real Resend delivery: needs an account (staging).
- Visual regression screenshots are reviewed manually; automated visual diffs are not set up.
- Session expiry by time (7 days students, 8 h admins) is enforced by Payload's JWT `exp`. It is not tested by waiting; revocation is tested.
- Load test (k6, 500 concurrent): Phase 26.
