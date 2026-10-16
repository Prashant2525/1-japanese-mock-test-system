import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "labels_progress" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "labels_progress_locales" (
  	"progress_streak" varchar,
  	"progress_days" varchar,
  	"progress_streak_keep" varchar,
  	"progress_streak_longest" varchar,
  	"progress_goal_today" varchar,
  	"progress_goal_change" varchar,
  	"progress_goal_met" varchar,
  	"progress_goal_help" varchar,
  	"progress_calendar_title" varchar,
  	"progress_calendar_help" varchar,
  	"progress_previous_month" varchar,
  	"progress_next_month" varchar,
  	"progress_today" varchar,
  	"progress_day_studied" varchar,
  	"progress_day_planned" varchar,
  	"progress_day_plans" varchar,
  	"progress_legend_studied" varchar,
  	"progress_legend_planned" varchar,
  	"progress_plan_add" varchar,
  	"progress_plan_placeholder" varchar,
  	"progress_plan_note" varchar,
  	"progress_plan_done" varchar,
  	"progress_plan_remove" varchar,
  	"progress_plan_empty" varchar,
  	"progress_plan_failed" varchar,
  	"progress_plan_full" varchar,
  	"progress_week_title" varchar,
  	"progress_week_help" varchar,
  	"progress_week_day" varchar,
  	"progress_week_actions" varchar,
  	"progress_week_tooltip" varchar,
  	"progress_milestones_title" varchar,
  	"progress_milestones_none" varchar,
  	"progress_milestones_next" varchar,
  	"progress_milestone_first_material" varchar,
  	"progress_milestone_materials10" varchar,
  	"progress_milestone_materials25" varchar,
  	"progress_milestone_materials50" varchar,
  	"progress_milestone_level_check" varchar,
  	"progress_milestone_streak3" varchar,
  	"progress_milestone_streak7" varchar,
  	"progress_milestone_streak30" varchar,
  	"progress_milestone_goal_met" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "labels_progress_locales" ADD CONSTRAINT "labels_progress_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."labels_progress"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "labels_progress_locales_locale_parent_id_unique" ON "labels_progress_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "labels_progress" CASCADE;
  DROP TABLE "labels_progress_locales" CASCADE;`)
}
