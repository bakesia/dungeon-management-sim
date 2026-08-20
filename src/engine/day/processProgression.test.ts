import { describe, expect, it } from 'vitest'
import type { FacilityInstance } from '../../types/game'
import { createInitialGameState } from '../game/createInitialGameState'
import { canPromoteDungeon, continueAfterClear, processProgression, promoteDungeon } from './processProgression'
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

describe('manual dungeon progression', () => {
  it('does not auto-promote and promotes one tier only after a validated command', () => {
    const state = createInitialGameState()
    addRooms(state, 6)
    state.population[0]!.count = 8
    state.statistics.successfulDefenses = 1

    expect(canPromoteDungeon(state)).toBe(true)
    expect(processProgression(state).currentTierId).toBe('tier_1')
    const next = promoteDungeon(state)
    expect(next.currentTierId).toBe('tier_2')
    expect(next.resources.gold).toBe(130)
    expect(next.resources.material).toBe(100)
    expect(next.logs.at(-1)?.category).toBe('progression')
  })

  it('revalidates derived eligibility and can reach the final tier through explicit promotions', () => {
    const state = createInitialGameState()
    addRooms(state, 30, 8)
    state.population[0]!.count = 50
    state.statistics.successfulDefenses = 12
    expect(getPopulationCapacity(state)).toBeGreaterThanOrEqual(50)
    state.population[0]!.count = 7
    expect(canPromoteDungeon(state)).toBe(false)
    state.population[0]!.count = 50

    let next = state
    for (let index = 0; index < 4; index += 1) next = promoteDungeon(next)
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
