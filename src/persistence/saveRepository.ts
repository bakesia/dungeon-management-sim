import { migrateSaveData } from './saveMigrations'
import type { GameState } from '../types/game'

const DATABASE_NAME = 'dungeon-management-sim'
const DATABASE_VERSION = 1
const STORE_NAME = 'saves'
const DEFAULT_SLOT = 'autosave'

export interface SaveRepository {
  save(state: GameState, slotId?: string): Promise<void>
  load(slotId?: string): Promise<GameState | null>
}

class MemorySaveRepository implements SaveRepository {
  private readonly slots = new Map<string, GameState>()

  async save(state: GameState, slotId = DEFAULT_SLOT): Promise<void> {
    this.slots.set(slotId, structuredClone(state))
  }

  async load(slotId = DEFAULT_SLOT): Promise<GameState | null> {
    const state = this.slots.get(slotId)
    return state ? structuredClone(state) : null
  }
}

class IndexedDbSaveRepository implements SaveRepository {
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME)
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('IndexedDB를 열 수 없습니다.'))
    })
  }

  async save(state: GameState, slotId = DEFAULT_SLOT): Promise<void> {
    const database = await this.openDatabase()

    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).put(state, slotId)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('게임을 저장하지 못했습니다.'))
    })

    database.close()
  }

  async load(slotId = DEFAULT_SLOT): Promise<GameState | null> {
    const database = await this.openDatabase()

    const value = await new Promise<unknown>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly')
      const request = transaction.objectStore(STORE_NAME).get(slotId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('게임을 불러오지 못했습니다.'))
    })

    database.close()
    return value === undefined ? null : migrateSaveData(value)
  }
}

export function createSaveRepository(): SaveRepository {
  return typeof indexedDB === 'undefined' ? new MemorySaveRepository() : new IndexedDbSaveRepository()
}
