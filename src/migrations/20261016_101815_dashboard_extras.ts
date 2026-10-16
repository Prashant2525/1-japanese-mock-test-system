import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Plans belong to their student (CASCADE on the required link); existing studied materials get a
// first-studied time so they count for streaks and milestones (plain SQL, KI-26).
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "study_plans" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"student_id" integer NOT NULL,
  	"date" varchar NOT NULL,
  	"note" varchar NOT NULL,
  	"done" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "students" ADD COLUMN "daily_goal" numeric DEFAULT 1;
  ALTER TABLE "study_progress" ADD COLUMN "first_studied_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "study_plans_id" integer;
  ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "study_plans_student_idx" ON "study_plans" USING btree ("student_id");
  CREATE INDEX "study_plans_updated_at_idx" ON "study_plans" USING btree ("updated_at");
  CREATE INDEX "study_plans_created_at_idx" ON "study_plans" USING btree ("created_at");
  CREATE INDEX "student_date_idx" ON "study_plans" USING btree ("student_id","date");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_study_plans_fk" FOREIGN KEY ("study_plans_id") REFERENCES "public"."study_plans"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_study_plans_id_idx" ON "payload_locked_documents_rels" USING btree ("study_plans_id");
  -- Materials already marked as studied count from the time they were marked (D-110).
  UPDATE "study_progress" SET "first_studied_at" = "studied_at" WHERE "studied_at" IS NOT NULL AND "first_studied_at" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "study_plans" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "study_plans" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_study_plans_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_study_plans_id_idx";
  ALTER TABLE "students" DROP COLUMN "daily_goal";
  ALTER TABLE "study_progress" DROP COLUMN "first_studied_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "study_plans_id";`)
}
