import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../engine/game/createInitialGameState'
import { migrateSaveData } from './saveMigrations'
import { SAVE_VERSION } from '../app/version'

describe('migrateSaveData', () => {
  it('migrates a v9 save with an empty inventory and converts a legacy population offer', () => {
    const legacy = createInitialGameState() as unknown as Record<string, unknown>
    legacy.saveVersion = 9
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
      const legacyTile = { id: tile.id, coordinate: tile.coordinate, status: tile.status }
      return [id, room ? { ...legacyTile, facility: { ...room, tileId: undefined } } : legacyTile]
    }))
    const legacy = {
      ...current,
      saveVersion: 1,
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
    const legacy = {
      ...current,
      saveVersion: 2,
      dungeon: {
        ...current.dungeon,
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
    const migrated = migrateSaveData({ ...current, population: legacyPopulation, saveVersion: 3, dungeon: { ...current.dungeon, rooms } })

    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.population).toEqual([{ id: 'population-goblin', raceId: 'goblin', count: 5 }])
    expect(migrated.dungeon.rooms['facility-mine-1']?.residentAssignments).toEqual([{ raceId: 'goblin', count: 2 }])
  })

  it('rejects unsupported save versions with a descriptive error', () => {
    expect(() => migrateSaveData({ saveVersion: 999 })).toThrow('Unsupported saveVersion 999')
  })

  it('converts removed legacy facilities to empty tiles without losing the save', () => {
    const current = createInitialGameState()
    const tile = current.dungeon.tiles['0:0:-1']!
    const legacy = {
      ...current,
      saveVersion: 6,
      dungeon: {
        tiles: { ...current.dungeon.tiles, [tile.id]: { ...tile, status: 'occupied', facilityInstanceId: 'legacy-watch' } },
        rooms: { ...current.dungeon.rooms, 'legacy-watch': { instanceId: 'legacy-watch', definitionId: 'watch_post', level: 1, residentAssignments: [], durability: 100, condition: 'normal', tileId: tile.id } },
      },
    }
    const migrated = migrateSaveData(legacy)
    expect(migrated.dungeon.rooms['legacy-watch']).toBeUndefined()
    expect(migrated.dungeon.tiles[tile.id]).toMatchObject({ status: 'empty', facilityInstanceId: undefined })
  })

  it('migrates v7 threat saves to fame, hidden pressure, and recruitment stock', () => {
    const current = createInitialGameState()
    const legacyTavern = { lastRefreshDay: 1, offers: current.tavern.offers }
    const legacy = {
      ...current,
      saveVersion: 7,
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
    const current = createInitialGameState()
    const migrated = migrateSaveData({
      ...current,
      saveVersion: 8,
      npcs: { npc_merchant: { npcId: 'npc_merchant', discovered: true, joined: true, unlockedAtDay: 4 } },
    })
    expect(migrated.npcs.npc_merchant).toMatchObject({ eligible: true, joined: true, eligibleSinceDay: 4, joinedAtDay: 4 })
  })
})
