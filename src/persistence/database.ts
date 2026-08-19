import Dexie, { type Table } from 'dexie'
import { DATABASE_SCHEMA_VERSION } from '../app/version'

export const DATABASE_NAME = 'dungeon-management-sim'

export class GameDatabase extends Dexie {
  saves!: Table<unknown, string>

  constructor() {
    super(DATABASE_NAME)

    // Keep the hidden/out-of-line slot key used by the v0.1 raw IndexedDB store.
    // This lets Dexie add indexes without changing how existing autosaves are keyed.
    this.version(DATABASE_SCHEMA_VERSION).stores({
      saves: ', savedAt, appVersion, saveVersion',
    })
  }
}
