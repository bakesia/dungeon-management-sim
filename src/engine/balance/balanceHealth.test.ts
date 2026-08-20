import { describe, expect, it } from 'vitest'
import { invaderDefinitionById } from '../../content/invaders/invaders'
import { buildFacility } from '../construction/facilities'
import { processDailyProduction } from '../day/processDailyProduction'
import { processFoodConsumption } from '../day/processFoodConsumption'
import { createInitialGameState } from '../game/createInitialGameState'
import { calculateDungeonDefense } from '../invasion/calculateDungeonDefense'

describe('representative balance health', () => {
  it('lets an early guard plan reliably stop solo raiders without trivializing every beginner party', () => {
    let state = createInitialGameState()
    state.currentTierId = 'tier_2'
    state = buildFacility(state, 'guard_post', '0:0:-1')
    const guard = state.dungeon.rooms[state.dungeon.tiles['0:0:-1']!.facilityInstanceId!]!
    guard.residentAssignments = [{ raceId: 'goblin', count: 2 }]
    const defense = calculateDungeonDefense(state)
    expect(defense).toBe(17)
    expect(defense).toBeGreaterThan(invaderDefinitionById.invader_wandering_adventurer!.powerRange.max)
    expect(defense).toBeLessThan(invaderDefinitionById.invader_beginner_party!.powerRange.min)
  })

  it('places a practical mid-game guard and trap build inside the veteran challenge range', () => {
    let state = createInitialGameState()
    state.currentTierId = 'tier_3'
    state = buildFacility(state, 'guard_post', '0:0:-1')
    state = buildFacility(state, 'trap_room', '0:0:1')
    const guard = state.dungeon.rooms[state.dungeon.tiles['0:0:-1']!.facilityInstanceId!]!
    const trap = state.dungeon.rooms[state.dungeon.tiles['0:0:1']!.facilityInstanceId!]!
    guard.level = 2
    trap.level = 2
    guard.residentAssignments = [{ raceId: 'goblin', count: 3 }]
    const defense = calculateDungeonDefense(state)
    const veteran = invaderDefinitionById.invader_veteran_party!
    expect(defense).toBe(52)
    expect(defense).toBeGreaterThan(veteran.powerRange.min)
    expect(defense).toBeLessThan(veteran.powerRange.max)
  })

  it('keeps a prepared current-late defense inside the elite raid range', () => {
    const state = createInitialGameState()
    state.currentTierId = 'tier_5'
    state.population[0]!.count = 25
    state.dungeon.rooms.late_guard = { instanceId: 'late_guard', definitionId: 'guard_post', level: 3, residentAssignments: [{ raceId: 'goblin', count: 4 }], durability: 100, condition: 'normal', tileId: 'late:guard' }
    state.dungeon.rooms.late_trap = { instanceId: 'late_trap', definitionId: 'trap_room', level: 2, residentAssignments: [], durability: 100, condition: 'normal', tileId: 'late:trap' }
    state.dungeon.rooms.late_gate = { instanceId: 'late_gate', definitionId: 'reinforced_gate', level: 2, residentAssignments: [], durability: 100, condition: 'normal', tileId: 'late:gate' }
    const defense = calculateDungeonDefense(state)
    const elite = invaderDefinitionById.invader_elite_subjugation!
    expect(defense).toBe(94)
    expect(defense).toBeGreaterThan(elite.powerRange.min)
    expect(defense).toBeLessThan(elite.powerRange.max)
  })

  it('allows a staffed early farm to cover food consumption without explosive surplus', () => {
    let state = createInitialGameState()
    state = buildFacility(state, 'fungus_farm', '0:0:-1')
    state.dungeon.rooms['facility-mine-1']!.residentAssignments = [{ raceId: 'goblin', count: 2 }]
    state.dungeon.rooms[state.dungeon.tiles['0:0:-1']!.facilityInstanceId!]!.residentAssignments = [{ raceId: 'goblin', count: 2 }]
    state = processFoodConsumption(processDailyProduction(state))
    expect(state.resources.material).toBe(66)
    expect(state.resources.food).toBe(43)
  })
})
