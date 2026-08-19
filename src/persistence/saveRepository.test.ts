import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { APP_VERSION, SAVE_VERSION } from '../app/version'
import { advanceDay } from '../engine/day/advanceDay'
import { buildFacility } from '../engine/construction/facilities'
import { adjustWorkerAssignment } from '../engine/population/assignWorkers'
import { createInitialGameState } from '../engine/game/createInitialGameState'
import type { SaveRecord } from '../types/save'

describe('DexieSaveRepository', () => {
  it('writes a versioned autosave record and loads it from a new repository instance', async () => {
    const { createSaveRepository, DEFAULT_SAVE_SLOT } = await import('./saveRepository')
    const { GameDatabase } = await import('./database')
    let game = buildFacility(createInitialGameState(), 'fungus_farm', '0:0:-1')
    const farmId = game.dungeon.tiles['0:0:-1']?.facilityInstanceId
    game = adjustWorkerAssignment(game, farmId!, 'worker', 1)
    game.dungeon.rooms[farmId!]!.condition = 'damaged'
    game.flags.persistence_test = true
    game.events.completedEventIds = ['event_old_chest']
    game = advanceDay(game, { randomSource: { next: () => 0.99 } })
    game.currentTierId = 'tier_3'
    game.core.hp = 64
    game.invasion = { daysSinceLastInvasion: 1, totalDefenses: 4, totalWins: 3, totalLosses: 1 }
    game.statistics.successfulDefenses = 3
    game.status = 'clear'

    const firstRepository = createSaveRepository()
    await firstRepository.save(game)

    const database = new GameDatabase()
    const storedRecord = await database.saves.get(DEFAULT_SAVE_SLOT) as SaveRecord

    expect(storedRecord.slotId).toBe(DEFAULT_SAVE_SLOT)
    expect(storedRecord.appVersion).toBe(APP_VERSION)
    expect(storedRecord.saveVersion).toBe(SAVE_VERSION)
    expect(storedRecord.gameState.day).toBe(2)
    database.close()

    const repositoryAfterReload = createSaveRepository()
    const loadedGame = await repositoryAfterReload.load()

    expect(loadedGame?.day).toBe(2)
    expect(loadedGame?.resources.food).toBe(37)
    expect(loadedGame?.dungeon.tiles['0:0:-1']?.facilityInstanceId).toBe(farmId)
    expect(loadedGame?.dungeon.rooms[farmId!]?.assignedWorkers.worker).toBe(1)
    expect(loadedGame?.dungeon.rooms[farmId!]?.condition).toBe('damaged')
    expect(loadedGame?.events.completedEventIds).toContain('event_old_chest')
    expect(loadedGame?.flags.persistence_test).toBe(true)
    expect(loadedGame?.currentTierId).toBe('tier_3')
    expect(loadedGame?.core.hp).toBe(64)
    expect(loadedGame?.invasion).toMatchObject({ totalDefenses: 4, totalWins: 3, totalLosses: 1 })
    expect(loadedGame?.statistics.successfulDefenses).toBe(3)
    expect(loadedGame?.status).toBe('clear')
  })
})
