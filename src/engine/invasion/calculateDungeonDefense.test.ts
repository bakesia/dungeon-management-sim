import { describe, expect, it } from 'vitest'
import { buildFacility } from '../construction/facilities'
import { createInitialGameState } from '../game/createInitialGameState'
import { calculateDungeonDefenseBreakdown } from './calculateDungeonDefense'

describe('calculateDungeonDefenseBreakdown', () => {
  it('returns contribution rows that add up exactly to the total', () => {
    let state = createInitialGameState()
    state.resources.gold = 100
    state.resources.material = 100
    state = buildFacility(state, 'guard_post', '0:0:-1')
    const roomId = state.dungeon.tiles['0:0:-1']?.facilityInstanceId
    state.dungeon.rooms[roomId!]!.assignedWorkers.guard = 2

    const normal = calculateDungeonDefenseBreakdown(state)
    expect(normal.contributions.reduce((total, row) => total + row.amount, 0)).toBe(normal.total)

    state.dungeon.rooms[roomId!]!.condition = 'damaged'
    const damaged = calculateDungeonDefenseBreakdown(state)
    const normalRoom = normal.contributions.find((row) => row.sourceId === roomId)?.amount
    const damagedRoom = damaged.contributions.find((row) => row.sourceId === roomId)?.amount
    expect(normalRoom).toBe(15)
    expect(damagedRoom).toBe(7)
  })
})
