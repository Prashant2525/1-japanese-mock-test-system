# API Documentation — Nihongo Mock

**Status:** conventions from Phase 4; **auth endpoints implemented and tested in Phase 7 (2026-10-14)** (§4.1). Other endpoints are planned (§4.2) and are documented in full as each phase lands.

---

## 1. Surfaces

| Surface | Base path | Consumers | Auth |
|---|---|---|---|
| Domain API | `/api/v1` | Student web UI; future mobile clients (D-025) | Student session cookie (`payload-token`, HTTP-only, SameSite=Lax); future mobile clients send `Authorization: JWT <token>` |
| Payload REST | `/api/cms` | Payload admin panel | Admin session. Access functions deny students and the public except explicitly public read endpoints (published pages, catalogue, labels). |
| Health | `/healthz`, `/readyz` | Load balancer, uptime monitor | None; returns no secrets |

## 2. Conventions

- JSON in and out, UTF-8, `camelCase` fields; times in ISO 8601 UTC (`2026-10-14T09:30:00.000Z`); money as **integer paisa** with a `currency: "NPR"` field.
- Every request body and query is validated with Zod; unknown fields are rejected.
- Mutations accept an `Idempotency-Key` header where noted. Repeating it returns the original result.
- Locale: the `Accept-Language` header is **ignored for UI choice**. Responses with user-facing text use the `locale` query parameter or the student's preferred locale (`en` default, D-028).
- **Versioning:** breaking changes go to `/api/v2`; additive changes stay in v1.
- **Pagination:** `?page=1&limit=20` (max 100) → `{ items, page, limit, totalItems, totalPages }`.
- Every response carries `X-Request-Id`.
- **Rate limits:** `429` with a `Retry-After` header.
- **CSRF:** every non-GET `/api/v1` request is rejected (403) when `Origin` or `Sec-Fetch-Site` shows another site. In addition, Payload accepts the session cookie only when the request carries same-origin browser signals (`Origin` on the allow-list, or `Sec-Fetch-Site: same-origin`, `same-site` or `none`). Browsers send these automatically; scripts and server-to-server calls must use the `Authorization` header instead of the cookie.

## 3. Error model

```json
{ "error": { "code": "ATTEMPT_CLOSED", "message": "This test has ended. Your answers were submitted.", "details": null, "requestId": "req_01J..." } }
```

| HTTP | Codes (initial set) |
|---|---|
| 400 | `VALIDATION_FAILED` (details: field errors), `INVALID_TOKEN` |
| 401 | `UNAUTHENTICATED`, `SESSION_EXPIRED`, `INVALID_CREDENTIALS` |
| 403 | `FORBIDDEN`, `ACCOUNT_DISABLED`, `LEVEL_NOT_DETERMINED`, `EMAIL_NOT_VERIFIED`, `NOT_ENTITLED`, `LEVEL_NOT_AVAILABLE` |
| 404 | `NOT_FOUND` (also used instead of 403 for other users' resources, to avoid leaking existence) |
| 409 | `STALE_SESSION`, `ATTEMPT_ALREADY_ACTIVE`, `ATTEMPT_LIMIT_REACHED`, `ALREADY_FINALIZED`, `STAGE_OUT_OF_ORDER`, `ORDER_STATE_CONFLICT` |
| 410 | `ATTEMPT_CLOSED` |
| 422 | `PAYMENT_VERIFICATION_FAILED`, `AMOUNT_MISMATCH` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL` (no internal details) |

`message` is localized from UI labels; clients should switch on `code`.

## 4. Endpoints

### 4.1 Auth — IMPLEMENTED (Phase 7)

All bodies are strict JSON objects; unknown fields → `400 VALIDATION_FAILED`. Emails are trimmed and lower-cased. Passwords: 10–128 characters.

| Method | Path | Body | Success | Errors | Limits |
|---|---|---|---|---|---|
| POST | `/api/v1/auth/register` | `{ name, email, password, preferredLocale?: "en" or "ja" }` | `202 { "status": "accepted" }`, the **same response** whether or not the email already exists. New accounts get a verification email in their language; an existing unverified account gets a fresh link. | 400, 403 (cross-site), 429 | 10/hour per IP; 3 emails/15 min per address |
| POST | `/api/v1/auth/verify` | `{ token }` | `200 { "status": "verified" }` | `400 INVALID_TOKEN` (unknown or already used) | 30/15 min per IP |
| POST | `/api/v1/auth/resend-verification` | `{ email }` | `202 { "status": "accepted" }` (always) | 400, 429 | 20/hour per IP; 3/15 min per address |
| POST | `/api/v1/auth/login` | `{ email, password }` | `200 { "student": PublicStudent }` + `Set-Cookie: payload-token=…; HttpOnly; SameSite=Lax` (+ `Secure` in production). Session valid 7 days and revocable. | `401 INVALID_CREDENTIALS` (same for an unknown email and a wrong password); `403 EMAIL_NOT_VERIFIED` (only after a correct password); `403 ACCOUNT_DISABLED`; `429 RATE_LIMITED` (also for locked accounts: 5 wrong passwords → 15 min) | 20/15 min per IP; 10/15 min per account |
| POST | `/api/v1/auth/logout` | `{}` | `204` + expired cookie. The session is deleted server-side, so the old cookie stops working immediately; other devices stay signed in. | — | — |
| POST | `/api/v1/auth/forgot-password` | `{ email }` | `202 { "status": "accepted" }` (always; nothing is sent for unknown emails) | 400, 429 | 20/hour per IP; 3/15 min per address |
| POST | `/api/v1/auth/reset-password` | `{ token, password }` | `200 { "status": "password_reset" }`. **All sessions are revoked.** The token is single-use and valid for 60 minutes. | `400 INVALID_TOKEN` | 30/15 min per IP |
| GET | `/api/v1/me` | — | `200 { "student": PublicStudent }` | `401 UNAUTHENTICATED`; `403 ACCOUNT_DISABLED` | — |
| PATCH | `/api/v1/me/preferences` | `{ preferredLocale: "en" or "ja" }` | `200 { "student": PublicStudent }` | 400, 401 | — |

`PublicStudent` = `{ id, name, email, preferredLocale, status, determinationStatus }`. It never includes hashes, salts, tokens or sessions. `assignedLevel` is added in Phase 11.

Rate-limited responses include `Retry-After` (seconds). Per-IP limits apply only when `TRUST_PROXY=true` (behind our reverse proxy); per-account limits and lockout always apply.

**Blocked Payload endpoints** (return `404`, see `src/proxy.ts`): `POST /api/cms/students` and `/api/cms/students/{login, logout, refresh-token, forgot-password, reset-password, verify/*, unlock, first-register, me, init, access}`. Students authenticate only through `/api/v1/auth`.

**Admin authentication** uses Payload's own admin login at `/admin` (`/api/cms/admins/login`), with lockout after 5 failures, the same rate limits, and revocable sessions. Disabled admins cannot log in, and disabling an admin revokes their sessions. The first Super Admin is created with `pnpm admin:create --email … --name …`, which emails a set-password link.

### 4.2 Planned endpoints

#### Level determination (Phases 10–11)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/determination` | Current session: stages (enabled levels), current stage, status |
| POST | `/api/v1/determination/start` | Starts at N5 (no level parameter accepted) |
| POST | `/api/v1/determination/stages/current/attempt` | Creates/resumes the current stage attempt |
| GET | `/api/v1/determination/summary` | "Your level" summary after completion |

#### Attempts (shared runner — Phase 16)
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/attempts` | Start a mock-test attempt `{ mockTestId }` (Idempotency-Key) |
| POST | `/api/v1/attempts/{id}/resume` | Rotate `sessionId` (latest tab wins) |
| GET | `/api/v1/attempts/{id}` | Questions (no correctness data), saved answers, flags, `deadlineAt`, `serverNow` |
| PUT | `/api/v1/attempts/{id}/answers/{questionKey}` | `{ optionKey \| null, flagged, seq, sessionId }` |
| POST | `/api/v1/attempts/{id}/submit` | Manual submit (idempotent) → `{ resultId }` |

#### Results (Phase 17)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/results` | Own history (mock + determination), filters, pagination |
| GET | `/api/v1/results/{id}` | Summary + sections |
| GET | `/api/v1/results/{id}/review` | Per-question review from the snapshot; filter `all\|incorrect\|flagged` |

#### Catalogue and study (Phases 12–13, 18)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/catalogue/exams` | Enabled exam types and levels |
| GET | `/api/v1/mock-tests` | Published tests; filters `exam`, `level`, `free`; includes the student's entitlement status when logged in |
| GET | `/api/v1/mock-tests/{slug}` | Test detail (no questions) |
| GET | `/api/v1/study/materials` | Eligible materials (current and lower levels), filters `level`, `category` |
| GET | `/api/v1/study/materials/{slug}` | Material with signed media URLs |
| POST | `/api/v1/contact` | Contact form (rate-limited) |

#### Commerce and payments (Phases 19–23)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/products` | Active products/bundles with server prices |
| POST | `/api/v1/orders` | `{ productId }` → server-priced order (Idempotency-Key) |
| GET | `/api/v1/orders` · `/{id}` | Own orders and status |
| POST | `/api/v1/orders/{id}/pay` | `{ provider }` → provider initiation data/redirect |
| GET/POST | `/api/v1/payments/{provider}/callback` | Provider return/notification; verified server-side; never trusted alone |
| GET | `/api/v1/entitlements` | Own active entitlements |

Admin operations go through Payload (`/api/cms`) and custom admin endpoints under `/api/cms/custom/*` (import, test-builder validation, determination reset/override). All admin operations are permission-checked and audited.
