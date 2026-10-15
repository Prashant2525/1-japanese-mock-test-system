import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * D-092: the Super Admin system role also stores the new delete permissions (it always holds every
 * key in code; the stored list is kept in step). Separate from the migration that added the enum
 * values: PostgreSQL cannot use a new enum value in the transaction that created it. Plain SQL
 * (KI-26). Other roles get them only when a Super Admin adds them in the CMS.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    INSERT INTO "roles_permissions" ("order", "parent_id", "value")
    SELECT
      (SELECT COALESCE(MAX(rp."order"), 0) FROM "roles_permissions" rp WHERE rp."parent_id" = r."id") + v.n,
      r."id",
      v.value::"enum_roles_permissions"
    FROM "roles" r
    CROSS JOIN (VALUES (1, 'materials.delete'), (2, 'media.delete'), (3, 'questions.delete')) AS v(n, value)
    WHERE r."name" = 'Super Admin' AND r."is_system" = true
      AND NOT EXISTS (
        SELECT 1 FROM "roles_permissions" x
        WHERE x."parent_id" = r."id" AND x."value" = v.value::"enum_roles_permissions"
      );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "roles_permissions"
    WHERE "value" IN ('materials.delete', 'media.delete', 'questions.delete');
  `)
}
