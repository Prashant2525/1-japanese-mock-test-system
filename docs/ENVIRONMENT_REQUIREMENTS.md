# Environment and External Service Requirements (provisional)

**Status:** PROVISIONAL. Exact variable names depend on the stack and providers approved in Phase 2. Nothing below is a final `.env` contract, and every group applies only if its integration is approved.

Rules (PB §8.1): `.env.example` holds names and placeholders only and is committed. Real `.env` files are git-ignored. Production secrets live in the hosting provider's secret manager. Server-only secrets are never exposed through client-prefixed variables. Use sandbox credentials until integrations are verified. Never fabricate credentials.

Last updated: 2026-10-14 (Phase 1). Approved architecture: Next.js + PostgreSQL + TypeScript (D-025). Hosting not yet chosen (TECH-5).

## External accounts the owner will eventually need

| Service | Needed by phase | Owner action | Lead time |
|---|---|---|---|
| eSewa merchant account (sandbox + live) | 21 (start onboarding after Phase 1) | Register a merchant under the business; obtain sandbox access. | Weeks (business documents) |
| Khalti merchant account (sandbox + live) | 22 | Register a merchant; obtain test keys from the merchant dashboard. | Days to weeks |
| connectIPS merchant (via NCHL / bank) | 23 | Contact NCHL/bank for e-payment merchant onboarding, technical documents and test credentials/certificates. | Weeks |
| Domain name + DNS | 27 | Purchase or confirm the domain. | Days |
| Hosting (app + database) | 6 (dev), 27 (prod) | Created after the stack/hosting approval. | Same day |
| File/media storage | 12 | Chosen in Phase 2. | Same day |
| Transactional email provider + verified sender domain | 7 (**required**: email verification approved, D-021) | Chosen in Phase 2; DNS records for the sending domain. | 1–2 days |
| Error monitoring (optional) | 6/26 | Only if approved. | Same day |

## Likely variable groups (names TBD)

| Group | Likely contents | Secret? | Scope |
|---|---|---|---|
| Runtime | node env, public app URL, API base URL (if separate), allowed origins | No | All |
| Database | connection URL, direct/migration URL if the ORM/provider needs one | **Yes** | Server |
| Auth | session/auth signing secret; OAuth config only if approved | **Yes** | Server |
| Email | provider API key or SMTP credentials, sender, reply-to | **Yes** (keys) | Server |
| Media storage | bucket, region/endpoint, access key/secret, public/CDN base URL, signed-URL TTL | **Yes** (keys) | Server |
| eSewa | environment flag, product/merchant code, secret key, success/failure URLs, status-check endpoint | **Yes** | Server |
| Khalti | environment flag, secret key, return URL, website URL | **Yes** | Server |
| connectIPS | merchant ID, app ID/name, password, private key/certificate material, gateway URLs | **Yes** | Server |
| Observability | error-tracking DSN, environment name | Partly | Server (+ public DSN if approved) |
| CI/CD | deploy tokens, project IDs | **Yes** | CI only |

**Payment credentials and all other secrets are never stored in or editable through the Admin CMS (D-020).** The CMS may only toggle a payment method on/off and set its display order and labels.

Provider-specific fields must be re-verified against current official documentation in Phases 20–23 (PB §8.3, Appendix D).
