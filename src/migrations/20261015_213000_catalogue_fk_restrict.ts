import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 13 integrity: records that hold history or live content must never lose their exam or
 * level link silently. Payload's default for relationships is ON DELETE SET NULL; the catalogue is
 * never deleted through the app (delete: never), and this makes the database refuse it too, as the
 * Phase 9 migration did for levels → exam types. Draft-version tables keep the default.
 */
const LINKS = [
  ['level_assignments', 'level_assignments_level_id_levels_id_fk', 'level_id', 'levels'],
  [
    'level_check_sessions',
    'level_check_sessions_assigned_level_id_levels_id_fk',
    'assigned_level_id',
    'levels',
  ],
  ['questions', 'questions_exam_type_id_exam_types_id_fk', 'exam_type_id', 'exam_types'],
  ['questions', 'questions_level_id_levels_id_fk', 'level_id', 'levels'],
  ['study_materials', 'study_materials_level_id_levels_id_fk', 'level_id', 'levels'],
  [
    'level_check_settings_stages',
    'level_check_settings_stages_level_id_levels_id_fk',
    'level_id',
    'levels',
  ],
] as const

async function setRule(db: MigrateUpArgs['db'], rule: 'restrict' | 'set null') {
  for (const [table, name, column, target] of LINKS) {
    await db.execute(
      sql.raw(`
        ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${name}";
        ALTER TABLE "${table}" ADD CONSTRAINT "${name}" FOREIGN KEY ("${column}")
          REFERENCES "public"."${target}"("id") ON DELETE ${rule} ON UPDATE no action;`),
    )
  }
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await setRule(db, 'restrict')
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await setRule(db, 'set null')
}
