import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 11: the level check. Questions (core bank), level-check settings with published versions,
 * sessions, attempts, results, result items and level assignments. Below the generated SQL, the
 * database-level guards from DATABASE_ARCHITECTURE §1 / §3.6–3.7:
 * - one running level check per student; one attempt per stage (race-safe even if two requests
 *   arrive at the same moment);
 * - a sequence for stable question IDs (Q-000001…);
 * - indexes for the expiry check and the results list.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_questions_options_key" AS ENUM('A', 'B', 'C', 'D', 'E', 'F');
  CREATE TYPE "public"."enum_questions_correct_option_key" AS ENUM('A', 'B', 'C', 'D', 'E', 'F');
  CREATE TYPE "public"."enum_questions_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__questions_v_version_options_key" AS ENUM('A', 'B', 'C', 'D', 'E', 'F');
  CREATE TYPE "public"."enum__questions_v_version_correct_option_key" AS ENUM('A', 'B', 'C', 'D', 'E', 'F');
  CREATE TYPE "public"."enum__questions_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__questions_v_published_locale" AS ENUM('en', 'ja');
  CREATE TYPE "public"."enum_level_check_sessions_status" AS ENUM('in_progress', 'completed', 'reset');
  CREATE TYPE "public"."enum_attempts_kind" AS ENUM('determination', 'mock');
  CREATE TYPE "public"."enum_attempts_status" AS ENUM('in_progress', 'submitted');
  CREATE TYPE "public"."enum_attempts_submit_reason" AS ENUM('manual', 'timeout');
  CREATE TYPE "public"."enum_results_kind" AS ENUM('determination', 'mock');
  CREATE TYPE "public"."enum_level_assignments_source" AS ENUM('determination', 'override', 'reset');
  CREATE TYPE "public"."enum_level_check_settings_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__level_check_settings_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__level_check_settings_v_published_locale" AS ENUM('en', 'ja');
  CREATE TABLE "questions_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" "enum_questions_options_key",
  	"text" varchar
  );
  
  CREATE TABLE "questions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"exam_type_id" integer,
  	"level_id" integer,
  	"stem" varchar,
  	"correct_option_key" "enum_questions_correct_option_key",
  	"marks" numeric DEFAULT 1,
  	"rights_confirmed" boolean DEFAULT false,
  	"archived" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_questions_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "questions_locales" (
  	"explanation" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_questions_v_version_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" "enum__questions_v_version_options_key",
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_questions_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_key" varchar,
  	"version_exam_type_id" integer,
  	"version_level_id" integer,
  	"version_stem" varchar,
  	"version_correct_option_key" "enum__questions_v_version_correct_option_key",
  	"version_marks" numeric DEFAULT 1,
  	"version_rights_confirmed" boolean DEFAULT false,
  	"version_archived" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__questions_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__questions_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_questions_v_locales" (
  	"version_explanation" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "level_check_versions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_no" numeric NOT NULL,
  	"published_at" timestamp(3) with time zone NOT NULL,
  	"published_by_id" integer,
  	"snapshot" jsonb NOT NULL,
  	"checksum" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "level_check_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"student_id" integer NOT NULL,
  	"config_version_id" integer NOT NULL,
  	"status" "enum_level_check_sessions_status" NOT NULL,
  	"current_stage_index" numeric DEFAULT 0 NOT NULL,
  	"stage_outcomes" jsonb,
  	"assigned_level_id" integer,
  	"completed_at" timestamp(3) with time zone,
  	"reset_at" timestamp(3) with time zone,
  	"reset_by_id" integer,
  	"reset_reason" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "attempts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"student_id" integer NOT NULL,
  	"kind" "enum_attempts_kind" NOT NULL,
  	"determination_session_id" integer,
  	"stage_index" numeric,
  	"status" "enum_attempts_status" NOT NULL,
  	"started_at" timestamp(3) with time zone NOT NULL,
  	"deadline_at" timestamp(3) with time zone NOT NULL,
  	"submitted_at" timestamp(3) with time zone,
  	"submit_reason" "enum_attempts_submit_reason",
  	"session_id" varchar,
  	"answers" jsonb,
  	"last_seq" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "results" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"attempt_id" integer NOT NULL,
  	"student_id" integer NOT NULL,
  	"kind" "enum_results_kind" NOT NULL,
  	"exam_code" varchar,
  	"level_code" varchar,
  	"title_snapshot" jsonb,
  	"total_questions" numeric NOT NULL,
  	"correct" numeric NOT NULL,
  	"incorrect" numeric NOT NULL,
  	"unanswered" numeric NOT NULL,
  	"total_marks" numeric NOT NULL,
  	"earned_marks" numeric NOT NULL,
  	"percent" numeric NOT NULL,
  	"passed" boolean DEFAULT false NOT NULL,
  	"threshold_percent" numeric,
  	"scoring_version" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "result_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"result_id" integer NOT NULL,
  	"order" numeric NOT NULL,
  	"question_key" varchar NOT NULL,
  	"selected_option_key" varchar,
  	"correct_option_key" varchar NOT NULL,
  	"is_correct" boolean DEFAULT false NOT NULL,
  	"marks" numeric NOT NULL,
  	"earned" numeric NOT NULL,
  	"flagged" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "level_assignments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"student_id" integer NOT NULL,
  	"level_id" integer,
  	"source" "enum_level_assignments_source" NOT NULL,
  	"session_id" integer,
  	"reason" varchar,
  	"actor_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "level_check_settings_stages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"level_id" integer,
  	"threshold_percent" numeric DEFAULT 60,
  	"duration_minutes" numeric DEFAULT 20
  );
  
  CREATE TABLE "level_check_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_status" "enum_level_check_settings_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "level_check_settings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"questions_id" integer
  );
  
  CREATE TABLE "_level_check_settings_v_version_stages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"level_id" integer,
  	"threshold_percent" numeric DEFAULT 60,
  	"duration_minutes" numeric DEFAULT 20,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_level_check_settings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version__status" "enum__level_check_settings_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__level_check_settings_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_level_check_settings_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"questions_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "questions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "level_check_versions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "level_check_sessions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "attempts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "results_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "result_items_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "level_assignments_id" integer;
  ALTER TABLE "questions_options" ADD CONSTRAINT "questions_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "questions" ADD CONSTRAINT "questions_exam_type_id_exam_types_id_fk" FOREIGN KEY ("exam_type_id") REFERENCES "public"."exam_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "questions" ADD CONSTRAINT "questions_level_id_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "questions_locales" ADD CONSTRAINT "questions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_questions_v_version_options" ADD CONSTRAINT "_questions_v_version_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_questions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_questions_v" ADD CONSTRAINT "_questions_v_parent_id_questions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."questions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_questions_v" ADD CONSTRAINT "_questions_v_version_exam_type_id_exam_types_id_fk" FOREIGN KEY ("version_exam_type_id") REFERENCES "public"."exam_types"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_questions_v" ADD CONSTRAINT "_questions_v_version_level_id_levels_id_fk" FOREIGN KEY ("version_level_id") REFERENCES "public"."levels"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_questions_v_locales" ADD CONSTRAINT "_questions_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_questions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "level_check_versions" ADD CONSTRAINT "level_check_versions_published_by_id_admins_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "level_check_sessions" ADD CONSTRAINT "level_check_sessions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "level_check_sessions" ADD CONSTRAINT "level_check_sessions_config_version_id_level_check_versions_id_fk" FOREIGN KEY ("config_version_id") REFERENCES "public"."level_check_versions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "level_check_sessions" ADD CONSTRAINT "level_check_sessions_assigned_level_id_levels_id_fk" FOREIGN KEY ("assigned_level_id") REFERENCES "public"."levels"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "level_check_sessions" ADD CONSTRAINT "level_check_sessions_reset_by_id_admins_id_fk" FOREIGN KEY ("reset_by_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "attempts" ADD CONSTRAINT "attempts_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "attempts" ADD CONSTRAINT "attempts_determination_session_id_level_check_sessions_id_fk" FOREIGN KEY ("determination_session_id") REFERENCES "public"."level_check_sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "results" ADD CONSTRAINT "results_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "results" ADD CONSTRAINT "results_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "result_items" ADD CONSTRAINT "result_items_result_id_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."results"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "level_assignments" ADD CONSTRAINT "level_assignments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "level_assignments" ADD CONSTRAINT "level_assignments_level_id_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "level_assignments" ADD CONSTRAINT "level_assignments_session_id_level_check_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."level_check_sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "level_assignments" ADD CONSTRAINT "level_assignments_actor_id_admins_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "level_check_settings_stages" ADD CONSTRAINT "level_check_settings_stages_level_id_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "level_check_settings_stages" ADD CONSTRAINT "level_check_settings_stages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."level_check_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "level_check_settings_rels" ADD CONSTRAINT "level_check_settings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."level_check_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "level_check_settings_rels" ADD CONSTRAINT "level_check_settings_rels_questions_fk" FOREIGN KEY ("questions_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_level_check_settings_v_version_stages" ADD CONSTRAINT "_level_check_settings_v_version_stages_level_id_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_level_check_settings_v_version_stages" ADD CONSTRAINT "_level_check_settings_v_version_stages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_level_check_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_level_check_settings_v_rels" ADD CONSTRAINT "_level_check_settings_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_level_check_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_level_check_settings_v_rels" ADD CONSTRAINT "_level_check_settings_v_rels_questions_fk" FOREIGN KEY ("questions_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "questions_options_order_idx" ON "questions_options" USING btree ("_order");
  CREATE INDEX "questions_options_parent_id_idx" ON "questions_options" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "questions_key_idx" ON "questions" USING btree ("key");
  CREATE INDEX "questions_exam_type_idx" ON "questions" USING btree ("exam_type_id");
  CREATE INDEX "questions_level_idx" ON "questions" USING btree ("level_id");
  CREATE INDEX "questions_updated_at_idx" ON "questions" USING btree ("updated_at");
  CREATE INDEX "questions_created_at_idx" ON "questions" USING btree ("created_at");
  CREATE INDEX "questions__status_idx" ON "questions" USING btree ("_status");
  CREATE UNIQUE INDEX "questions_locales_locale_parent_id_unique" ON "questions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_questions_v_version_options_order_idx" ON "_questions_v_version_options" USING btree ("_order");
  CREATE INDEX "_questions_v_version_options_parent_id_idx" ON "_questions_v_version_options" USING btree ("_parent_id");
  CREATE INDEX "_questions_v_parent_idx" ON "_questions_v" USING btree ("parent_id");
  CREATE INDEX "_questions_v_version_version_key_idx" ON "_questions_v" USING btree ("version_key");
  CREATE INDEX "_questions_v_version_version_exam_type_idx" ON "_questions_v" USING btree ("version_exam_type_id");
  CREATE INDEX "_questions_v_version_version_level_idx" ON "_questions_v" USING btree ("version_level_id");
  CREATE INDEX "_questions_v_version_version_updated_at_idx" ON "_questions_v" USING btree ("version_updated_at");
  CREATE INDEX "_questions_v_version_version_created_at_idx" ON "_questions_v" USING btree ("version_created_at");
  CREATE INDEX "_questions_v_version_version__status_idx" ON "_questions_v" USING btree ("version__status");
  CREATE INDEX "_questions_v_created_at_idx" ON "_questions_v" USING btree ("created_at");
  CREATE INDEX "_questions_v_updated_at_idx" ON "_questions_v" USING btree ("updated_at");
  CREATE INDEX "_questions_v_snapshot_idx" ON "_questions_v" USING btree ("snapshot");
  CREATE INDEX "_questions_v_published_locale_idx" ON "_questions_v" USING btree ("published_locale");
  CREATE INDEX "_questions_v_latest_idx" ON "_questions_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_questions_v_locales_locale_parent_id_unique" ON "_questions_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "level_check_versions_version_no_idx" ON "level_check_versions" USING btree ("version_no");
  CREATE INDEX "level_check_versions_published_by_idx" ON "level_check_versions" USING btree ("published_by_id");
  CREATE INDEX "level_check_versions_updated_at_idx" ON "level_check_versions" USING btree ("updated_at");
  CREATE INDEX "level_check_versions_created_at_idx" ON "level_check_versions" USING btree ("created_at");
  CREATE INDEX "level_check_sessions_student_idx" ON "level_check_sessions" USING btree ("student_id");
  CREATE INDEX "level_check_sessions_config_version_idx" ON "level_check_sessions" USING btree ("config_version_id");
  CREATE INDEX "level_check_sessions_status_idx" ON "level_check_sessions" USING btree ("status");
  CREATE INDEX "level_check_sessions_assigned_level_idx" ON "level_check_sessions" USING btree ("assigned_level_id");
  CREATE INDEX "level_check_sessions_reset_by_idx" ON "level_check_sessions" USING btree ("reset_by_id");
  CREATE INDEX "level_check_sessions_updated_at_idx" ON "level_check_sessions" USING btree ("updated_at");
  CREATE INDEX "level_check_sessions_created_at_idx" ON "level_check_sessions" USING btree ("created_at");
  CREATE INDEX "attempts_student_idx" ON "attempts" USING btree ("student_id");
  CREATE INDEX "attempts_determination_session_idx" ON "attempts" USING btree ("determination_session_id");
  CREATE INDEX "attempts_deadline_at_idx" ON "attempts" USING btree ("deadline_at");
  CREATE INDEX "attempts_updated_at_idx" ON "attempts" USING btree ("updated_at");
  CREATE INDEX "attempts_created_at_idx" ON "attempts" USING btree ("created_at");
  CREATE UNIQUE INDEX "results_attempt_idx" ON "results" USING btree ("attempt_id");
  CREATE INDEX "results_student_idx" ON "results" USING btree ("student_id");
  CREATE INDEX "results_updated_at_idx" ON "results" USING btree ("updated_at");
  CREATE INDEX "results_created_at_idx" ON "results" USING btree ("created_at");
  CREATE INDEX "result_items_result_idx" ON "result_items" USING btree ("result_id");
  CREATE INDEX "result_items_updated_at_idx" ON "result_items" USING btree ("updated_at");
  CREATE INDEX "result_items_created_at_idx" ON "result_items" USING btree ("created_at");
  CREATE INDEX "level_assignments_student_idx" ON "level_assignments" USING btree ("student_id");
  CREATE INDEX "level_assignments_level_idx" ON "level_assignments" USING btree ("level_id");
  CREATE INDEX "level_assignments_session_idx" ON "level_assignments" USING btree ("session_id");
  CREATE INDEX "level_assignments_actor_idx" ON "level_assignments" USING btree ("actor_id");
  CREATE INDEX "level_assignments_updated_at_idx" ON "level_assignments" USING btree ("updated_at");
  CREATE INDEX "level_assignments_created_at_idx" ON "level_assignments" USING btree ("created_at");
  CREATE INDEX "level_check_settings_stages_order_idx" ON "level_check_settings_stages" USING btree ("_order");
  CREATE INDEX "level_check_settings_stages_parent_id_idx" ON "level_check_settings_stages" USING btree ("_parent_id");
  CREATE INDEX "level_check_settings_stages_level_idx" ON "level_check_settings_stages" USING btree ("level_id");
  CREATE INDEX "level_check_settings__status_idx" ON "level_check_settings" USING btree ("_status");
  CREATE INDEX "level_check_settings_rels_order_idx" ON "level_check_settings_rels" USING btree ("order");
  CREATE INDEX "level_check_settings_rels_parent_idx" ON "level_check_settings_rels" USING btree ("parent_id");
  CREATE INDEX "level_check_settings_rels_path_idx" ON "level_check_settings_rels" USING btree ("path");
  CREATE INDEX "level_check_settings_rels_questions_id_idx" ON "level_check_settings_rels" USING btree ("questions_id");
  CREATE INDEX "_level_check_settings_v_version_stages_order_idx" ON "_level_check_settings_v_version_stages" USING btree ("_order");
  CREATE INDEX "_level_check_settings_v_version_stages_parent_id_idx" ON "_level_check_settings_v_version_stages" USING btree ("_parent_id");
  CREATE INDEX "_level_check_settings_v_version_stages_level_idx" ON "_level_check_settings_v_version_stages" USING btree ("level_id");
  CREATE INDEX "_level_check_settings_v_version_version__status_idx" ON "_level_check_settings_v" USING btree ("version__status");
  CREATE INDEX "_level_check_settings_v_created_at_idx" ON "_level_check_settings_v" USING btree ("created_at");
  CREATE INDEX "_level_check_settings_v_updated_at_idx" ON "_level_check_settings_v" USING btree ("updated_at");
  CREATE INDEX "_level_check_settings_v_snapshot_idx" ON "_level_check_settings_v" USING btree ("snapshot");
  CREATE INDEX "_level_check_settings_v_published_locale_idx" ON "_level_check_settings_v" USING btree ("published_locale");
  CREATE INDEX "_level_check_settings_v_latest_idx" ON "_level_check_settings_v" USING btree ("latest");
  CREATE INDEX "_level_check_settings_v_rels_order_idx" ON "_level_check_settings_v_rels" USING btree ("order");
  CREATE INDEX "_level_check_settings_v_rels_parent_idx" ON "_level_check_settings_v_rels" USING btree ("parent_id");
  CREATE INDEX "_level_check_settings_v_rels_path_idx" ON "_level_check_settings_v_rels" USING btree ("path");
  CREATE INDEX "_level_check_settings_v_rels_questions_id_idx" ON "_level_check_settings_v_rels" USING btree ("questions_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_questions_fk" FOREIGN KEY ("questions_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_level_check_versions_fk" FOREIGN KEY ("level_check_versions_id") REFERENCES "public"."level_check_versions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_level_check_sessions_fk" FOREIGN KEY ("level_check_sessions_id") REFERENCES "public"."level_check_sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_attempts_fk" FOREIGN KEY ("attempts_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_results_fk" FOREIGN KEY ("results_id") REFERENCES "public"."results"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_result_items_fk" FOREIGN KEY ("result_items_id") REFERENCES "public"."result_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_level_assignments_fk" FOREIGN KEY ("level_assignments_id") REFERENCES "public"."level_assignments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_questions_id_idx" ON "payload_locked_documents_rels" USING btree ("questions_id");
  CREATE INDEX "payload_locked_documents_rels_level_check_versions_id_idx" ON "payload_locked_documents_rels" USING btree ("level_check_versions_id");
  CREATE INDEX "payload_locked_documents_rels_level_check_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("level_check_sessions_id");
  CREATE INDEX "payload_locked_documents_rels_attempts_id_idx" ON "payload_locked_documents_rels" USING btree ("attempts_id");
  CREATE INDEX "payload_locked_documents_rels_results_id_idx" ON "payload_locked_documents_rels" USING btree ("results_id");
  CREATE INDEX "payload_locked_documents_rels_result_items_id_idx" ON "payload_locked_documents_rels" USING btree ("result_items_id");
  CREATE INDEX "payload_locked_documents_rels_level_assignments_id_idx" ON "payload_locked_documents_rels" USING btree ("level_assignments_id");`)

  await db.execute(sql`
    CREATE SEQUENCE IF NOT EXISTS "question_key_seq" START 1;
    CREATE UNIQUE INDEX "level_check_sessions_one_running" ON "level_check_sessions" ("student_id")
      WHERE "status" = 'in_progress';
    CREATE UNIQUE INDEX "attempts_one_per_stage" ON "attempts" ("determination_session_id", "stage_index")
      WHERE "kind" = 'determination';
    CREATE INDEX "attempts_status_deadline_idx" ON "attempts" ("status", "deadline_at");
    CREATE INDEX "results_student_created_idx" ON "results" ("student_id", "created_at" DESC);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP SEQUENCE IF EXISTS "question_key_seq";`)
  await db.execute(sql`
   ALTER TABLE "questions_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "questions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "questions_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_questions_v_version_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_questions_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_questions_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "level_check_versions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "level_check_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "attempts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "results" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "result_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "level_assignments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "level_check_settings_stages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "level_check_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "level_check_settings_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_level_check_settings_v_version_stages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_level_check_settings_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_level_check_settings_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "questions_options" CASCADE;
  DROP TABLE "questions" CASCADE;
  DROP TABLE "questions_locales" CASCADE;
  DROP TABLE "_questions_v_version_options" CASCADE;
  DROP TABLE "_questions_v" CASCADE;
  DROP TABLE "_questions_v_locales" CASCADE;
  DROP TABLE "level_check_versions" CASCADE;
  DROP TABLE "level_check_sessions" CASCADE;
  DROP TABLE "attempts" CASCADE;
  DROP TABLE "results" CASCADE;
  DROP TABLE "result_items" CASCADE;
  DROP TABLE "level_assignments" CASCADE;
  DROP TABLE "level_check_settings_stages" CASCADE;
  DROP TABLE "level_check_settings" CASCADE;
  DROP TABLE "level_check_settings_rels" CASCADE;
  DROP TABLE "_level_check_settings_v_version_stages" CASCADE;
  DROP TABLE "_level_check_settings_v" CASCADE;
  DROP TABLE "_level_check_settings_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_questions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_level_check_versions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_level_check_sessions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_attempts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_results_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_result_items_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_level_assignments_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_questions_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_level_check_versions_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_level_check_sessions_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_attempts_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_results_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_result_items_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_level_assignments_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "questions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "level_check_versions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "level_check_sessions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "attempts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "results_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "result_items_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "level_assignments_id";
  DROP TYPE "public"."enum_questions_options_key";
  DROP TYPE "public"."enum_questions_correct_option_key";
  DROP TYPE "public"."enum_questions_status";
  DROP TYPE "public"."enum__questions_v_version_options_key";
  DROP TYPE "public"."enum__questions_v_version_correct_option_key";
  DROP TYPE "public"."enum__questions_v_version_status";
  DROP TYPE "public"."enum__questions_v_published_locale";
  DROP TYPE "public"."enum_level_check_sessions_status";
  DROP TYPE "public"."enum_attempts_kind";
  DROP TYPE "public"."enum_attempts_status";
  DROP TYPE "public"."enum_attempts_submit_reason";
  DROP TYPE "public"."enum_results_kind";
  DROP TYPE "public"."enum_level_assignments_source";
  DROP TYPE "public"."enum_level_check_settings_status";
  DROP TYPE "public"."enum__level_check_settings_v_version_status";
  DROP TYPE "public"."enum__level_check_settings_v_published_locale";`)
}
