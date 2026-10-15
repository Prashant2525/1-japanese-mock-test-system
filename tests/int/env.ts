import { randomBytes } from 'node:crypto'
import { tmpdir } from 'node:os'
import path from 'node:path'

import 'dotenv/config'

/**
 * Integration tests always run against the separate test database, never development data.
 * Local default: the nihongo_mock_test database created by docker/compose.dev.yml.
 * CI sets TEST_DATABASE_URL to its Postgres service.
 */
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5433/nihongo_mock_test'
process.env.APP_URL = 'http://localhost:3000'
process.env.PAYLOAD_SECRET ??= randomBytes(32).toString('hex')
process.env.LOG_LEVEL = 'silent'
// Emails are captured in memory so tests can read verification and reset links.
process.env.EMAIL_TRANSPORT = 'memory'
// Tests send X-Forwarded-For to exercise per-IP rate limits.
process.env.TRUST_PROXY = 'true'
// Google sign-in is configured with throwaway values; tests replace Google's token endpoint.
process.env.GOOGLE_CLIENT_ID = 'int-test.apps.googleusercontent.com'
process.env.GOOGLE_CLIENT_SECRET = randomBytes(16).toString('hex')
// Uploaded test files go to a temporary folder, never the development media folder.
process.env.LEARNING_MEDIA_DIR = path.join(tmpdir(), 'nihongo-mock-int-media')
