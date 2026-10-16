import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Progress belongs to its student and material: if a material is deleted (D-092), its progress
// rows go with it (CASCADE instead of Payload's SET NULL on these required links).
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "study_progress" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"student_id" integer NOT NULL,
  	"material_id" integer NOT NULL,
  	"first_opened_at" timestamp(3) with time zone NOT NULL,
  	"last_opened_at" timestamp(3) with time zone NOT NULL,
  	"studied_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "study_progress_id" integer;
  ALTER TABLE "study_progress" ADD CONSTRAINT "study_progress_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "study_progress" ADD CONSTRAINT "study_progress_material_id_study_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."study_materials"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "study_progress_student_idx" ON "study_progress" USING btree ("student_id");
  CREATE INDEX "study_progress_material_idx" ON "study_progress" USING btree ("material_id");
  CREATE INDEX "study_progress_last_opened_at_idx" ON "study_progress" USING btree ("last_opened_at");
  CREATE INDEX "study_progress_updated_at_idx" ON "study_progress" USING btree ("updated_at");
  CREATE INDEX "study_progress_created_at_idx" ON "study_progress" USING btree ("created_at");
  CREATE UNIQUE INDEX "student_material_idx" ON "study_progress" USING btree ("student_id","material_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_study_progress_fk" FOREIGN KEY ("study_progress_id") REFERENCES "public"."study_progress"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_study_progress_id_idx" ON "payload_locked_documents_rels" USING btree ("study_progress_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "study_progress" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "study_progress" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_study_progress_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_study_progress_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "study_progress_id";`)
}
