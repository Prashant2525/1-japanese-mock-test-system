import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_download" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_pdf_loading" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_pdf_failed" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_pdf_pages" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_search" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_search_button" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_clear_search" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_download";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_pdf_loading";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_pdf_failed";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_pdf_pages";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_search";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_search_button";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_clear_search";`)
}
