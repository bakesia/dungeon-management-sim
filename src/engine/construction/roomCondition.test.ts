import { describe, expect, it } from 'vitest'
import { getPopulationCapacity } from '../population/populationMetrics'
import { adjustResidentAssignment } from '../population/assignWorkers'
import { processDailyProduction } from '../day/processDailyProduction'
import { applyEffect } from '../effects/applyEffects'
import { createInitialGameState } from '../game/createInitialGameState'
import { getRepairCost, repairFacility } from './repairFacility'

describe('room condition and repair', () => {
  it('reduces a damaged room production to 50 percent', () => {
    let state = createInitialGameState()
    state = adjustResidentAssignment(state, 'facility-mine-1', 'goblin', 1)
    state = adjustResidentAssignment(state, 'facility-mine-1', 'goblin', 1)
    state = applyEffect(state, { type: 'damageRoom', instanceId: 'facility-mine-1' })

    const next = processDailyProduction(state)

    expect(next.resources.material).toBe(83)
    expect(next.logs.at(-1)?.message).toContain('자재 +3')
  })

  it('pays the data-derived repair cost and restores normal condition', () => {
    let state = createInitialGameState()
    state = applyEffect(state, { type: 'damageRoom', instanceId: 'facility-mine-1' })

    expect(getRepairCost(state, 'facility-mine-1')).toEqual({ material: 7 })
    const repaired = repairFacility(state, 'facility-mine-1')

    expect(repaired.resources.material).toBe(73)
    expect(repaired.dungeon.rooms['facility-mine-1']?.condition).toBe('normal')
  })

  it('does not reduce housing capacity while quarters are damaged', () => {
    const state = createInitialGameState()
    const normalCapacity = getPopulationCapacity(state)
    const damaged = applyEffect(state, { type: 'damageRoom', instanceId: 'facility-quarters-1' })

    expect(getPopulationCapacity(damaged)).toBe(normalCapacity)
  })
})
