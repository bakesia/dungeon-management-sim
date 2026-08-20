import { APP_VERSION, SAVE_VERSION } from '../app/version'
import type { GameState } from '../types/game'
import type { SaveRecord } from '../types/save'
import { GameDatabase } from './database'
import { migrateSaveData } from './saveMigrations'

export const DEFAULT_SAVE_SLOT = 'autosave'

export interface SaveRepository {
  save(state: GameState, slotId?: string): Promise<void>
  load(slotId?: string): Promise<GameState | null>
}

function isSaveRecord(value: unknown): value is SaveRecord {
  return typeof value === 'object'
    && value !== null
    && 'slotId' in value
    && 'gameState' in value
}

class MemorySaveRepository implements SaveRepository {
  private readonly slots = new Map<string, GameState>()

  async save(state: GameState, slotId = DEFAULT_SAVE_SLOT): Promise<void> {
    this.slots.set(slotId, structuredClone(state))
  }

  async load(slotId = DEFAULT_SAVE_SLOT): Promise<GameState | null> {
    const state = this.slots.get(slotId)
    return state ? structuredClone(state) : null
  }
}

class DexieSaveRepository implements SaveRepository {
  private readonly database = new GameDatabase()

  async save(state: GameState, slotId = DEFAULT_SAVE_SLOT): Promise<void> {
    const record: SaveRecord = {
      slotId,
      savedAt: Date.now(),
      appVersion: APP_VERSION,
      saveVersion: SAVE_VERSION,
      gameState: state,
    }

    await this.database.saves.put(record, slotId)
  }

  async load(slotId = DEFAULT_SAVE_SLOT): Promise<GameState | null> {
    const storedValue = await this.database.saves.get(slotId)
    if (storedValue === undefined) return null

    // Early v0.1 builds stored GameState directly; current builds wrap it in a versioned SaveRecord.
    const rawState = isSaveRecord(storedValue) ? storedValue.gameState : storedValue
    const migrated = migrateSaveData(rawState)
    const rawSaveVersion = isSaveRecord(storedValue)
      ? storedValue.gameState.saveVersion
      : typeof rawState === 'object' && rawState !== null && 'saveVersion' in rawState
        ? rawState.saveVersion
        : undefined
    if (!isSaveRecord(storedValue) || storedValue.saveVersion !== SAVE_VERSION || rawSaveVersion !== SAVE_VERSION) {
      await this.save(migrated, slotId)
    }
    return migrated
  }
}

export function createSaveRepository(): SaveRepository {
  return typeof indexedDB === 'undefined' ? new MemorySaveRepository() : new DexieSaveRepository()
}

export const saveRepository = createSaveRepository()
