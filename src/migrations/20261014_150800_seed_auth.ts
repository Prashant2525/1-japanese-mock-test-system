import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

import { SUPER_ADMIN_ROLE, SYSTEM_ROLES } from '../server/auth/permissions'
import { DEFAULT_TEMPLATES, type EmailTemplateKey } from '../server/email/templates'

/**
 * Phase 7 data and infrastructure:
 * - `rate_limits` table for the PostgreSQL rate limiter (not a Payload collection).
 * - System roles (D-022): Super Admin, Content Editor, Support.
 * - Bilingual email template drafts (D-030, JA pending review under PA-6).
 * - Any existing admin without a role becomes Super Admin, so nobody is locked out.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "rate_limits" (
      "key" varchar(64) NOT NULL,
      "window_start" timestamp(3) with time zone NOT NULL,
      "count" integer NOT NULL DEFAULT 1,
      PRIMARY KEY ("key", "window_start")
    );
    CREATE INDEX IF NOT EXISTS "rate_limits_window_start_idx" ON "rate_limits" ("window_start");
  `)

  for (const role of SYSTEM_ROLES) {
    const existing = await payload.find({
      collection: 'roles',
      where: { name: { equals: role.name } },
      limit: 1,
      depth: 0,
      req,
    })
    if (existing.docs[0]) continue
    const created = await payload.create({
      collection: 'roles',
      data: { name: role.name, description: role.description, permissions: role.permissions },
      req,
    })
    // isSystem is not writable through the API, even with overrideAccess field rules; set it directly.
    await payload.db.updateOne({
      collection: 'roles',
      id: created.id,
      data: { isSystem: true },
      req,
    })
  }

  for (const [key, locales] of Object.entries(DEFAULT_TEMPLATES) as [
    EmailTemplateKey,
    NonNullable<(typeof DEFAULT_TEMPLATES)[EmailTemplateKey]>,
  ][]) {
    const existing = await payload.find({
      collection: 'email-templates',
      where: { key: { equals: key } },
      limit: 1,
      depth: 0,
      req,
    })
    if (existing.docs[0]) continue
    const doc = await payload.create({
      collection: 'email-templates',
      locale: 'en',
      data: { key, ...locales.en },
      req,
    })
    await payload.update({
      collection: 'email-templates',
      id: doc.id,
      locale: 'ja',
      data: { ...locales.ja },
      req,
    })
  }

  const superRole = await payload.find({
    collection: 'roles',
    where: { name: { equals: SUPER_ADMIN_ROLE } },
    limit: 1,
    depth: 0,
    req,
  })
  const superId = superRole.docs[0]?.id
  if (superId !== undefined) {
    await db.execute(sql`
      INSERT INTO "admins_rels" ("order", "parent_id", "path", "roles_id")
      SELECT 1, a."id", 'roles', ${superId}
      FROM "admins" a
      WHERE NOT EXISTS (
        SELECT 1 FROM "admins_rels" r WHERE r."parent_id" = a."id" AND r."path" = 'roles'
      );
    `)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "email_templates";
    DELETE FROM "admins_rels" WHERE "path" = 'roles';
    DELETE FROM "roles";
    DROP TABLE IF EXISTS "rate_limits";
  `)
}
