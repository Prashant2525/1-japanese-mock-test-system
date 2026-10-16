import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "labels_dashboard" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "labels_dashboard_locales" (
  	"dashboard_level_label" varchar,
  	"dashboard_eyebrow" varchar,
  	"dashboard_greeting" varchar,
  	"dashboard_lead" varchar,
  	"dashboard_continue_cta" varchar,
  	"dashboard_start_cta" varchar,
  	"dashboard_library_cta" varchar,
  	"dashboard_tests_cta" varchar,
  	"dashboard_level_by_check" varchar,
  	"dashboard_level_by_staff" varchar,
  	"dashboard_stats_label" varchar,
  	"dashboard_stat_studied" varchar,
  	"dashboard_of_total" varchar,
  	"dashboard_stat_studied_help" varchar,
  	"dashboard_stat_last_studied" varchar,
  	"dashboard_not_yet" varchar,
  	"dashboard_stat_last_studied_help" varchar,
  	"dashboard_stat_level_check" varchar,
  	"dashboard_stat_level_check_help" varchar,
  	"dashboard_progress_title" varchar,
  	"dashboard_progress_help" varchar,
  	"dashboard_no_materials" varchar,
  	"dashboard_progress_note" varchar,
  	"dashboard_next_title" varchar,
  	"dashboard_continue_tag" varchar,
  	"dashboard_all_studied" varchar,
  	"dashboard_library_link" varchar,
  	"dashboard_tests_title" varchar,
  	"dashboard_tests_help" varchar,
  	"dashboard_tests_link" varchar,
  	"dashboard_levels_count" varchar,
  	"dashboard_recent_title" varchar,
  	"dashboard_recent_link" varchar,
  	"profile_eyebrow" varchar,
  	"profile_title" varchar,
  	"profile_account_title" varchar,
  	"profile_name" varchar,
  	"profile_email" varchar,
  	"profile_language" varchar,
  	"profile_joined" varchar,
  	"profile_sign_in" varchar,
  	"profile_sign_in_email" varchar,
  	"profile_sign_in_email_google" varchar,
  	"profile_level_title" varchar,
  	"profile_level_set" varchar,
  	"profile_level_fixed" varchar,
  	"profile_level_result" varchar,
  	"profile_source_check" varchar,
  	"profile_source_staff" varchar,
  	"profile_source_reset" varchar,
  	"profile_history_title" varchar,
  	"profile_security_title" varchar,
  	"profile_password" varchar,
  	"profile_password_help" varchar,
  	"profile_password_action" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_nav_profile" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_nav_your_level" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_progress_title" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_progress_help" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_mark_studied" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_studied" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_undo_studied" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_study_progress_failed" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_results_intro" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_results_col_test" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_results_col_score" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_results_col_outcome" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_results_col_date" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_results_level_check_stage" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_results_percent" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_results_passed" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_results_not_passed" varchar;
  ALTER TABLE "labels_dashboard_locales" ADD CONSTRAINT "labels_dashboard_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."labels_dashboard"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "labels_dashboard_locales_locale_parent_id_unique" ON "labels_dashboard_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "labels_dashboard" CASCADE;
  DROP TABLE "labels_dashboard_locales" CASCADE;
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_nav_profile";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_nav_your_level";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_progress_title";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_progress_help";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_mark_studied";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_studied";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_undo_studied";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_study_progress_failed";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_results_intro";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_results_col_test";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_results_col_score";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_results_col_outcome";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_results_col_date";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_results_level_check_stage";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_results_percent";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_results_passed";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_results_not_passed";`)
}
