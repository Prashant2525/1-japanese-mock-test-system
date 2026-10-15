import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_filters" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_level" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_category" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_all" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_count" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_none_for_filter" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_audio_count" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_pdf_count" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_image_count" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_back" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_files" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_open_pdf" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_download_pdf" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_pdf_title" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_audio_unsupported" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_filters";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_level";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_category";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_all";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_count";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_none_for_filter";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_audio_count";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_pdf_count";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_image_count";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_back";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_files";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_open_pdf";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_download_pdf";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_pdf_title";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_audio_unsupported";`)
}
