import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

import { SUPER_ADMIN_ROLE, SYSTEM_ROLES } from '../server/auth/permissions'
import { DEFAULT_TEMPLATES, type EmailTemplateKey } from '../server/email/templates'

/**
 * Phase 7 data and infrastructure:
 * - `rate_limits` table for the PostgreSQL rate limiter (not a Payload collection).
 * - System roles (D-022): Super Admin, Content Editor, Support.
 * - Bilingual email template drafts (D-030, JA pending review under PA-6).
 * - Any existing admin without a role becomes Super Admin, so nobody is locked out.
 *
 * Data is written with plain SQL against the tables as they exist at this point. The Payload API
 * would use today's full configuration, which refers to tables later migrations create, and fail
 * on a fresh database (KI-26). Values outside this migration's enums are skipped.
 */
const textArray = (values: string[]) =>
  sql`ARRAY[${sql.join(
    values.map((v) => sql`${v}`),
    sql`, `,
  )}]::text[]`

export async function up({ db }: MigrateUpArgs): Promise<void> {
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
    await db.execute(sql`
      WITH inserted AS (
        INSERT INTO "roles" ("name", "description", "is_system")
        SELECT ${role.name}, ${role.description}, true
        WHERE NOT EXISTS (SELECT 1 FROM "roles" WHERE "name" = ${role.name})
        RETURNING "id"
      )
      INSERT INTO "roles_permissions" ("order", "parent_id", "value")
      SELECT p.ord, i."id", p.v::"enum_roles_permissions"
      FROM inserted i, unnest(${textArray(role.permissions)}) WITH ORDINALITY AS p(v, ord)
      WHERE p.v = ANY (enum_range(NULL::"enum_roles_permissions")::text[]);
    `)
  }

  for (const [key, locales] of Object.entries(DEFAULT_TEMPLATES) as [
    EmailTemplateKey,
    NonNullable<(typeof DEFAULT_TEMPLATES)[EmailTemplateKey]>,
  ][]) {
    const { en, ja } = locales
    await db.execute(sql`
      WITH inserted AS (
        INSERT INTO "email_templates" ("key")
        SELECT ${key}::"enum_email_templates_key"
        WHERE ${key} = ANY (enum_range(NULL::"enum_email_templates_key")::text[])
          AND NOT EXISTS (SELECT 1 FROM "email_templates" WHERE "key"::text = ${key})
        RETURNING "id"
      )
      INSERT INTO "email_templates_locales"
        ("subject", "body", "button_label", "footer", "_locale", "_parent_id")
      SELECT ${en.subject}, ${en.body}, ${en.buttonLabel}, ${en.footer}, 'en'::"_locales", "id" FROM inserted
      UNION ALL
      SELECT ${ja.subject}, ${ja.body}, ${ja.buttonLabel}, ${ja.footer}, 'ja'::"_locales", "id" FROM inserted;
    `)
  }

  await db.execute(sql`
    INSERT INTO "admins_rels" ("order", "parent_id", "path", "roles_id")
    SELECT 1, a."id", 'roles', r."id"
    FROM "admins" a
    CROSS JOIN (
      SELECT "id" FROM "roles" WHERE "name" = ${SUPER_ADMIN_ROLE} AND "is_system" LIMIT 1
    ) r
    WHERE NOT EXISTS (
      SELECT 1 FROM "admins_rels" x WHERE x."parent_id" = a."id" AND x."path" = 'roles'
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "email_templates";
    DELETE FROM "admins_rels" WHERE "path" = 'roles';
    DELETE FROM "roles";
    DROP TABLE IF EXISTS "rate_limits";
  `)
}
