import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "labels_student_locales" ADD COLUMN "student_mock_tests_intro" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_mock_tests_exams_title" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_mock_tests_sections_by_level" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_mock_tests_sections_for" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_mock_tests_no_sections" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "labels_student_locales" DROP COLUMN "student_mock_tests_intro";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_mock_tests_exams_title";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_mock_tests_sections_by_level";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_mock_tests_sections_for";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_mock_tests_no_sections";`)
}
