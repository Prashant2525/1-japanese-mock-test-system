import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_admins_status" AS ENUM('active', 'disabled');
  CREATE TYPE "public"."enum_admins_preferred_locale" AS ENUM('en', 'ja');
  CREATE TYPE "public"."enum_roles_permissions" AS ENUM('admins.read', 'admins.manage', 'roles.manage', 'students.read', 'students.update', 'students.reset_determination', 'students.override_level', 'audit.read', 'settings.manage', 'content.manage', 'content.publish', 'catalogue.manage', 'materials.manage', 'materials.publish', 'media.manage', 'media.upload_svg', 'questions.manage', 'questions.publish', 'questions.import', 'tests.manage', 'tests.publish', 'determination.manage', 'determination.publish', 'results.read', 'products.manage', 'orders.read', 'payments.read', 'support.read');
  CREATE TYPE "public"."enum_students_preferred_locale" AS ENUM('en', 'ja');
  CREATE TYPE "public"."enum_students_status" AS ENUM('active', 'suspended');
  CREATE TYPE "public"."enum_students_determination_status" AS ENUM('not_started', 'in_progress', 'completed');
  CREATE TYPE "public"."enum_audit_events_actor_type" AS ENUM('admin', 'student', 'system');
  CREATE TYPE "public"."enum_email_templates_key" AS ENUM('verify_email', 'reset_password', 'admin_reset_password', 'contact_notification', 'order_receipt');
  CREATE TABLE "admins_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"roles_id" integer
  );
  
  CREATE TABLE "roles_permissions" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_roles_permissions",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "roles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"is_system" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "students_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "students" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"preferred_locale" "enum_students_preferred_locale" DEFAULT 'en' NOT NULL,
  	"status" "enum_students_status" DEFAULT 'active' NOT NULL,
  	"determination_status" "enum_students_determination_status" DEFAULT 'not_started' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"_verified" boolean,
  	"_verificationtoken" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "audit_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"actor_type" "enum_audit_events_actor_type" NOT NULL,
  	"actor_id" varchar,
  	"action" varchar NOT NULL,
  	"entity_type" varchar NOT NULL,
  	"entity_id" varchar,
  	"summary" varchar,
  	"before" jsonb,
  	"after" jsonb,
  	"ip" varchar,
  	"user_agent" varchar,
  	"request_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "email_templates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" "enum_email_templates_key" NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "email_templates_locales" (
  	"subject" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"button_label" varchar,
  	"footer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "admins" ADD COLUMN "status" "enum_admins_status" DEFAULT 'active' NOT NULL;
  ALTER TABLE "admins" ADD COLUMN "preferred_locale" "enum_admins_preferred_locale" DEFAULT 'en' NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "roles_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "students_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "audit_events_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "email_templates_id" integer;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "students_id" integer;
  ALTER TABLE "admins_rels" ADD CONSTRAINT "admins_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "admins_rels" ADD CONSTRAINT "admins_rels_roles_fk" FOREIGN KEY ("roles_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "roles_permissions" ADD CONSTRAINT "roles_permissions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "students_sessions" ADD CONSTRAINT "students_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "email_templates_locales" ADD CONSTRAINT "email_templates_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."email_templates"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "admins_rels_order_idx" ON "admins_rels" USING btree ("order");
  CREATE INDEX "admins_rels_parent_idx" ON "admins_rels" USING btree ("parent_id");
  CREATE INDEX "admins_rels_path_idx" ON "admins_rels" USING btree ("path");
  CREATE INDEX "admins_rels_roles_id_idx" ON "admins_rels" USING btree ("roles_id");
  CREATE INDEX "roles_permissions_order_idx" ON "roles_permissions" USING btree ("order");
  CREATE INDEX "roles_permissions_parent_idx" ON "roles_permissions" USING btree ("parent_id");
  CREATE UNIQUE INDEX "roles_name_idx" ON "roles" USING btree ("name");
  CREATE INDEX "roles_updated_at_idx" ON "roles" USING btree ("updated_at");
  CREATE INDEX "roles_created_at_idx" ON "roles" USING btree ("created_at");
  CREATE INDEX "students_sessions_order_idx" ON "students_sessions" USING btree ("_order");
  CREATE INDEX "students_sessions_parent_id_idx" ON "students_sessions" USING btree ("_parent_id");
  CREATE INDEX "students_updated_at_idx" ON "students" USING btree ("updated_at");
  CREATE INDEX "students_created_at_idx" ON "students" USING btree ("created_at");
  CREATE UNIQUE INDEX "students_email_idx" ON "students" USING btree ("email");
  CREATE INDEX "audit_events_updated_at_idx" ON "audit_events" USING btree ("updated_at");
  CREATE INDEX "audit_events_created_at_idx" ON "audit_events" USING btree ("created_at");
  CREATE INDEX "entityType_entityId_idx" ON "audit_events" USING btree ("entity_type","entity_id");
  CREATE INDEX "actorId_idx" ON "audit_events" USING btree ("actor_id");
  CREATE INDEX "action_idx" ON "audit_events" USING btree ("action");
  CREATE UNIQUE INDEX "email_templates_key_idx" ON "email_templates" USING btree ("key");
  CREATE INDEX "email_templates_updated_at_idx" ON "email_templates" USING btree ("updated_at");
  CREATE INDEX "email_templates_created_at_idx" ON "email_templates" USING btree ("created_at");
  CREATE UNIQUE INDEX "email_templates_locales_locale_parent_id_unique" ON "email_templates_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_roles_fk" FOREIGN KEY ("roles_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_students_fk" FOREIGN KEY ("students_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_events_fk" FOREIGN KEY ("audit_events_id") REFERENCES "public"."audit_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_email_templates_fk" FOREIGN KEY ("email_templates_id") REFERENCES "public"."email_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_students_fk" FOREIGN KEY ("students_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_roles_id_idx" ON "payload_locked_documents_rels" USING btree ("roles_id");
  CREATE INDEX "payload_locked_documents_rels_students_id_idx" ON "payload_locked_documents_rels" USING btree ("students_id");
  CREATE INDEX "payload_locked_documents_rels_audit_events_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_events_id");
  CREATE INDEX "payload_locked_documents_rels_email_templates_id_idx" ON "payload_locked_documents_rels" USING btree ("email_templates_id");
  CREATE INDEX "payload_preferences_rels_students_id_idx" ON "payload_preferences_rels" USING btree ("students_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "admins_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "roles_permissions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "roles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "students_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "students" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "audit_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "email_templates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "email_templates_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "admins_rels" CASCADE;
  DROP TABLE "roles_permissions" CASCADE;
  DROP TABLE "roles" CASCADE;
  DROP TABLE "students_sessions" CASCADE;
  DROP TABLE "students" CASCADE;
  DROP TABLE "audit_events" CASCADE;
  DROP TABLE "email_templates" CASCADE;
  DROP TABLE "email_templates_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_roles_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_students_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_audit_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_email_templates_fk";
  
  ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT "payload_preferences_rels_students_fk";
  
  DROP INDEX "payload_locked_documents_rels_roles_id_idx";
  DROP INDEX "payload_locked_documents_rels_students_id_idx";
  DROP INDEX "payload_locked_documents_rels_audit_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_email_templates_id_idx";
  DROP INDEX "payload_preferences_rels_students_id_idx";
  ALTER TABLE "admins" DROP COLUMN "status";
  ALTER TABLE "admins" DROP COLUMN "preferred_locale";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "roles_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "students_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "audit_events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "email_templates_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN "students_id";
  DROP TYPE "public"."enum_admins_status";
  DROP TYPE "public"."enum_admins_preferred_locale";
  DROP TYPE "public"."enum_roles_permissions";
  DROP TYPE "public"."enum_students_preferred_locale";
  DROP TYPE "public"."enum_students_status";
  DROP TYPE "public"."enum_students_determination_status";
  DROP TYPE "public"."enum_audit_events_actor_type";
  DROP TYPE "public"."enum_email_templates_key";`)
}
