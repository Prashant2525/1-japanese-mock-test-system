import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'

import { migrations } from '@/migrations'

import { logger } from './logger'

export type ReadinessReport = {
  ready: boolean
  checks: {
    database: 'ok' | 'error'
    migrations: 'ok' | 'pending' | 'error'
    pendingMigrations?: number
  }
}

/**
 * Readiness: the database answers and every migration shipped with this build is applied.
 * Reports states only — no hostnames, versions or error text (no secrets, TSR-10).
 */
export async function checkReadiness(): Promise<ReadinessReport> {
  const report: ReadinessReport = {
    ready: false,
    checks: { database: 'error', migrations: 'error' },
  }
  try {
    const payload = await getPayload({ config })
    await payload.db.drizzle.execute(sql`select 1`)
    report.checks.database = 'ok'

    const applied = await payload.find({
      collection: 'payload-migrations',
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })
    const appliedNames = new Set(applied.docs.map((d) => d.name))
    const pending = migrations.filter((m) => !appliedNames.has(m.name)).length
    report.checks.migrations = pending === 0 ? 'ok' : 'pending'
    if (pending > 0) report.checks.pendingMigrations = pending
  } catch (err) {
    logger.warn({ err }, 'readiness check failed')
  }
  report.ready = report.checks.database === 'ok' && report.checks.migrations === 'ok'
  return report
}
