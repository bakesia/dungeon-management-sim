import { describe, expect, it } from 'vitest'
import { buildFacility } from '../construction/facilities'
import { createInitialGameState } from '../game/createInitialGameState'
import { aggregateDefenseContributions, calculateDungeonDefenseBreakdown } from './calculateDungeonDefense'
import { addItem } from '../inventory/inventory'

describe('calculateDungeonDefenseBreakdown', () => {
  it('counts only residents assigned to combat rooms and preserves exact contribution totals', () => {
    let state = createInitialGameState(); state.currentTierId = 'tier_2'; state.resources.gold = 100; state.resources.material = 100
    state = buildFacility(state, 'guard_post', '0:0:-1')
    const roomId = state.dungeon.tiles['0:0:-1']!.facilityInstanceId!
    state.dungeon.rooms[roomId]!.residentAssignments = [{ raceId: 'goblin', count: 2 }]
    state.dungeon.rooms['facility-mine-1']!.residentAssignments = [{ raceId: 'goblin', count: 2 }]
    const normal = calculateDungeonDefenseBreakdown(state)
    expect(normal.residentDefense).toBe(14)
    expect(normal.facilityDefense).toBe(3)
    expect(normal.contributions.reduce((sum, row) => sum + row.amount, 0)).toBe(normal.total)

    state.dungeon.rooms[roomId]!.condition = 'damaged'
    const damaged = calculateDungeonDefenseBreakdown(state)
    expect(damaged.total).toBe(8)
  })

  it('applies race combat modifiers to mixed combat assignments', () => {
    let state = createInitialGameState(); state.currentTierId = 'tier_2'; state.resources.gold = 100; state.resources.material = 100
    state.population.push({ id: 'population-orc', raceId: 'orc', count: 1 })
    state = buildFacility(state, 'guard_post', '0:0:-1')
    const room = state.dungeon.rooms[state.dungeon.tiles['0:0:-1']!.facilityInstanceId!]!
    room.residentAssignments = [{ raceId: 'goblin', count: 1 }, { raceId: 'orc', count: 1 }]
    expect(calculateDungeonDefenseBreakdown(state).residentDefense).toBe(15)
  })

  it('aggregates defense by category and exposes artifacts separately', () => {
    let state = createInitialGameState()
    state = addItem(state, 'artifact_ward_rune', 1)
    const breakdown = calculateDungeonDefenseBreakdown(state)
    expect(aggregateDefenseContributions(breakdown.contributions)).toContainEqual({ label: '유물', amount: 5 })
    expect(breakdown.total).toBe(5)
  })
})
