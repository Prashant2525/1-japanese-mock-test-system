# API Documentation — Nihongo Mock

**Status:** Phase 4 conventions and planned endpoint catalogue (2026-10-14). Payloads and examples are filled in as each endpoint is implemented and tested. Endpoints marked *(planned)* do not exist yet.

---

## 1. Surfaces

| Surface | Base path | Consumers | Auth |
|---|---|---|---|
| Domain API | `/api/v1` | Student web UI; future mobile clients (D-025) | Student session cookie (or bearer token for future mobile) |
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
- **CSRF:** cookie-authenticated mutations require same-origin requests (an `Origin`/`Sec-Fetch-Site` check) plus `SameSite=Lax` cookies.

## 3. Error model

```json
{ "error": { "code": "ATTEMPT_CLOSED", "message": "This test has ended. Your answers were submitted.", "details": null, "requestId": "req_01J..." } }
```

| HTTP | Codes (initial set) |
|---|---|
| 400 | `VALIDATION_FAILED` (details: field errors) |
| 401 | `UNAUTHENTICATED`, `SESSION_EXPIRED` |
| 403 | `FORBIDDEN`, `LEVEL_NOT_DETERMINED`, `EMAIL_NOT_VERIFIED`, `NOT_ENTITLED`, `LEVEL_NOT_AVAILABLE` |
| 404 | `NOT_FOUND` (also used instead of 403 for other users' resources, to avoid leaking existence) |
| 409 | `STALE_SESSION`, `ATTEMPT_ALREADY_ACTIVE`, `ATTEMPT_LIMIT_REACHED`, `ALREADY_FINALIZED`, `STAGE_OUT_OF_ORDER`, `ORDER_STATE_CONFLICT` |
| 410 | `ATTEMPT_CLOSED` |
| 422 | `PAYMENT_VERIFICATION_FAILED`, `AMOUNT_MISMATCH` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL` (no internal details) |

`message` is localized from UI labels; clients should switch on `code`.

## 4. Endpoint catalogue (planned)

### Auth (Phase 7)
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/auth/register` | Create a student and send verification (non-enumerating response) |
| POST | `/api/v1/auth/verify` | Verify an email token |
| POST | `/api/v1/auth/resend-verification` | Rate-limited |
| POST | `/api/v1/auth/login` | Sets the session cookie |
| POST | `/api/v1/auth/logout` | Revokes the session |
| POST | `/api/v1/auth/forgot-password` · `/reset-password` | Generic responses; single-use token |
| GET | `/api/v1/me` | Profile, `determinationStatus`, `assignedLevel`, `preferredLocale` |
| PATCH | `/api/v1/me/preferences` | `preferredLocale` |

### Level determination (Phases 10–11)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/determination` | Current session: stages (enabled levels), current stage, status |
| POST | `/api/v1/determination/start` | Starts at N5 (no level parameter accepted) |
| POST | `/api/v1/determination/stages/current/attempt` | Creates/resumes the current stage attempt |
| GET | `/api/v1/determination/summary` | "Your level" summary after completion |

### Attempts (shared runner — Phase 16)
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/attempts` | Start a mock-test attempt `{ mockTestId }` (Idempotency-Key) |
| POST | `/api/v1/attempts/{id}/resume` | Rotate `sessionId` (latest tab wins) |
| GET | `/api/v1/attempts/{id}` | Questions (no correctness data), saved answers, flags, `deadlineAt`, `serverNow` |
| PUT | `/api/v1/attempts/{id}/answers/{questionKey}` | `{ optionKey \| null, flagged, seq, sessionId }` |
| POST | `/api/v1/attempts/{id}/submit` | Manual submit (idempotent) → `{ resultId }` |

### Results (Phase 17)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/results` | Own history (mock + determination), filters, pagination |
| GET | `/api/v1/results/{id}` | Summary + sections |
| GET | `/api/v1/results/{id}/review` | Per-question review from the snapshot; filter `all\|incorrect\|flagged` |

### Catalogue and study (Phases 12–13, 18)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/catalogue/exams` | Enabled exam types and levels |
| GET | `/api/v1/mock-tests` | Published tests; filters `exam`, `level`, `free`; includes the student's entitlement status when logged in |
| GET | `/api/v1/mock-tests/{slug}` | Test detail (no questions) |
| GET | `/api/v1/study/materials` | Eligible materials (current and lower levels), filters `level`, `category` |
| GET | `/api/v1/study/materials/{slug}` | Material with signed media URLs |
| POST | `/api/v1/contact` | Contact form (rate-limited) |

### Commerce and payments (Phases 19–23)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/products` | Active products/bundles with server prices |
| POST | `/api/v1/orders` | `{ productId }` → server-priced order (Idempotency-Key) |
| GET | `/api/v1/orders` · `/{id}` | Own orders and status |
| POST | `/api/v1/orders/{id}/pay` | `{ provider }` → provider initiation data/redirect |
| GET/POST | `/api/v1/payments/{provider}/callback` | Provider return/notification; verified server-side; never trusted alone |
| GET | `/api/v1/entitlements` | Own active entitlements |

Admin operations go through Payload (`/api/cms`) and custom admin endpoints under `/api/cms/custom/*` (import, test-builder validation, determination reset/override). All admin operations are permission-checked and audited.
