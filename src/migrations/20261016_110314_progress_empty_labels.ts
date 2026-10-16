import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "labels_progress_locales" ADD COLUMN "progress_streak_start" varchar;
  ALTER TABLE "labels_progress_locales" ADD COLUMN "progress_week_empty" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "labels_progress_locales" DROP COLUMN "progress_streak_start";
  ALTER TABLE "labels_progress_locales" DROP COLUMN "progress_week_empty";`)
}
