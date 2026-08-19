import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameDatabase } from '../persistence/database'
import { DEFAULT_SAVE_SLOT } from '../persistence/saveRepository'
import type { SaveRecord } from '../types/save'
import { useGameStore } from './useGameStore'

describe('useGameStore', () => {
  afterEach(() => vi.restoreAllMocks())
  it('routes management actions through the dungeon engines', () => {
    useGameStore.getState().startNewGame()

    expect(useGameStore.getState().digTile('0:0:-2')).toBe(true)
    expect(useGameStore.getState().buildFacility('fungus_farm', '0:0:-1')).toBe(true)
    const farmId = useGameStore.getState().game.dungeon.tiles['0:0:-1']?.facilityInstanceId
    expect(useGameStore.getState().adjustResident(farmId!, 'goblin', 1)).toBe(true)
    expect(useGameStore.getState().upgradeFacility(farmId!)).toBe(true)
    expect(useGameStore.getState().demolishFacility(farmId!)).toBe(true)

    expect(useGameStore.getState().game.dungeon.tiles['0:0:-1']?.status).toBe('empty')
    expect(useGameStore.getState().lastActionError).toBeNull()
  })

  it('commits the DAY engine result and autosaves it', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    useGameStore.getState().startNewGame()

    await useGameStore.getState().advanceDay()

    const game = useGameStore.getState().game
    expect(game.day).toBe(2)
    expect(game.resources.food).toBe(35)

    const database = new GameDatabase()
    const record = await database.saves.get(DEFAULT_SAVE_SLOT) as SaveRecord
    expect(record.gameState.day).toBe(2)
    expect(record.gameState.resources.food).toBe(35)
    database.close()
  })
})
