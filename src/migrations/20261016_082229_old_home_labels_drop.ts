import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "labels_student_locales" DROP COLUMN "student_home_level_label";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_home_continue_title";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_home_study_body";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_home_mock_tests_body";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_home_results_body";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "labels_student_locales" ADD COLUMN "student_home_level_label" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_home_continue_title" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_home_study_body" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_home_mock_tests_body" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_home_results_body" varchar;`)
}
