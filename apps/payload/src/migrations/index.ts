import * as migration_20260421_104933 from './20260421_104933';

export const migrations = [
  {
    up: migration_20260421_104933.up,
    down: migration_20260421_104933.down,
    name: '20260421_104933'
  },
];
