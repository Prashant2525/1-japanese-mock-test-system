import * as migration_20261014_141636_initial from './20261014_141636_initial'
import * as migration_20261014_150706_auth_roles_students from './20261014_150706_auth_roles_students'
import * as migration_20261014_150800_seed_auth from './20261014_150800_seed_auth'
import * as migration_20261014_162238_admin_totp from './20261014_162238_admin_totp'
import * as migration_20261014_191843_ui_labels from './20261014_191843_ui_labels'
import * as migration_20261014_203352_google_sign_in from './20261014_203352_google_sign_in'
import * as migration_20261015_082931_exam_catalogue from './20261015_082931_exam_catalogue'
import * as migration_20261015_092913_student_level_gate from './20261015_092913_student_level_gate'
import * as migration_20261015_104002_home_signed_in_labels from './20261015_104002_home_signed_in_labels'
import * as migration_20261015_142053_level_check from './20261015_142053_level_check'
import * as migration_20261015_143836_level_check_labels from './20261015_143836_level_check_labels'
import * as migration_20261015_155855_study_library from './20261015_155855_study_library'
import * as migration_20261015_160304_study_labels from './20261015_160304_study_labels'
import * as migration_20261015_200516_content_lifecycle from './20261015_200516_content_lifecycle'
import * as migration_20261015_201010_study_search_labels from './20261015_201010_study_search_labels'
import * as migration_20261015_201500_super_admin_delete_permissions from './20261015_201500_super_admin_delete_permissions'

export const migrations = [
  {
    up: migration_20261014_141636_initial.up,
    down: migration_20261014_141636_initial.down,
    name: '20261014_141636_initial',
  },
  {
    up: migration_20261014_150706_auth_roles_students.up,
    down: migration_20261014_150706_auth_roles_students.down,
    name: '20261014_150706_auth_roles_students',
  },
  {
    up: migration_20261014_150800_seed_auth.up,
    down: migration_20261014_150800_seed_auth.down,
    name: '20261014_150800_seed_auth',
  },
  {
    up: migration_20261014_162238_admin_totp.up,
    down: migration_20261014_162238_admin_totp.down,
    name: '20261014_162238_admin_totp',
  },
  {
    up: migration_20261014_191843_ui_labels.up,
    down: migration_20261014_191843_ui_labels.down,
    name: '20261014_191843_ui_labels',
  },
  {
    up: migration_20261014_203352_google_sign_in.up,
    down: migration_20261014_203352_google_sign_in.down,
    name: '20261014_203352_google_sign_in',
  },
  {
    up: migration_20261015_082931_exam_catalogue.up,
    down: migration_20261015_082931_exam_catalogue.down,
    name: '20261015_082931_exam_catalogue',
  },
  {
    up: migration_20261015_092913_student_level_gate.up,
    down: migration_20261015_092913_student_level_gate.down,
    name: '20261015_092913_student_level_gate',
  },
  {
    up: migration_20261015_104002_home_signed_in_labels.up,
    down: migration_20261015_104002_home_signed_in_labels.down,
    name: '20261015_104002_home_signed_in_labels',
  },
  {
    up: migration_20261015_142053_level_check.up,
    down: migration_20261015_142053_level_check.down,
    name: '20261015_142053_level_check',
  },
  {
    up: migration_20261015_143836_level_check_labels.up,
    down: migration_20261015_143836_level_check_labels.down,
    name: '20261015_143836_level_check_labels',
  },
  {
    up: migration_20261015_155855_study_library.up,
    down: migration_20261015_155855_study_library.down,
    name: '20261015_155855_study_library',
  },
  {
    up: migration_20261015_160304_study_labels.up,
    down: migration_20261015_160304_study_labels.down,
    name: '20261015_160304_study_labels',
  },
  {
    up: migration_20261015_200516_content_lifecycle.up,
    down: migration_20261015_200516_content_lifecycle.down,
    name: '20261015_200516_content_lifecycle',
  },
  {
    up: migration_20261015_201010_study_search_labels.up,
    down: migration_20261015_201010_study_search_labels.down,
    name: '20261015_201010_study_search_labels',
  },
  {
    up: migration_20261015_201500_super_admin_delete_permissions.up,
    down: migration_20261015_201500_super_admin_delete_permissions.down,
    name: '20261015_201500_super_admin_delete_permissions',
  },
]
