# Environment and External Service Requirements

Rules (PB §8.1): `.env.example` holds names and placeholders only and is committed. Real `.env` files are git-ignored. Production secrets live in the hosting provider's secret manager. Server-only secrets are never exposed through `NEXT_PUBLIC_` variables. **Secrets are never stored in or editable through the Admin CMS (D-020).** Use sandbox credentials until integrations are verified. Never fabricate credentials.

Validation: `src/server/env.ts` checks every variable at startup and exits with the names of any missing or malformed ones (never their values).

Last updated: 2026-10-14 (Phase 7 + admin two-factor login).

## Variables in use (Phases 6–7)

| Variable | Required | Secret | Environments | Purpose | How to get it | Rotation |
|---|---|---|---|---|---|---|
| `APP_ENV` | no (default `local`) | no | all | Where the instance is deployed: `local`, `test`, `staging`, `production`. `production` enforces Resend email and a real sender. (`NODE_ENV` only says how the code was built.) | Set per environment on the host | — |
| `APP_URL` | yes | no | all | Public base URL (Payload `serverURL`, links in emails) | Your domain, e.g. `https://nihongomock.com`; local `http://localhost:3000` | On domain change |
| `LOG_LEVEL` | no (default `info`) | no | all | Log verbosity | `fatal`…`trace` or `silent` | — |
| `DATABASE_URL` | yes | **yes** | all | PostgreSQL connection string | Local: Docker default in `.env.example`; production: from the database host | On staff change or suspected leak |
| `DATABASE_POOL_MAX` | no (default 10) | no | all | Max DB connections per app instance | Size to host limits ÷ instances | — |
| `PAYLOAD_SECRET` | yes (≥ 32 chars) | **yes** | all | Signs Payload sessions and tokens | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | Rotating it logs everyone out |
| `TRUST_PROXY` | no (default `false`) | no | staging, production | `true` only behind our own reverse proxy; enables per-IP rate limits using `X-Forwarded-For` | Set on the host | — |
| `EMAIL_TRANSPORT` | no (default `console`) | no | all | `resend` (staging/production), `console` (development: prints links), `memory` (tests) | — | — |
| `RESEND_API_KEY` | when `EMAIL_TRANSPORT=resend` | **yes** | staging, production | Sends email through Resend | Resend dashboard → API keys (sending access, one domain) | Yearly or on suspected leak |
| `EMAIL_FROM_ADDRESS` | yes in production | no | all | Verified sender, e.g. `no-reply@<your domain>` | Verify the domain in Resend (DNS records) | — |
| `EMAIL_FROM_NAME` | no (default `Nihongo Mock`) | no | all | Sender display name | — | — |
| `NEXT_OUTPUT_STANDALONE` | no | no | Docker build only | `1` produces the standalone server for container images | Set in the Dockerfile (Phase 27) | — |
| `TEST_DATABASE_URL` | no | no (local/CI only) | test | Overrides the integration-test database | CI sets it to the runner's Postgres | — |
| `E2E_DEV` | no | no | local | `1` runs E2E against `pnpm dev` instead of the build | — | — |

`NODE_ENV` is set by Next.js and the scripts. Don't put it in `.env`.

## External accounts the owner will eventually need

| Service | Needed by phase | Owner action | Lead time |
|---|---|---|---|
| Transactional email (Resend) + verified sender domain | Before staging (development uses the console transport) | Create an account; add DNS records for the sending domain | 1–2 days |
| eSewa merchant (sandbox + live) | 21 | Register under the business | Weeks |
| Khalti merchant (sandbox + live) | 22 | Register; test keys from the merchant dashboard | Days–weeks |
| connectIPS merchant (via NCHL/bank) | 23 | Contact NCHL/bank for onboarding and test credentials | Weeks |
| Cloudflare R2 (media) | 12 | Create an account and buckets | Same day |
| Hosting (app + managed Postgres) | before staging (TECH-5) | Choose a provider | Same day |
| Domain + DNS | 27 | Purchase/confirm | Days |
| Sentry (errors) | 26 | Create a project | Same day |

## How to set up Resend (email)

The owner has an account and an API key in `.env` (checked 2026-10-14: accepted, sending-only). Remaining steps:

1. **Add your domain:** resend.com → **Domains** → **Add Domain** → enter the domain the emails will come from (e.g. `nihongomock.com`, or a subdomain like `mail.nihongomock.com`). Region: pick the closest one offered (e.g. Tokyo / ap-northeast-1).
2. **Add the DNS records:** Resend shows 3–4 records (an MX and TXT records for SPF, plus a DKIM TXT record). Add them in your domain registrar's DNS settings exactly as shown. Optionally add the suggested DMARC TXT record.
3. **Verify:** back in Resend, click **Verify DNS Records**. It can take from minutes to a few hours; the status changes to **Verified**.
4. **Set the sender:** in `.env` (and later on the server) set `EMAIL_FROM_ADDRESS=no-reply@<your domain>`.
5. **Send real emails locally (optional):** set `EMAIL_TRANSPORT=resend` in `.env`, restart `pnpm dev`. Production requires `resend`.
6. **Check:** `pnpm email:check` (sends nothing). For production, create a separate **Sending access** key restricted to that domain and enter it in the host's secret settings, not in a file.

## Planned variable groups (added in their phases)

| Group | Likely names | Secret | Phase |
|---|---|---|---|
| Media | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_PUBLIC`, `R2_BUCKET_PRIVATE`, `MEDIA_PUBLIC_BASE_URL` | keys: yes | 12 |
| eSewa | `ESEWA_ENV`, `ESEWA_PRODUCT_CODE`, `ESEWA_SECRET_KEY` | yes | 21 |
| Khalti | `KHALTI_ENV`, `KHALTI_SECRET_KEY` | yes | 22 |
| connectIPS | `CONNECTIPS_MERCHANT_ID`, `CONNECTIPS_APP_ID`, `CONNECTIPS_APP_NAME`, `CONNECTIPS_PASSWORD`, `CONNECTIPS_PRIVATE_KEY` | yes | 23 |
| Monitoring | `SENTRY_DSN`, `SENTRY_ENVIRONMENT` | partly | 26 |

Provider-specific names are confirmed against current official documentation in Phases 20–23.
