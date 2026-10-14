import { randomBytes } from 'node:crypto'

import 'dotenv/config'

/**
 * Integration tests always run against the separate test database, never development data.
 * Local default: the nihongo_mock_test database created by docker/compose.dev.yml.
 * CI sets TEST_DATABASE_URL to its Postgres service.
 */
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5433/nihongo_mock_test'
process.env.APP_URL ??= 'http://localhost:3000'
process.env.PAYLOAD_SECRET ??= randomBytes(32).toString('hex')
process.env.LOG_LEVEL = 'silent'
