import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "labels_exam" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "labels_exam_locales" (
  	"exam_stage_label" varchar,
  	"exam_question_of" varchar,
  	"exam_time_left" varchar,
  	"exam_time_left_aria" varchar,
  	"exam_previous" varchar,
  	"exam_next" varchar,
  	"exam_flag" varchar,
  	"exam_unflag" varchar,
  	"exam_palette" varchar,
  	"exam_palette_item" varchar,
  	"exam_answered" varchar,
  	"exam_unanswered" varchar,
  	"exam_flagged_state" varchar,
  	"exam_review" varchar,
  	"exam_review_title" varchar,
  	"exam_review_body" varchar,
  	"exam_review_flagged" varchar,
  	"exam_review_unanswered" varchar,
  	"exam_keep_working" varchar,
  	"exam_submit" varchar,
  	"exam_saving" varchar,
  	"exam_saved" varchar,
  	"exam_not_saved" varchar,
  	"exam_time_up" varchar,
  	"exam_stale_title" varchar,
  	"exam_stale_body" varchar,
  	"exam_continue_here" varchar,
  	"exam_loading" varchar,
  	"exam_load_error" varchar,
  	"exam_retry" varchar,
  	"exam_stage_passed_title" varchar,
  	"exam_stage_passed_body" varchar,
  	"exam_start_next" varchar,
  	"exam_stage_info" varchar,
  	"exam_answer_option" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_level_check_ready" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_level_check_continue" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_level_check_in_progress" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_your_level_title" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_your_level_lead" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_your_level_beginner_lead" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_your_level_stages_title" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_your_level_passed" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_your_level_not_passed" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_your_level_score" varchar;
  ALTER TABLE "labels_student_locales" ADD COLUMN "student_your_level_go_home" varchar;
  ALTER TABLE "labels_exam_locales" ADD CONSTRAINT "labels_exam_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."labels_exam"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "labels_exam_locales_locale_parent_id_unique" ON "labels_exam_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "labels_exam" CASCADE;
  DROP TABLE "labels_exam_locales" CASCADE;
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_level_check_ready";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_level_check_continue";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_level_check_in_progress";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_your_level_title";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_your_level_lead";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_your_level_beginner_lead";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_your_level_stages_title";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_your_level_passed";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_your_level_not_passed";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_your_level_score";
  ALTER TABLE "labels_student_locales" DROP COLUMN "student_your_level_go_home";`)
}
