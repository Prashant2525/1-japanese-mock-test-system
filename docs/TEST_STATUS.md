# Test Status

Last updated: 2026-10-14 (Phase 7 + admin two-factor login).

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
| Unit tests | `pnpm test:unit` | **36/36** |
| Integration tests | `pnpm test:int` | **55/55** |
| Build | `pnpm build` | Pass |
| E2E | `pnpm test:e2e` | **19/19** (own production server on port 3100) |

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
- WebKit and mobile-viewport E2E, axe accessibility and reduced-motion runs: Phase 8.
- Session expiry by time (7 days students, 8 h admins) is enforced by Payload's JWT `exp`. It is not tested by waiting; revocation is tested.
- Load test (k6, 500 concurrent): Phase 26.
