import * as migration_20261014_141636_initial from './20261014_141636_initial'

export const migrations = [
  {
    up: migration_20261014_141636_initial.up,
    down: migration_20261014_141636_initial.down,
    name: '20261014_141636_initial',
  },
]
