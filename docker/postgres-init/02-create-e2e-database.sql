-- Separate database for browser (E2E) tests so test accounts and content never reach development
-- data. Existing setups get it automatically from tests/e2e/prepare-db.ts.
CREATE DATABASE nihongo_mock_e2e;
