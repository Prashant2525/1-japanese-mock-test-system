/**
 * Creates the E2E database if it does not exist and brings it to the latest migration.
 * Runs once per test run (from playwright.config.ts), before the app server starts.
 */
import { execSync } from 'node:child_process'

import pg from 'pg'

async function main() {
  const url = new URL(process.env.DATABASE_URL!)
  const name = decodeURIComponent(url.pathname.slice(1))
  if (!/^[a-z0-9_]+$/.test(name)) throw new Error(`unexpected E2E database name: ${name}`)
  const server = new URL(url)
  server.pathname = '/postgres'
  const client = new pg.Client({ connectionString: server.toString() })
  await client.connect()
  try {
    const found = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name])
    if (!found.rowCount) await client.query(`CREATE DATABASE "${name}"`)
  } finally {
    await client.end()
  }
  execSync('pnpm --silent payload migrate', { stdio: 'inherit', env: process.env })
}

main().then(
  () => {
    process.exitCode = 0
  },
  (err) => {
    console.error(err)
    process.exitCode = 1
  },
)
