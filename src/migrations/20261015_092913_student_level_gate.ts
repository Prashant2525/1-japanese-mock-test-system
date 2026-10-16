import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 10: the level gate. Students get assignedLevel (set only by the level-check service or an
 * audited override; deleting a level they hold is refused) and assignedAt; a label group for the
 * student area; the LEVEL_NOT_DETERMINED message label.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "labels_student" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "labels_student_locales" (
  	"student_nav_area" varchar,
  	"student_nav_home" varchar,
  	"student_nav_study" varchar,
  	"student_nav_mock_tests" varchar,
  	"student_nav_results" varchar,
  	"student_level_check_eyebrow" varchar,
  	"student_level_check_title" varchar,
  	"student_level_check_intro" varchar,
  	"student_level_check_rules_title" varchar,
  	"student_level_check_rule_start" varchar,
  	"student_level_check_rule_climb" varchar,
  	"student_level_check_rule_stop" varchar,
  	"student_level_check_rule_unlock" varchar,
  	"student_level_check_route_label" varchar,
  	"student_level_check_start" varchar,
  	"student_home_level_label" varchar,
  	"student_home_continue_title" varchar,
  	"student_home_study_body" varchar,
  	"student_home_mock_tests_body" varchar,
  	"student_home_results_body" varchar,
  	"student_study_empty" varchar,
  	"student_mock_tests_empty" varchar,
  	"student_results_empty" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "students" ADD COLUMN "assigned_level_id" integer;
  ALTER TABLE "students" ADD COLUMN "assigned_at" timestamp(3) with time zone;
  ALTER TABLE "labels_messages_locales" ADD COLUMN "errors_level_not_determined" varchar;
  ALTER TABLE "labels_student_locales" ADD CONSTRAINT "labels_student_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."labels_student"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "labels_student_locales_locale_parent_id_unique" ON "labels_student_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "students" ADD CONSTRAINT "students_assigned_level_id_levels_id_fk" FOREIGN KEY ("assigned_level_id") REFERENCES "public"."levels"("id") ON DELETE restrict ON UPDATE no action;
  CREATE INDEX "students_assigned_level_idx" ON "students" USING btree ("assigned_level_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "labels_student" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "labels_student_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "labels_student" CASCADE;
  DROP TABLE "labels_student_locales" CASCADE;
  ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_assigned_level_id_levels_id_fk";
  
  DROP INDEX IF EXISTS "students_assigned_level_idx";
  ALTER TABLE "students" DROP COLUMN "assigned_level_id";
  ALTER TABLE "students" DROP COLUMN "assigned_at";
  ALTER TABLE "labels_messages_locales" DROP COLUMN "errors_level_not_determined";`)
}
