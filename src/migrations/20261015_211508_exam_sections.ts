import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "exam_sections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"exam_type_id" integer NOT NULL,
  	"key" varchar NOT NULL,
  	"order" numeric DEFAULT 1 NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "exam_sections_locales" (
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "exam_sections_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"levels_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "exam_sections_id" integer;
  ALTER TABLE "exam_sections" ADD CONSTRAINT "exam_sections_exam_type_id_exam_types_id_fk" FOREIGN KEY ("exam_type_id") REFERENCES "public"."exam_types"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "exam_sections_locales" ADD CONSTRAINT "exam_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."exam_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exam_sections_rels" ADD CONSTRAINT "exam_sections_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exam_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exam_sections_rels" ADD CONSTRAINT "exam_sections_rels_levels_fk" FOREIGN KEY ("levels_id") REFERENCES "public"."levels"("id") ON DELETE restrict ON UPDATE no action;
  CREATE INDEX "exam_sections_exam_type_idx" ON "exam_sections" USING btree ("exam_type_id");
  CREATE INDEX "exam_sections_key_idx" ON "exam_sections" USING btree ("key");
  CREATE INDEX "exam_sections_updated_at_idx" ON "exam_sections" USING btree ("updated_at");
  CREATE INDEX "exam_sections_created_at_idx" ON "exam_sections" USING btree ("created_at");
  CREATE UNIQUE INDEX "examType_key_idx" ON "exam_sections" USING btree ("exam_type_id","key");
  CREATE UNIQUE INDEX "exam_sections_locales_locale_parent_id_unique" ON "exam_sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "exam_sections_rels_order_idx" ON "exam_sections_rels" USING btree ("order");
  CREATE INDEX "exam_sections_rels_parent_idx" ON "exam_sections_rels" USING btree ("parent_id");
  CREATE INDEX "exam_sections_rels_path_idx" ON "exam_sections_rels" USING btree ("path");
  CREATE INDEX "exam_sections_rels_levels_id_idx" ON "exam_sections_rels" USING btree ("levels_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_exam_sections_fk" FOREIGN KEY ("exam_sections_id") REFERENCES "public"."exam_sections"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_exam_sections_id_idx" ON "payload_locked_documents_rels" USING btree ("exam_sections_id");
  -- Seed (Phase 13, D-103): default sections from the official exam guides (JLPT jlpt.jp test
  -- sections; JFT-Basic Japan Foundation; NAT-TEST mirrors JLPT). Editable in the CMS; NAT 1Q/2Q
  -- to be confirmed by the owner (EX-1). Plain SQL, not the Payload API (KI-26).
  INSERT INTO "exam_sections" ("exam_type_id", "key", "order", "enabled")
    SELECT id, 'knowledge-reading', 1, true FROM "exam_types" WHERE code = 'JLPT';
  INSERT INTO "exam_sections_locales" ("name", "_locale", "_parent_id")
    SELECT v.name, v.locale::"_locales", s.id
    FROM "exam_sections" s JOIN "exam_types" e ON e.id = s.exam_type_id
    CROSS JOIN (VALUES ('Language Knowledge (Vocabulary/Grammar)・Reading', 'en'), ('言語知識（文字・語彙・文法）・読解', 'ja')) AS v(name, locale)
    WHERE e.code = 'JLPT' AND s.key = 'knowledge-reading';
  INSERT INTO "exam_sections_rels" ("order", "parent_id", "path", "levels_id")
    SELECT row_number() OVER (ORDER BY l."order"), s.id, 'levels', l.id
    FROM "exam_sections" s JOIN "exam_types" e ON e.id = s.exam_type_id
    JOIN "levels" l ON l.exam_type_id = e.id AND l.code IN ('N1', 'N2')
    WHERE e.code = 'JLPT' AND s.key = 'knowledge-reading';
  INSERT INTO "exam_sections" ("exam_type_id", "key", "order", "enabled")
    SELECT id, 'vocabulary', 1, true FROM "exam_types" WHERE code = 'JLPT';
  INSERT INTO "exam_sections_locales" ("name", "_locale", "_parent_id")
    SELECT v.name, v.locale::"_locales", s.id
    FROM "exam_sections" s JOIN "exam_types" e ON e.id = s.exam_type_id
    CROSS JOIN (VALUES ('Language Knowledge (Vocabulary)', 'en'), ('言語知識（文字・語彙）', 'ja')) AS v(name, locale)
    WHERE e.code = 'JLPT' AND s.key = 'vocabulary';
  INSERT INTO "exam_sections_rels" ("order", "parent_id", "path", "levels_id")
    SELECT row_number() OVER (ORDER BY l."order"), s.id, 'levels', l.id
    FROM "exam_sections" s JOIN "exam_types" e ON e.id = s.exam_type_id
    JOIN "levels" l ON l.exam_type_id = e.id AND l.code IN ('N3', 'N4', 'N5')
    WHERE e.code = 'JLPT' AND s.key = 'vocabulary';
  INSERT INTO "exam_sections" ("exam_type_id", "key", "order", "enabled")
    SELECT id, 'grammar-reading', 2, true FROM "exam_types" WHERE code = 'JLPT';
  INSERT INTO "exam_sections_locales" ("name", "_locale", "_parent_id")
    SELECT v.name, v.locale::"_locales", s.id
    FROM "exam_sections" s JOIN "exam_types" e ON e.id = s.exam_type_id
    CROSS JOIN (VALUES ('Language Knowledge (Grammar)・Reading', 'en'), ('言語知識（文法）・読解', 'ja')) AS v(name, locale)
    WHERE e.code = 'JLPT' AND s.key = 'grammar-reading';
  INSERT INTO "exam_sections_rels" ("order", "parent_id", "path", "levels_id")
    SELECT row_number() OVER (ORDER BY l."order"), s.id, 'levels', l.id
    FROM "exam_sections" s JOIN "exam_types" e ON e.id = s.exam_type_id
    JOIN "levels" l ON l.exam_type_id = e.id AND l.code IN ('N3', 'N4', 'N5')
    WHERE e.code = 'JLPT' AND s.key = 'grammar-reading';
  INSERT INTO "exam_sections" ("exam_type_id", "key", "order", "enabled")
    SELECT id, 'listening', 3, true FROM "exam_types" WHERE code = 'JLPT';
  INSERT INTO "exam_sections_locales" ("name", "_locale", "_parent_id")
    SELECT v.name, v.locale::"_locales", s.id
    FROM "exam_sections" s JOIN "exam_types" e ON e.id = s.exam_type_id
    CROSS JOIN (VALUES ('Listening', 'en'), ('聴解', 'ja')) AS v(name, locale)
    WHERE e.code = 'JLPT' AND s.key = 'listening';
  INSERT INTO "exam_sections" ("exam_type_id", "key", "order", "enabled")
    SELECT id, 'vocabulary', 1, true FROM "exam_types" WHERE code = 'NAT';
  INSERT INTO "exam_sections_locales" ("name", "_locale", "_parent_id")
    SELECT v.name, v.locale::"_locales", s.id
    FROM "exam_sections" s JOIN "exam_types" e ON e.id = s.exam_type_id
    CROSS JOIN (VALUES ('Vocabulary', 'en'), ('文字・語彙', 'ja')) AS v(name, locale)
    WHERE e.code = 'NAT' AND s.key = 'vocabulary';
  INSERT INTO "exam_sections" ("exam_type_id", "key", "order", "enabled")
    SELECT id, 'grammar-reading', 2, true FROM "exam_types" WHERE code = 'NAT';
  INSERT INTO "exam_sections_locales" ("name", "_locale", "_parent_id")
    SELECT v.name, v.locale::"_locales", s.id
    FROM "exam_sections" s JOIN "exam_types" e ON e.id = s.exam_type_id
    CROSS JOIN (VALUES ('Grammar・Reading', 'en'), ('文法・読解', 'ja')) AS v(name, locale)
    WHERE e.code = 'NAT' AND s.key = 'grammar-reading';
  INSERT INTO "exam_sections" ("exam_type_id", "key", "order", "enabled")
    SELECT id, 'listening', 3, true FROM "exam_types" WHERE code = 'NAT';
  INSERT INTO "exam_sections_locales" ("name", "_locale", "_parent_id")
    SELECT v.name, v.locale::"_locales", s.id
    FROM "exam_sections" s JOIN "exam_types" e ON e.id = s.exam_type_id
    CROSS JOIN (VALUES ('Listening', 'en'), ('聴解', 'ja')) AS v(name, locale)
    WHERE e.code = 'NAT' AND s.key = 'listening';
  INSERT INTO "exam_sections" ("exam_type_id", "key", "order", "enabled")
    SELECT id, 'script-vocabulary', 1, true FROM "exam_types" WHERE code = 'JFT';
  INSERT INTO "exam_sections_locales" ("name", "_locale", "_parent_id")
    SELECT v.name, v.locale::"_locales", s.id
    FROM "exam_sections" s JOIN "exam_types" e ON e.id = s.exam_type_id
    CROSS JOIN (VALUES ('Script and Vocabulary', 'en'), ('文字と語彙', 'ja')) AS v(name, locale)
    WHERE e.code = 'JFT' AND s.key = 'script-vocabulary';
  INSERT INTO "exam_sections" ("exam_type_id", "key", "order", "enabled")
    SELECT id, 'conversation-expression', 2, true FROM "exam_types" WHERE code = 'JFT';
  INSERT INTO "exam_sections_locales" ("name", "_locale", "_parent_id")
    SELECT v.name, v.locale::"_locales", s.id
    FROM "exam_sections" s JOIN "exam_types" e ON e.id = s.exam_type_id
    CROSS JOIN (VALUES ('Conversation and Expression', 'en'), ('会話と表現', 'ja')) AS v(name, locale)
    WHERE e.code = 'JFT' AND s.key = 'conversation-expression';
  INSERT INTO "exam_sections" ("exam_type_id", "key", "order", "enabled")
    SELECT id, 'listening', 3, true FROM "exam_types" WHERE code = 'JFT';
  INSERT INTO "exam_sections_locales" ("name", "_locale", "_parent_id")
    SELECT v.name, v.locale::"_locales", s.id
    FROM "exam_sections" s JOIN "exam_types" e ON e.id = s.exam_type_id
    CROSS JOIN (VALUES ('Listening Comprehension', 'en'), ('聴解', 'ja')) AS v(name, locale)
    WHERE e.code = 'JFT' AND s.key = 'listening';
  INSERT INTO "exam_sections" ("exam_type_id", "key", "order", "enabled")
    SELECT id, 'reading', 4, true FROM "exam_types" WHERE code = 'JFT';
  INSERT INTO "exam_sections_locales" ("name", "_locale", "_parent_id")
    SELECT v.name, v.locale::"_locales", s.id
    FROM "exam_sections" s JOIN "exam_types" e ON e.id = s.exam_type_id
    CROSS JOIN (VALUES ('Reading Comprehension', 'en'), ('読解', 'ja')) AS v(name, locale)
    WHERE e.code = 'JFT' AND s.key = 'reading';
`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "exam_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "exam_sections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "exam_sections_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "exam_sections" CASCADE;
  DROP TABLE "exam_sections_locales" CASCADE;
  DROP TABLE "exam_sections_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_exam_sections_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_exam_sections_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "exam_sections_id";`)
}
