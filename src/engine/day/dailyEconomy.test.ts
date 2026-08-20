import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/createInitialGameState'
import { buildFacility } from '../construction/facilities'
import { addItem } from '../inventory/inventory'
import { calculateExpectedDailyFlow } from './dailyEconomy'

describe('expected daily economy', () => {
  it('separates production, fixed consumption, and net flow', () => {
    const state = createInitialGameState()
    state.dungeon.rooms['facility-mine-1']!.residentAssignments = [{ raceId: 'goblin', count: 2 }]
    const flow = calculateExpectedDailyFlow(state)
    expect(flow.resources.find((entry) => entry.resourceId === 'gold')).toMatchObject({ production: 0, fixedConsumption: 1, net: -1 })
    expect(flow.resources.find((entry) => entry.resourceId === 'material')).toMatchObject({ production: 6, fixedConsumption: 0, net: 6 })
    expect(flow.resources.find((entry) => entry.resourceId === 'food')).toMatchObject({ production: 0, fixedConsumption: 5, net: -5 })
  })

  it('reports artifact production as a distinct source without stacking duplicate copies', () => {
    let state = createInitialGameState()
    state.currentTierId = 'tier_2'
    state.resources.material = 100
    state = buildFacility(state, 'mana_chamber', '0:0:-1')
    const room = state.dungeon.rooms[state.dungeon.tiles['0:0:-1']!.facilityInstanceId!]!
    room.residentAssignments = [{ raceId: 'imp', count: 1 }]
    state.population.push({ id: 'population-imp', raceId: 'imp', count: 1 })
    state = addItem(state, 'artifact_mana_lens', 2)
    const flow = calculateExpectedDailyFlow(state)
    expect(flow.resources.find((entry) => entry.resourceId === 'mana')?.production).toBe(5)
    expect(flow.productionSources.filter((source) => source.sourceType === 'artifact')).toEqual([
      expect.objectContaining({ label: '심층 마력 렌즈', amount: 1 }),
    ])
  })
})
