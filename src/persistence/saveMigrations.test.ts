import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../engine/game/createInitialGameState'
import { migrateSaveData } from './saveMigrations'
import { SAVE_VERSION } from '../app/version'
import type { DungeonTile, GameState } from '../types/game'

function getLegacyStatus(tile: DungeonTile): 'undiscovered' | 'diggable' | 'empty' | 'occupied' {
  if (tile.facilityInstanceId) return 'occupied'
  if (tile.terrain === 'floor') return 'empty'
  return tile.revealed ? 'diggable' : 'undiscovered'
}

function createLegacyState(saveVersion: number): Record<string, unknown> {
  const current = createInitialGameState()
  return {
    ...current,
    saveVersion,
    world: undefined,
    excavation: undefined,
    dungeon: {
      rooms: current.dungeon.rooms,
      tiles: Object.fromEntries(Object.entries(current.dungeon.tiles).map(([id, tile]) => [id, {
        id: tile.id,
        coordinate: tile.coordinate,
        status: getLegacyStatus(tile),
        facilityInstanceId: tile.facilityInstanceId,
      }])),
    },
  }
}

function getLegacyDungeon(legacy: Record<string, unknown>): { tiles: Record<string, unknown>; rooms: GameState['dungeon']['rooms'] } {
  return legacy.dungeon as { tiles: Record<string, unknown>; rooms: GameState['dungeon']['rooms'] }
}

describe('migrateSaveData', () => {
  it('migrates a v9 save with an empty inventory and converts a legacy population offer', () => {
    const legacy = createLegacyState(9)
    delete legacy.inventory
    legacy.populationJoin = { pending: { raceId: 'goblin', amount: 2 } }
    const migrated = migrateSaveData(legacy)
    expect(migrated.inventory).toEqual([])
    expect(migrated.populationJoin.pending).toMatchObject({ incoming: [{ raceId: 'goblin', count: 2 }], source: 'event' })
  })
  it('normalizes partially missing current save fields', () => {
    const current = createInitialGameState()
    const legacy = {
      ...current,
      flags: ['legacy_flag'],
      events: undefined,
      invasion: undefined,
      status: undefined,
      logs: [{ id: 'legacy-log', day: 1, message: '이전 로그', tone: 'warning' }],
    }

    const migrated = migrateSaveData(legacy)

    expect(migrated.flags.legacy_flag).toBe(true)
    expect(migrated.events.currentEventId).toBeNull()
    expect(migrated.invasion.totalDefenses).toBe(0)
    expect(migrated.status).toBe('playing')
    expect(migrated.logs[0]?.category).toBe('warning')
  })

  it('migrates v1 tile-embedded facilities into the current rooms collection', () => {
    const current = createInitialGameState()
    const legacyTiles = Object.fromEntries(Object.entries(current.dungeon.tiles).map(([id, tile]) => {
      const room = tile.facilityInstanceId ? current.dungeon.rooms[tile.facilityInstanceId] : undefined
      const legacyTile = { id: tile.id, coordinate: tile.coordinate, status: getLegacyStatus(tile) }
      return [id, room ? { ...legacyTile, facility: { ...room, tileId: undefined } } : legacyTile]
    }))
    const legacy = {
      ...current,
      saveVersion: 1,
      world: undefined,
      excavation: undefined,
      dungeon: { tiles: legacyTiles },
    }

    const migrated = migrateSaveData(legacy)

    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.dungeon.tiles['0:0:0']?.facilityInstanceId).toBe('facility-core-1')
    expect(migrated.dungeon.rooms['facility-core-1']?.tileId).toBe('0:0:0')
    expect(migrated.dungeon.rooms['facility-core-1']?.condition).toBe('normal')
  })

  it('adds normal room condition when migrating a v2 save', () => {
    const current = createInitialGameState()
    const legacyBase = createLegacyState(2)
    const legacyDungeon = getLegacyDungeon(legacyBase)
    const legacy = {
      ...legacyBase,
      dungeon: {
        ...legacyDungeon,
        rooms: Object.fromEntries(Object.entries(current.dungeon.rooms).map(([id, room]) => {
          const legacyRoom: Partial<typeof room> = { ...room }
          delete legacyRoom.condition
          return [id, legacyRoom]
        })),
      },
    }

    const migrated = migrateSaveData(legacy)

    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(Object.values(migrated.dungeon.rooms).every((room) => room.condition === 'normal')).toBe(true)
  })

  it('merges v3 job groups into race-only population and resident assignments', () => {
    const current = createInitialGameState()
    const rooms = Object.fromEntries(Object.entries(current.dungeon.rooms).map(([id, room]) => {
      const legacyRoom = { ...room } as Record<string, unknown>
      delete legacyRoom.residentAssignments
      return [id, { ...legacyRoom, assignedWorkers: id === 'facility-mine-1' ? { worker: 2 } : {} }]
    }))

    const legacyPopulation = [
      { id: 'goblin-workers', raceId: 'goblin', jobId: 'worker', count: 4 },
      { id: 'goblin-guards', raceId: 'goblin', jobId: 'guard', count: 1 },
    ]
    const legacyBase = createLegacyState(3)
    const migrated = migrateSaveData({ ...legacyBase, population: legacyPopulation, dungeon: { ...getLegacyDungeon(legacyBase), rooms } })

    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.population).toEqual([{ id: 'population-goblin', raceId: 'goblin', count: 5 }])
    expect(migrated.dungeon.rooms['facility-mine-1']?.residentAssignments).toEqual([{ raceId: 'goblin', count: 2 }])
  })

  it('rejects unsupported save versions with a descriptive error', () => {
    expect(() => migrateSaveData({ saveVersion: 999 })).toThrow('Unsupported saveVersion 999')
  })

  it('converts removed legacy facilities to empty tiles without losing the save', () => {
    const current = createInitialGameState()
    const legacyBase = createLegacyState(6)
    const legacyDungeon = getLegacyDungeon(legacyBase)
    const tile = current.dungeon.tiles['0:0:-1']!
    const legacy = {
      ...legacyBase,
      dungeon: {
        tiles: { ...legacyDungeon.tiles, [tile.id]: { id: tile.id, coordinate: tile.coordinate, status: 'occupied', facilityInstanceId: 'legacy-watch' } },
        rooms: { ...current.dungeon.rooms, 'legacy-watch': { instanceId: 'legacy-watch', definitionId: 'watch_post', level: 1, residentAssignments: [], durability: 100, condition: 'normal', tileId: tile.id } },
      },
    }
    const migrated = migrateSaveData(legacy)
    expect(migrated.dungeon.rooms['legacy-watch']).toBeUndefined()
    expect(migrated.dungeon.tiles[tile.id]).toMatchObject({ terrain: 'floor', revealed: true, facilityInstanceId: undefined })
  })

  it('migrates v7 threat saves to fame, hidden pressure, and recruitment stock', () => {
    const current = createInitialGameState()
    const legacyBase = createLegacyState(7)
    const legacyTavern = { lastRefreshDay: 1, offers: current.tavern.offers }
    const legacy = {
      ...legacyBase,
      currentTierId: 'tier_3',
      invasion: { ...current.invasion, threat: 99, fame: undefined, raidPressure: undefined, totalWins: 3, totalLosses: 1, daysSinceLastInvasion: 4 },
      tavern: legacyTavern,
    }
    const migrated = migrateSaveData(legacy)
    expect(migrated.invasion.fame).toBeGreaterThan(0)
    expect(migrated.invasion.raidPressure).toBeCloseTo(0.2)
    expect(migrated.tavern.recruitmentOffers).toHaveLength(3)
    expect(migrated.tavern.lastRecruitmentRefreshDay).toBe(1)
  })

  it('migrates v8 joined NPCs to persistent eligibility state', () => {
    const legacyBase = createLegacyState(8)
    const migrated = migrateSaveData({
      ...legacyBase,
      npcs: { npc_merchant: { npcId: 'npc_merchant', discovered: true, joined: true, unlockedAtDay: 4 } },
    })
    expect(migrated.npcs.npc_merchant).toMatchObject({ eligible: true, joined: true, eligibleSinceDay: 4, joinedAtDay: 4 })
  })

  it('migrates a v0.1.14 save to one persistent world seed and safe revealed floor', () => {
    const legacy = createLegacyState(10)
    const first = migrateSaveData(legacy, { next: () => 0.125 })
    const second = migrateSaveData(first, { next: () => 0.875 })

    expect(first.saveVersion).toBe(SAVE_VERSION)
    expect(first.world.seed).toBe(second.world.seed)
    expect(first.world.generationVersion).toBe(2)
    expect(first.excavation.actionsRemaining).toBe(2)
    expect(first.dungeon.rooms['facility-core-1']).toBeDefined()
    expect(first.dungeon.tiles['0:0:0']).toMatchObject({
      terrain: 'floor',
      revealed: true,
      facilityInstanceId: 'facility-core-1',
      discovery: undefined,
      persistentNode: undefined,
    })
    expect(first.dungeon.tiles['0:0:-1']).toMatchObject({ terrain: 'floor', revealed: true })
  })

  it('rejects inconsistent current discovery and invalid coordinates', () => {
    const current = createInitialGameState()
    const tile = current.dungeon.tiles['0:0:-2']!
    expect(() => migrateSaveData({
      ...current,
      dungeon: { ...current.dungeon, tiles: { ...current.dungeon.tiles, [tile.id]: { ...tile, coordinate: { x: 0.5, y: -2 } } } },
    })).toThrow('invalid coordinates')

    expect(() => migrateSaveData({
      ...current,
      dungeon: {
        ...current.dungeon,
        tiles: {
          ...current.dungeon.tiles,
          [tile.id]: {
            ...tile,
            terrain: 'floor',
            revealed: true,
            discovery: { discoveryId: 'empty', variant: 1, resolved: true },
            persistentNode: { type: 'gold_vein' },
          },
        },
      },
    })).toThrow('inconsistent persistent discovery')

    expect(() => migrateSaveData({
      ...current,
      dungeon: {
        ...current.dungeon,
        tiles: {
          ...current.dungeon.tiles,
          [tile.id]: {
            ...tile,
            terrain: 'floor',
            revealed: true,
            discovery: { discoveryId: 'unknown_discovery', variant: 1, resolved: true },
          },
        },
      },
    })).toThrow('malformed discovery')

    expect(() => migrateSaveData({
      ...current,
      world: { ...current.world, generationVersion: 0 },
    })).toThrow('world seed or generation version')
  })

  it('loads a revealed but unexcavated gold-bearing rock without a migration', () => {
    const current = createInitialGameState()
    const tile = current.dungeon.tiles['0:0:-2']!
    const loaded = migrateSaveData({
      ...current,
      dungeon: {
        ...current.dungeon,
        tiles: {
          ...current.dungeon.tiles,
          [tile.id]: {
            ...tile,
            terrain: 'rock',
            revealed: true,
            discovery: { discoveryId: 'gold_vein', variant: 123, resolved: false },
          },
        },
      },
    })

    expect(loaded.saveVersion).toBe(SAVE_VERSION)
    expect(loaded.dungeon.tiles[tile.id]).toMatchObject({
      terrain: 'rock',
      discovery: { discoveryId: 'gold_vein', variant: 123, resolved: false },
      persistentNode: undefined,
    })
  })
})
