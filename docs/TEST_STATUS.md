# Test Status

Last updated: 2026-10-15 (Phase 9).

## Environment

- Local: Windows 11, Node v24.15.0, pnpm 12.8.1, Docker 29.8.1, PostgreSQL 17 (Docker, 127.0.0.1:5433). Databases: `nihongo_mock` (dev) and `nihongo_mock_test` (integration tests).
- Integration tests run with `EMAIL_TRANSPORT=memory` (emails captured for assertions) and `TRUST_PROXY=true` (per-IP limits exercised).
- CI: GitHub Actions `ubuntu-latest`, Postgres 17 service (password-free, ephemeral), per-run random `PAYLOAD_SECRET`.

## Commands and latest local results (2026-10-14)

| Purpose | Command | Result |
|---|---|---|
| Lint | `pnpm lint` | 0 problems |
| Type-check | `pnpm typecheck` | Pass |
| Formatting | `pnpm format:check` | Pass |
| Unit tests | `pnpm test:unit` | **119/119** |
| Integration tests | `pnpm test:int` | **102/102** |
| Build | `pnpm build` | Pass |
| E2E | `pnpm test:e2e` | **82/82 + 1 skipped** (desktop Chrome + iPhone 13 WebKit for `tests/e2e/ui`; own production server on port 3100) |

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
