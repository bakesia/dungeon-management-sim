import { describe, expect, it } from 'vitest'
import { buildFacility } from '../construction/facilities'
import { processDailyProduction } from '../day/processDailyProduction'
import { createInitialGameState } from '../game/createInitialGameState'
import { adjustResidentAssignment, calculateFacilityEfficiency, calculateFacilityProductionMultiplier, getAvailableResidentsByRace } from './assignWorkers'

describe('race-only resident assignment and production', () => {
  it('applies linear staffing and race efficiency to room effects', () => {
    const state = adjustResidentAssignment(createInitialGameState(), 'facility-mine-1', 'goblin', 1)
    expect(calculateFacilityEfficiency(state.dungeon.rooms['facility-mine-1']!)).toBe(0.5)
    expect(processDailyProduction(state).resources.material).toBe(83)
  })

  it('uses facility tags for Goblin, Orc, and Imp modifiers', () => {
    const goblins = createInitialGameState()
    goblins.dungeon.rooms['facility-mine-1']!.residentAssignments = [{ raceId: 'goblin', count: 2 }]
    expect(calculateFacilityProductionMultiplier(goblins, goblins.dungeon.rooms['facility-mine-1']!)).toBeCloseTo(1.1)

    const orcs = createInitialGameState()
    orcs.population.push({ id: 'population-orc', raceId: 'orc', count: 2 })
    orcs.dungeon.rooms['facility-mine-1']!.residentAssignments = [{ raceId: 'orc', count: 2 }]
    expect(calculateFacilityProductionMultiplier(orcs, orcs.dungeon.rooms['facility-mine-1']!)).toBeCloseTo(0.9)

    orcs.currentTierId = 'tier_3'; orcs.resources.material = 100; orcs.population.push({ id: 'population-imp', raceId: 'imp', count: 1 })
    const manaState = buildFacility(orcs, 'mana_chamber', '0:0:-1')
    const room = manaState.dungeon.rooms[manaState.dungeon.tiles['0:0:-1']!.facilityInstanceId!]!
    room.residentAssignments = [{ raceId: 'imp', count: 1 }]
    expect(calculateFacilityProductionMultiplier(manaState, room)).toBeCloseTo(1.2)
  })

  it('tracks global race availability and enforces room slots', () => {
    let state = adjustResidentAssignment(createInitialGameState(), 'facility-mine-1', 'goblin', 1)
    expect(getAvailableResidentsByRace(state, 'goblin')).toBe(4)
    state = adjustResidentAssignment(state, 'facility-mine-1', 'goblin', 1)
    expect(() => adjustResidentAssignment(state, 'facility-mine-1', 'goblin', 1)).toThrow('필요 인원을 모두 배치했습니다')
  })
})
