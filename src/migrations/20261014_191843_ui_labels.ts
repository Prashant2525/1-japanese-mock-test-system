import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "labels_site" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "labels_site_locales" (
  	"meta_site_name" varchar,
  	"meta_tagline" varchar,
  	"meta_description" varchar,
  	"a11y_skip_to_content" varchar,
  	"a11y_main_navigation" varchar,
  	"a11y_language_switcher" varchar,
  	"a11y_loading" varchar,
  	"a11y_show_password" varchar,
  	"a11y_hide_password" varchar,
  	"a11y_close" varchar,
  	"a11y_notifications" varchar,
  	"nav_home" varchar,
  	"nav_login" varchar,
  	"nav_signup" varchar,
  	"nav_my_page" varchar,
  	"nav_logout" varchar,
  	"footer_rights" varchar,
  	"footer_not_affiliated" varchar,
  	"home_eyebrow" varchar,
  	"home_title" varchar,
  	"home_title_station" varchar,
  	"home_under_construction" varchar,
  	"home_cta_signup" varchar,
  	"home_cta_login" varchar,
  	"auth_panel_title" varchar,
  	"auth_panel_body" varchar,
  	"auth_panel_stations" varchar,
  	"not_found_title" varchar,
  	"not_found_body" varchar,
  	"not_found_home" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "labels_accounts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "labels_accounts_locales" (
  	"auth_email" varchar,
  	"auth_password" varchar,
  	"auth_new_password" varchar,
  	"auth_confirm_password" varchar,
  	"auth_name" varchar,
  	"auth_password_hint" varchar,
  	"auth_signup_title" varchar,
  	"auth_signup_subtitle" varchar,
  	"auth_signup_submit" varchar,
  	"auth_signup_have_account" varchar,
  	"auth_signup_login_link" varchar,
  	"auth_check_email_title" varchar,
  	"auth_check_email_body" varchar,
  	"auth_check_email_body_no_email" varchar,
  	"auth_check_email_resend_prompt" varchar,
  	"auth_check_email_resend" varchar,
  	"auth_check_email_resent" varchar,
  	"auth_check_email_back_to_login" varchar,
  	"auth_verify_title" varchar,
  	"auth_verify_working" varchar,
  	"auth_verify_success_title" varchar,
  	"auth_verify_success_body" varchar,
  	"auth_verify_error_title" varchar,
  	"auth_verify_error_body" varchar,
  	"auth_verify_missing_token" varchar,
  	"auth_verify_go_to_login" varchar,
  	"auth_login_title" varchar,
  	"auth_login_subtitle" varchar,
  	"auth_login_submit" varchar,
  	"auth_login_forgot" varchar,
  	"auth_login_no_account" varchar,
  	"auth_login_signup_link" varchar,
  	"auth_login_not_verified" varchar,
  	"auth_login_resend_verification" varchar,
  	"auth_forgot_title" varchar,
  	"auth_forgot_subtitle" varchar,
  	"auth_forgot_submit" varchar,
  	"auth_forgot_sent" varchar,
  	"auth_forgot_back_to_login" varchar,
  	"auth_reset_title" varchar,
  	"auth_reset_submit" varchar,
  	"auth_reset_success" varchar,
  	"auth_reset_missing_token" varchar,
  	"auth_reset_request_new" varchar,
  	"auth_reset_go_to_login" varchar,
  	"app_welcome" varchar,
  	"app_level_check_title" varchar,
  	"app_level_check_not_started" varchar,
  	"app_level_check_in_progress" varchar,
  	"app_level_check_completed" varchar,
  	"app_account_title" varchar,
  	"app_language" varchar,
  	"app_logged_out" varchar,
  	"app_email" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "labels_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "labels_messages_locales" (
  	"validation_required" varchar,
  	"validation_email" varchar,
  	"validation_password_min" varchar,
  	"validation_password_max" varchar,
  	"validation_passwords_match" varchar,
  	"validation_name_max" varchar,
  	"errors_validation_failed" varchar,
  	"errors_invalid_token" varchar,
  	"errors_unauthenticated" varchar,
  	"errors_session_expired" varchar,
  	"errors_invalid_credentials" varchar,
  	"errors_forbidden" varchar,
  	"errors_account_disabled" varchar,
  	"errors_email_not_verified" varchar,
  	"errors_rate_limited" varchar,
  	"errors_rate_limited_seconds" varchar,
  	"errors_network_error" varchar,
  	"errors_internal" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "labels_site_locales" ADD CONSTRAINT "labels_site_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."labels_site"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "labels_accounts_locales" ADD CONSTRAINT "labels_accounts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."labels_accounts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "labels_messages_locales" ADD CONSTRAINT "labels_messages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."labels_messages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "labels_site_locales_locale_parent_id_unique" ON "labels_site_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "labels_accounts_locales_locale_parent_id_unique" ON "labels_accounts_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "labels_messages_locales_locale_parent_id_unique" ON "labels_messages_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "labels_site" CASCADE;
  DROP TABLE "labels_site_locales" CASCADE;
  DROP TABLE "labels_accounts" CASCADE;
  DROP TABLE "labels_accounts_locales" CASCADE;
  DROP TABLE "labels_messages" CASCADE;
  DROP TABLE "labels_messages_locales" CASCADE;`)
}
