import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

import { SEED_EXAM_TYPES, SEED_LEVELS } from '../server/catalogue/seed'

/**
 * Phase 9: exam catalogue (D-014). Creates exam_types and levels, then seeds JLPT, NAT and JFT.
 * Levels and exam types are never deleted (history refers to them), so the foreign keys
 * RESTRICT deletion at the database level too, instead of Payload's default SET NULL.
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "exam_types" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"order" numeric DEFAULT 1 NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "exam_types_locales" (
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"non_affiliation_notice" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "levels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"exam_type_id" integer NOT NULL,
  	"code" varchar NOT NULL,
  	"order" numeric NOT NULL,
  	"equivalent_jlpt_id" integer,
  	"enabled_for_mock_tests" boolean DEFAULT false,
  	"enabled_for_determination" boolean DEFAULT false,
  	"enabled_for_study" boolean DEFAULT false,
  	"line_color" varchar DEFAULT '#2B6BD8' NOT NULL,
  	"badge_color" varchar DEFAULT '#1F56B8' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "levels_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "exam_types_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "levels_id" integer;
  ALTER TABLE "exam_types_locales" ADD CONSTRAINT "exam_types_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."exam_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "levels" ADD CONSTRAINT "levels_exam_type_id_exam_types_id_fk" FOREIGN KEY ("exam_type_id") REFERENCES "public"."exam_types"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "levels" ADD CONSTRAINT "levels_equivalent_jlpt_id_levels_id_fk" FOREIGN KEY ("equivalent_jlpt_id") REFERENCES "public"."levels"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "levels_locales" ADD CONSTRAINT "levels_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."levels"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "exam_types_code_idx" ON "exam_types" USING btree ("code");
  CREATE INDEX "exam_types_updated_at_idx" ON "exam_types" USING btree ("updated_at");
  CREATE INDEX "exam_types_created_at_idx" ON "exam_types" USING btree ("created_at");
  CREATE UNIQUE INDEX "exam_types_locales_locale_parent_id_unique" ON "exam_types_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "levels_exam_type_idx" ON "levels" USING btree ("exam_type_id");
  CREATE INDEX "levels_equivalent_jlpt_idx" ON "levels" USING btree ("equivalent_jlpt_id");
  CREATE INDEX "levels_updated_at_idx" ON "levels" USING btree ("updated_at");
  CREATE INDEX "levels_created_at_idx" ON "levels" USING btree ("created_at");
  CREATE UNIQUE INDEX "examType_code_idx" ON "levels" USING btree ("exam_type_id","code");
  CREATE UNIQUE INDEX "levels_locales_locale_parent_id_unique" ON "levels_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_exam_types_fk" FOREIGN KEY ("exam_types_id") REFERENCES "public"."exam_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_levels_fk" FOREIGN KEY ("levels_id") REFERENCES "public"."levels"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_exam_types_id_idx" ON "payload_locked_documents_rels" USING btree ("exam_types_id");
  CREATE INDEX "payload_locked_documents_rels_levels_id_idx" ON "payload_locked_documents_rels" USING btree ("levels_id");`)

  const typeIds = new Map<string, number>()
  for (const type of SEED_EXAM_TYPES) {
    const created = await payload.create({
      collection: 'exam-types',
      locale: 'en',
      data: {
        code: type.code,
        order: type.order,
        enabled: true,
        name: type.name.en,
        description: type.description.en,
        nonAffiliationNotice: type.nonAffiliationNotice.en,
      },
      req,
    })
    await payload.update({
      collection: 'exam-types',
      id: created.id,
      locale: 'ja',
      data: {
        name: type.name.ja,
        description: type.description.ja,
        nonAffiliationNotice: type.nonAffiliationNotice.ja,
      },
      req,
    })
    typeIds.set(type.code, created.id)
  }

  const jlptIds = new Map<string, number>()
  for (const level of SEED_LEVELS) {
    const created = await payload.create({
      collection: 'levels',
      locale: 'en',
      data: {
        examType: typeIds.get(level.examType)!,
        code: level.code,
        order: level.order,
        name: level.name.en,
        equivalentJlpt: level.equivalentJlpt ? jlptIds.get(level.equivalentJlpt) : undefined,
        lineColor: level.lineColor,
        badgeColor: level.badgeColor,
        enabledForMockTests: level.enabledForMockTests,
        enabledForDetermination: level.enabledForDetermination,
        enabledForStudy: level.enabledForStudy,
      },
      req,
    })
    await payload.update({
      collection: 'levels',
      id: created.id,
      locale: 'ja',
      data: { name: level.name.ja },
      req,
    })
    if (level.examType === 'JLPT') jlptIds.set(level.code, created.id)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "exam_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "exam_types_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "levels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "levels_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "exam_types" CASCADE;
  DROP TABLE "exam_types_locales" CASCADE;
  DROP TABLE "levels" CASCADE;
  DROP TABLE "levels_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_exam_types_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_levels_fk";
  
  DROP INDEX "payload_locked_documents_rels_exam_types_id_idx";
  DROP INDEX "payload_locked_documents_rels_levels_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "exam_types_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "levels_id";`)
}
