import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 12: the study library. Material categories, study materials (drafts and versions) and
 * private learning media. Seeds the four launch categories in plain SQL (D-072):
 * Kanji 漢, Grammar 文, Reading 読, Listening 聴 (SM-R04; editable and extendable in the CMS).
 */
const CATEGORIES = [
  { key: 'kanji', symbol: '漢', order: 1, en: 'Kanji & vocabulary', ja: '漢字・語彙' },
  { key: 'grammar', symbol: '文', order: 2, en: 'Grammar', ja: '文法' },
  { key: 'reading', symbol: '読', order: 3, en: 'Reading', ja: '読解' },
  { key: 'listening', symbol: '聴', order: 4, en: 'Listening', ja: '聴解' },
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_study_materials_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__study_materials_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__study_materials_v_published_locale" AS ENUM('en', 'ja');
  CREATE TYPE "public"."enum_learning_media_kind" AS ENUM('image', 'audio', 'pdf');
  CREATE TABLE "material_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"symbol" varchar,
  	"order" numeric DEFAULT 1 NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "material_categories_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "study_materials_attachments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "study_materials_attachments_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "study_materials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"level_id" integer,
  	"category_id" integer,
  	"slug" varchar,
  	"order" numeric DEFAULT 1,
  	"archived" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_study_materials_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "study_materials_locales" (
  	"title" varchar,
  	"summary" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_study_materials_v_version_attachments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_study_materials_v_version_attachments_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_study_materials_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_level_id" integer,
  	"version_category_id" integer,
  	"version_slug" varchar,
  	"version_order" numeric DEFAULT 1,
  	"version_archived" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__study_materials_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__study_materials_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_study_materials_v_locales" (
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "learning_media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_learning_media_kind",
  	"duration_sec" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "learning_media_locales" (
  	"alt" varchar,
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "material_categories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "study_materials_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "learning_media_id" integer;
  ALTER TABLE "material_categories_locales" ADD CONSTRAINT "material_categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."material_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "study_materials_attachments" ADD CONSTRAINT "study_materials_attachments_media_id_learning_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."learning_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "study_materials_attachments" ADD CONSTRAINT "study_materials_attachments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."study_materials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "study_materials_attachments_locales" ADD CONSTRAINT "study_materials_attachments_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."study_materials_attachments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_level_id_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_category_id_material_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."material_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "study_materials_locales" ADD CONSTRAINT "study_materials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."study_materials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_study_materials_v_version_attachments" ADD CONSTRAINT "_study_materials_v_version_attachments_media_id_learning_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."learning_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_study_materials_v_version_attachments" ADD CONSTRAINT "_study_materials_v_version_attachments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_study_materials_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_study_materials_v_version_attachments_locales" ADD CONSTRAINT "_study_materials_v_version_attachments_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_study_materials_v_version_attachments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_study_materials_v" ADD CONSTRAINT "_study_materials_v_parent_id_study_materials_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."study_materials"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_study_materials_v" ADD CONSTRAINT "_study_materials_v_version_level_id_levels_id_fk" FOREIGN KEY ("version_level_id") REFERENCES "public"."levels"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_study_materials_v" ADD CONSTRAINT "_study_materials_v_version_category_id_material_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."material_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_study_materials_v_locales" ADD CONSTRAINT "_study_materials_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_study_materials_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "learning_media_locales" ADD CONSTRAINT "learning_media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."learning_media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "material_categories_key_idx" ON "material_categories" USING btree ("key");
  CREATE INDEX "material_categories_updated_at_idx" ON "material_categories" USING btree ("updated_at");
  CREATE INDEX "material_categories_created_at_idx" ON "material_categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "material_categories_locales_locale_parent_id_unique" ON "material_categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "study_materials_attachments_order_idx" ON "study_materials_attachments" USING btree ("_order");
  CREATE INDEX "study_materials_attachments_parent_id_idx" ON "study_materials_attachments" USING btree ("_parent_id");
  CREATE INDEX "study_materials_attachments_media_idx" ON "study_materials_attachments" USING btree ("media_id");
  CREATE UNIQUE INDEX "study_materials_attachments_locales_locale_parent_id_unique" ON "study_materials_attachments_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "study_materials_level_idx" ON "study_materials" USING btree ("level_id");
  CREATE INDEX "study_materials_category_idx" ON "study_materials" USING btree ("category_id");
  CREATE UNIQUE INDEX "study_materials_slug_idx" ON "study_materials" USING btree ("slug");
  CREATE INDEX "study_materials_updated_at_idx" ON "study_materials" USING btree ("updated_at");
  CREATE INDEX "study_materials_created_at_idx" ON "study_materials" USING btree ("created_at");
  CREATE INDEX "study_materials__status_idx" ON "study_materials" USING btree ("_status");
  CREATE UNIQUE INDEX "study_materials_locales_locale_parent_id_unique" ON "study_materials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_study_materials_v_version_attachments_order_idx" ON "_study_materials_v_version_attachments" USING btree ("_order");
  CREATE INDEX "_study_materials_v_version_attachments_parent_id_idx" ON "_study_materials_v_version_attachments" USING btree ("_parent_id");
  CREATE INDEX "_study_materials_v_version_attachments_media_idx" ON "_study_materials_v_version_attachments" USING btree ("media_id");
  CREATE UNIQUE INDEX "_study_materials_v_version_attachments_locales_locale_parent" ON "_study_materials_v_version_attachments_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_study_materials_v_parent_idx" ON "_study_materials_v" USING btree ("parent_id");
  CREATE INDEX "_study_materials_v_version_version_level_idx" ON "_study_materials_v" USING btree ("version_level_id");
  CREATE INDEX "_study_materials_v_version_version_category_idx" ON "_study_materials_v" USING btree ("version_category_id");
  CREATE INDEX "_study_materials_v_version_version_slug_idx" ON "_study_materials_v" USING btree ("version_slug");
  CREATE INDEX "_study_materials_v_version_version_updated_at_idx" ON "_study_materials_v" USING btree ("version_updated_at");
  CREATE INDEX "_study_materials_v_version_version_created_at_idx" ON "_study_materials_v" USING btree ("version_created_at");
  CREATE INDEX "_study_materials_v_version_version__status_idx" ON "_study_materials_v" USING btree ("version__status");
  CREATE INDEX "_study_materials_v_created_at_idx" ON "_study_materials_v" USING btree ("created_at");
  CREATE INDEX "_study_materials_v_updated_at_idx" ON "_study_materials_v" USING btree ("updated_at");
  CREATE INDEX "_study_materials_v_snapshot_idx" ON "_study_materials_v" USING btree ("snapshot");
  CREATE INDEX "_study_materials_v_published_locale_idx" ON "_study_materials_v" USING btree ("published_locale");
  CREATE INDEX "_study_materials_v_latest_idx" ON "_study_materials_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_study_materials_v_locales_locale_parent_id_unique" ON "_study_materials_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "learning_media_updated_at_idx" ON "learning_media" USING btree ("updated_at");
  CREATE INDEX "learning_media_created_at_idx" ON "learning_media" USING btree ("created_at");
  CREATE UNIQUE INDEX "learning_media_filename_idx" ON "learning_media" USING btree ("filename");
  CREATE UNIQUE INDEX "learning_media_locales_locale_parent_id_unique" ON "learning_media_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_material_categories_fk" FOREIGN KEY ("material_categories_id") REFERENCES "public"."material_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_study_materials_fk" FOREIGN KEY ("study_materials_id") REFERENCES "public"."study_materials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_learning_media_fk" FOREIGN KEY ("learning_media_id") REFERENCES "public"."learning_media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_material_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("material_categories_id");
  CREATE INDEX "payload_locked_documents_rels_study_materials_id_idx" ON "payload_locked_documents_rels" USING btree ("study_materials_id");
  CREATE INDEX "payload_locked_documents_rels_learning_media_id_idx" ON "payload_locked_documents_rels" USING btree ("learning_media_id");`)

  for (const c of CATEGORIES) {
    await db.execute(sql`
      WITH inserted AS (
        INSERT INTO "material_categories" ("key", "symbol", "order", "enabled")
        VALUES (${c.key}, ${c.symbol}, ${c.order}, true)
        RETURNING "id"
      )
      INSERT INTO "material_categories_locales" ("name", "_locale", "_parent_id")
      SELECT ${c.en}, 'en'::"_locales", "id" FROM inserted
      UNION ALL
      SELECT ${c.ja}, 'ja'::"_locales", "id" FROM inserted;
    `)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "material_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "material_categories_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "study_materials_attachments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "study_materials_attachments_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "study_materials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "study_materials_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_study_materials_v_version_attachments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_study_materials_v_version_attachments_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_study_materials_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_study_materials_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "learning_media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "learning_media_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "material_categories" CASCADE;
  DROP TABLE "material_categories_locales" CASCADE;
  DROP TABLE "study_materials_attachments" CASCADE;
  DROP TABLE "study_materials_attachments_locales" CASCADE;
  DROP TABLE "study_materials" CASCADE;
  DROP TABLE "study_materials_locales" CASCADE;
  DROP TABLE "_study_materials_v_version_attachments" CASCADE;
  DROP TABLE "_study_materials_v_version_attachments_locales" CASCADE;
  DROP TABLE "_study_materials_v" CASCADE;
  DROP TABLE "_study_materials_v_locales" CASCADE;
  DROP TABLE "learning_media" CASCADE;
  DROP TABLE "learning_media_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_material_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_study_materials_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_learning_media_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_material_categories_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_study_materials_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_learning_media_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "material_categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "study_materials_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "learning_media_id";
  DROP TYPE "public"."enum_study_materials_status";
  DROP TYPE "public"."enum__study_materials_v_version_status";
  DROP TYPE "public"."enum__study_materials_v_published_locale";
  DROP TYPE "public"."enum_learning_media_kind";`)
}
