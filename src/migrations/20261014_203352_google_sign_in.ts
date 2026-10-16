import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "sign_in_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"google_enabled" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "students" ADD COLUMN "google_sub" varchar;
  ALTER TABLE "labels_accounts_locales" ADD COLUMN "auth_google_continue" varchar;
  ALTER TABLE "labels_accounts_locales" ADD COLUMN "auth_google_or" varchar;
  ALTER TABLE "labels_accounts_locales" ADD COLUMN "auth_google_errors_cancelled" varchar;
  ALTER TABLE "labels_accounts_locales" ADD COLUMN "auth_google_errors_expired" varchar;
  ALTER TABLE "labels_accounts_locales" ADD COLUMN "auth_google_errors_failed" varchar;
  ALTER TABLE "labels_accounts_locales" ADD COLUMN "auth_google_errors_disabled" varchar;
  ALTER TABLE "labels_accounts_locales" ADD COLUMN "auth_google_errors_unavailable" varchar;
  ALTER TABLE "labels_accounts_locales" ADD COLUMN "auth_google_errors_rate_limited" varchar;
  CREATE UNIQUE INDEX "students_google_sub_idx" ON "students" USING btree ("google_sub");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sign_in_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "sign_in_settings" CASCADE;
  DROP INDEX IF EXISTS "students_google_sub_idx";
  ALTER TABLE "students" DROP COLUMN "google_sub";
  ALTER TABLE "labels_accounts_locales" DROP COLUMN "auth_google_continue";
  ALTER TABLE "labels_accounts_locales" DROP COLUMN "auth_google_or";
  ALTER TABLE "labels_accounts_locales" DROP COLUMN "auth_google_errors_cancelled";
  ALTER TABLE "labels_accounts_locales" DROP COLUMN "auth_google_errors_expired";
  ALTER TABLE "labels_accounts_locales" DROP COLUMN "auth_google_errors_failed";
  ALTER TABLE "labels_accounts_locales" DROP COLUMN "auth_google_errors_disabled";
  ALTER TABLE "labels_accounts_locales" DROP COLUMN "auth_google_errors_unavailable";
  ALTER TABLE "labels_accounts_locales" DROP COLUMN "auth_google_errors_rate_limited";`)
}
