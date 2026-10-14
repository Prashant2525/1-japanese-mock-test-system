# Nihongo Mock

Japanese mock test system for JLPT, NAT and JFT learners: a public website, a student area with a mandatory N5-first level check, study materials, timed mock tests with answer review, and an Admin CMS that manages all content. Payments through eSewa, Khalti and connectIPS are planned.

**Stack:** Next.js 16 · Payload CMS 3 (embedded) · PostgreSQL 17 · TypeScript · pnpm. See `docs/DECISIONS.md` (D-025, D-033..D-045).

## How this project is run

Development follows `JAPANESE_MOCK_TEST_SYSTEM_PRODUCTION_BUILD_PLAYBOOK.md` phase by phase. The current state is always in `docs/PROJECT_STATE.md`; agent rules are in `CLAUDE.md`.

## Local setup

Requirements: Node 24, pnpm 12, Docker Desktop.

```bash
pnpm install
cp .env.example .env          # then set PAYLOAD_SECRET to a random 64-character hex string
pnpm db:up                    # starts PostgreSQL on localhost:5433 (dev + test databases)
pnpm migrate                  # applies database migrations
pnpm dev                      # http://localhost:3000 · admin at /admin
```

The first admin account is created with `pnpm admin:create` (see below); the admin panel has no public sign-up. On first login every admin must set up an authenticator app (Google Authenticator, Microsoft Authenticator, Authy, 1Password…) by scanning a QR code, then enter a 6-digit code at every login.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Develop, build, run the production build |
| `pnpm lint` · `pnpm typecheck` · `pnpm format:check` | Code quality checks |
| `pnpm test:unit` | Unit tests (no database) |
| `pnpm test:int` | Integration tests against the separate `nihongo_mock_test` database |
| `pnpm test:e2e` | Browser tests against the production build (run `pnpm build` first) |
| `pnpm migrate` · `pnpm migrate:create <name>` · `pnpm migrate:status` | Database migrations |
| `pnpm generate:types` · `pnpm generate:importmap` | Regenerate Payload types and admin import map |
| `pnpm db:up` · `pnpm db:down` | Start or stop the local database |
| `pnpm email:check` | Check the Resend key and domain (sends no email) |
| `pnpm admin:create --email you@example.com --name "Your Name"` | Create a Super Admin; a set-password link is emailed (printed to the console in development) |

## Health checks

- `GET /healthz`: the process is alive.
- `GET /readyz`: the database is reachable and all migrations are applied (503 otherwise).

## Documentation

`docs/` holds requirements, decisions, architecture, API, database design, design system, test status and the session handoff.
