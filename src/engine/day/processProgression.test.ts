import { describe, expect, it } from 'vitest'
import type { FacilityInstance } from '../../types/game'
import { createInitialGameState } from '../game/createInitialGameState'
import { continueAfterClear, processProgression } from './processProgression'
import { getPopulationCapacity } from '../population/populationMetrics'

function addRooms(state: ReturnType<typeof createInitialGameState>, targetCount: number, levelThreeCount = 0) {
  const rooms = { ...state.dungeon.rooms }
  for (let index = Object.keys(rooms).length; index < targetCount; index += 1) {
    const instanceId = `test-room-${index}`
    rooms[instanceId] = {
      instanceId,
      definitionId: 'quarters',
      level: index < levelThreeCount + 3 ? 3 : 1,
      residentAssignments: [],
      durability: 100,
      condition: 'normal',
      tileId: `test-tile-${index}`,
    } satisfies FacilityInstance
  }
  state.dungeon.rooms = rooms
}

describe('processProgression', () => {
  it('promotes to the next data-defined tier when every condition is met', () => {
    const state = createInitialGameState()
    addRooms(state, 6)
    state.population[0]!.count = 8
    state.statistics.successfulDefenses = 1

    const next = processProgression(state)
    expect(next.currentTierId).toBe('tier_2')
    expect(next.resources.gold).toBe(130)
    expect(next.resources.material).toBe(100)
    expect(next.logs.at(-1)?.category).toBe('progression')
  })

  it('can progress through all satisfied tiers and clear at Tier 5', () => {
    const state = createInitialGameState()
    addRooms(state, 30, 8)
    state.population[0]!.count = 50
    state.statistics.successfulDefenses = 12
    state.resources.gold = 500
    state.resources.mana = 300

    expect(getPopulationCapacity(state)).toBeGreaterThanOrEqual(50)

    const next = processProgression(state)
    expect(next.currentTierId).toBe('tier_5')
    expect(next.status).toBe('clear')
    expect(next.logs.filter((entry) => entry.category === 'progression')).toHaveLength(4)
  })

  it('continues operations after clear without triggering the clear state again', () => {
    const state = createInitialGameState()
    state.currentTierId = 'tier_5'
    state.status = 'clear'

    const continued = continueAfterClear(state)
    const next = processProgression(continued)

    expect(next.status).toBe('playing')
    expect(next.flags.v01_clear_seen).toBe(true)
    expect(next.currentTierId).toBe('tier_5')
  })
})
