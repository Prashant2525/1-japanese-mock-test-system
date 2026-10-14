# Domain module

Pure TypeScript exam rules: level-determination progression, threshold comparison, scoring and section minimums, deadline and grace calculation, eligibility, and the payment state machine.

Rules (docs/ARCHITECTURE.md §2):
- No imports from Next.js, React, Payload, Drizzle, `pg` or Node I/O. ESLint enforces this (`eslint.config.mjs`).
- Functions take plain data and return plain data; services in `src/server/services` load and persist it.
- Every branch is covered by unit tests in `tests/unit/domain`.

First modules arrive with Phase 10–11 (level determination).
