import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "labels_site_locales" ADD COLUMN "nav_menu" varchar;
  ALTER TABLE "labels_site_locales" ADD COLUMN "home_signed_in_lead" varchar;
  ALTER TABLE "labels_site_locales" ADD COLUMN "home_cta_my_page" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "labels_site_locales" DROP COLUMN "nav_menu";
  ALTER TABLE "labels_site_locales" DROP COLUMN "home_signed_in_lead";
  ALTER TABLE "labels_site_locales" DROP COLUMN "home_cta_my_page";`)
}
