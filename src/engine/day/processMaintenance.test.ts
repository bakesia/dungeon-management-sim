import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/createInitialGameState'
import { processDailyProduction } from './processDailyProduction'
import { getRoomGoldMaintenance, getTotalGoldMaintenance, processMaintenance } from './processMaintenance'
import { adjustResidentAssignment } from '../population/assignWorkers'
import { buildFacility } from '../construction/facilities'
import { calculateDungeonDefense } from '../invasion/calculateDungeonDefense'

describe('facility maintenance', () => {
  it('uses facility-level data and never charges the Core', () => {
    const state = createInitialGameState()
    expect(getRoomGoldMaintenance(state.dungeon.rooms['facility-core-1']!)).toBe(0)
    expect(getTotalGoldMaintenance(state)).toBe(1)
    state.dungeon.rooms['facility-mine-1']!.level = 3
    expect(getTotalGoldMaintenance(state)).toBe(2)
  })

  it('pays a single total without debt and applies a predictable shortage penalty', () => {
    let state = createInitialGameState()
    state = buildFacility(state, 'guard_post', '0:0:-1')
    state.resources.gold = 1
    const short = processMaintenance(state)
    expect(short.resources.gold).toBe(0)
    expect(short.maintenance).toEqual({ requiredGold: 2, paidGold: 1, shortfall: 1, efficiencyMultiplier: 0.75 })
    expect(short.logs.at(-1)?.message).toContain('골드 1/2')

    short.resources.gold = 10
    const recovered = processMaintenance(short)
    expect(recovered.maintenance.efficiencyMultiplier).toBe(1)
    expect(recovered.maintenance.shortfall).toBe(0)
  })

  it('reduces same-day production when maintenance is short', () => {
    let state = createInitialGameState()
    state = adjustResidentAssignment(state, 'facility-mine-1', 'goblin', 1)
    state = adjustResidentAssignment(state, 'facility-mine-1', 'goblin', 1)
    state.resources.gold = 0
    const maintained = processMaintenance(state)
    const produced = processDailyProduction(maintained)
    expect(produced.resources.material - state.resources.material).toBe(4)
  })


  it('applies the same-day penalty to defense', () => {
    let state = createInitialGameState()
    state = buildFacility(state, 'guard_post', '0:0:-1')
    state = adjustResidentAssignment(state, state.dungeon.tiles['0:0:-1']!.facilityInstanceId!, 'goblin', 1)
    state = adjustResidentAssignment(state, state.dungeon.tiles['0:0:-1']!.facilityInstanceId!, 'goblin', 1)
    const fullyPaid = processMaintenance(state)
    const shortState = { ...state, resources: { ...state.resources, gold: 0 } }
    const unpaid = processMaintenance(shortState)
    expect(calculateDungeonDefense(unpaid)).toBeLessThan(calculateDungeonDefense(fullyPaid))
  })
})
