import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/createInitialGameState'
import { applyEffect } from '../effects/applyEffects'
import { buildFacility, demolishFacility } from '../construction/facilities'
import { getResourceCapacity, isResourceOverCapacity, previewResourceChange } from './resourceCapacity'

describe('resource capacity', () => {
  it('derives base capacities from resource data', () => {
    const state = createInitialGameState()
    expect(getResourceCapacity(state, 'gold')).toBe(200)
    expect(getResourceCapacity(state, 'material')).toBe(200)
    expect(getResourceCapacity(state, 'food')).toBe(150)
    expect(getResourceCapacity(state, 'mana')).toBe(100)
  })

  it('stacks Warehouse capacity without affecting Mana', () => {
    let state = createInitialGameState()
    state.currentTierId = 'tier_2'
    state = buildFacility(state, 'warehouse', '0:0:-1')
    state = buildFacility(state, 'warehouse', '0:0:1')
    expect(getResourceCapacity(state, 'gold')).toBe(300)
    expect(getResourceCapacity(state, 'material')).toBe(350)
    expect(getResourceCapacity(state, 'food')).toBe(250)
    expect(getResourceCapacity(state, 'mana')).toBe(100)
  })

  it('uses Mana Reservoir only for Mana capacity', () => {
    let state = createInitialGameState()
    state.currentTierId = 'tier_3'
    state.resources.material = 100
    state.resources.mana = 50
    state = buildFacility(state, 'mana_reservoir', '0:0:-1')
    expect(getResourceCapacity(state, 'mana')).toBe(150)
    expect(getResourceCapacity(state, 'gold')).toBe(200)
  })

  it('clamps gains, reports overflow, and never permits negative resources', () => {
    const state = createInitialGameState()
    state.resources.material = 195
    const preview = previewResourceChange(state, 'material', 12)
    expect(preview).toMatchObject({ applied: 5, overflow: 7, next: 200 })
    const capped = applyEffect(state, { type: 'addResource', resourceId: 'material', amount: 12 })
    expect(capped.resources.material).toBe(200)
    expect(capped.logs.at(-1)?.message).toContain('공간 부족으로 7 손실')
    expect(applyEffect(capped, { type: 'addResource', resourceId: 'material', amount: -999 }).resources.material).toBe(0)
  })

  it('preserves over-cap stock after demolition and blocks gains until stock falls below the cap', () => {
    let state = createInitialGameState()
    state.currentTierId = 'tier_2'
    state = buildFacility(state, 'warehouse', '0:0:-1')
    const instanceId = state.dungeon.tiles['0:0:-1']!.facilityInstanceId!
    state.resources.material = 250
    state = demolishFacility(state, instanceId)
    expect(getResourceCapacity(state, 'material')).toBe(200)
    expect(state.resources.material).toBe(250)
    expect(isResourceOverCapacity(state, 'material')).toBe(true)
    expect(applyEffect(state, { type: 'addResource', resourceId: 'material', amount: 10 }).resources.material).toBe(250)
    const spent = applyEffect(state, { type: 'addResource', resourceId: 'material', amount: -60 })
    expect(spent.resources.material).toBe(190)
    expect(applyEffect(spent, { type: 'addResource', resourceId: 'material', amount: 20 }).resources.material).toBe(200)
  })
})
