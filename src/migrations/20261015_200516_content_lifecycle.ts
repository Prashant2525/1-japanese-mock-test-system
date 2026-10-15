import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'materials.delete' BEFORE 'media.manage';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'media.delete' BEFORE 'media.upload_svg';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'questions.delete' BEFORE 'questions.import';
  ALTER TABLE "study_materials_attachments" ADD COLUMN "allow_download" boolean DEFAULT false;
  ALTER TABLE "_study_materials_v_version_attachments" ADD COLUMN "allow_download" boolean DEFAULT false;
  ALTER TABLE "learning_media" ADD COLUMN "archived" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "roles_permissions" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_roles_permissions";
  CREATE TYPE "public"."enum_roles_permissions" AS ENUM('admins.read', 'admins.manage', 'roles.manage', 'students.read', 'students.update', 'students.reset_determination', 'students.override_level', 'audit.read', 'settings.manage', 'content.manage', 'content.publish', 'catalogue.manage', 'materials.manage', 'materials.publish', 'media.manage', 'media.upload_svg', 'questions.manage', 'questions.publish', 'questions.import', 'tests.manage', 'tests.publish', 'determination.manage', 'determination.publish', 'results.read', 'products.manage', 'orders.read', 'payments.read', 'support.read');
  ALTER TABLE "roles_permissions" ALTER COLUMN "value" SET DATA TYPE "public"."enum_roles_permissions" USING "value"::"public"."enum_roles_permissions";
  ALTER TABLE "study_materials_attachments" DROP COLUMN "allow_download";
  ALTER TABLE "_study_materials_v_version_attachments" DROP COLUMN "allow_download";
  ALTER TABLE "learning_media" DROP COLUMN "archived";`)
}
