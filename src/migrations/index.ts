import * as migration_20261014_141636_initial from './20261014_141636_initial'
import * as migration_20261014_150706_auth_roles_students from './20261014_150706_auth_roles_students'
import * as migration_20261014_150800_seed_auth from './20261014_150800_seed_auth'
import * as migration_20261014_162238_admin_totp from './20261014_162238_admin_totp'
import * as migration_20261014_191843_ui_labels from './20261014_191843_ui_labels'

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
]
