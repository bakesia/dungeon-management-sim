import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../engine/game/createInitialGameState'
import { migrateSaveData } from './saveMigrations'

describe('migrateSaveData', () => {
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

  it('migrates v1 tile-embedded facilities into the v2 rooms collection', () => {
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

    expect(migrated.saveVersion).toBe(2)
    expect(migrated.dungeon.tiles['0:0:0']?.facilityInstanceId).toBe('facility-core-1')
    expect(migrated.dungeon.rooms['facility-core-1']?.tileId).toBe('0:0:0')
  })

  it('rejects unsupported save versions with a descriptive error', () => {
    expect(() => migrateSaveData({ saveVersion: 999 })).toThrow('Unsupported saveVersion 999')
  })
})
