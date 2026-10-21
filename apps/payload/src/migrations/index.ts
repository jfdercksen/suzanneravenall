import * as migration_20260421_104933 from './20260421_104933';
import * as migration_20261021_025305_intake_forms from './20261021_025305_intake_forms';

export const migrations = [
  {
    up: migration_20260421_104933.up,
    down: migration_20260421_104933.down,
    name: '20260421_104933',
  },
  {
    up: migration_20261021_025305_intake_forms.up,
    down: migration_20261021_025305_intake_forms.down,
    name: '20261021_025305_intake_forms'
  },
];
