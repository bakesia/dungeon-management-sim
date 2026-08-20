import { describe, expect, it } from 'vitest'
import { createInitialGameState, tileId } from '../game/createInitialGameState'
import { buildFacility, canBuildFacility, demolishFacility, getDemolitionRefund, upgradeFacility } from './facilities'
import { facilityDefinitionById } from '../../content/facilities/facilities'

describe('facility construction', () => {
  it('builds, upgrades, and demolishes a data-defined facility', () => {
    const tile = tileId(0, -1)
    const built = buildFacility(createInitialGameState(), 'fungus_farm', tile)
    const instanceId = built.dungeon.tiles[tile]?.facilityInstanceId
    expect(instanceId).toBeTruthy()
    expect(built.resources.material).toBe(60)
    expect(built.dungeon.rooms[instanceId!]?.level).toBe(1)

    const upgraded = upgradeFacility(built, instanceId!)
    expect(upgraded.resources.material).toBe(30)
    expect(upgraded.dungeon.rooms[instanceId!]?.level).toBe(2)

    const demolished = demolishFacility(upgraded, instanceId!)
    expect(demolished.dungeon.tiles[tile]).toMatchObject({ terrain: 'floor', revealed: true, facilityInstanceId: undefined })
    expect(demolished.dungeon.rooms[instanceId!]).toBeUndefined()
    expect(demolished.resources.material).toBe(67)
    expect(demolished.logs.at(-1)?.message).toContain('75%')
  })

  it('never permits the dungeon core to be demolished', () => {
    expect(() => demolishFacility(createInitialGameState(), 'facility-core-1')).toThrow('철거할 수 없습니다')
  })

  it('uses facility data to enforce tier unlocks', () => {
    const state = createInitialGameState()
    expect(canBuildFacility(state, 'mana_chamber', tileId(0, -1)).allowed).toBe(false)
    expect(canBuildFacility(state, 'training_ground', tileId(0, -1)).allowed).toBe(false)

    state.currentTierId = 'tier_2'
    state.resources.material = 100
    expect(canBuildFacility(state, 'mana_chamber', tileId(0, -1)).allowed).toBe(true)
    expect(canBuildFacility(state, 'trap_room', tileId(0, -1)).allowed).toBe(true)
  })

  it('uses the final v0.1.14 facility tier roles', () => {
    expect(['quarters', 'mine', 'fungus_farm', 'warehouse', 'guard_post'].map((id) => facilityDefinitionById[id]?.requiredTier)).toEqual([1, 1, 1, 1, 1])
    expect(['mana_chamber', 'trap_room', 'mana_reservoir'].map((id) => facilityDefinitionById[id]?.requiredTier)).toEqual([2, 2, 2])
    expect(['reinforced_gate', 'infirmary'].map((id) => facilityDefinitionById[id]?.requiredTier)).toEqual([3, 3])
  })

  it('keeps Guard Room defense values while making it available at Tier 1', () => {
    const guardPost = facilityDefinitionById.guard_post!
    expect(guardPost.levels.map((level) => level.defense)).toEqual([3, 5, 7])
    expect(guardPost.levels.map((level) => level.modifiers?.find((modifier) => modifier.type === 'combatContributionMultiplier')?.value)).toEqual([1.25, 1.4, 1.55])
    expect(canBuildFacility(createInitialGameState(), 'guard_post', tileId(0, -1)).allowed).toBe(true)
  })

  it('refunds 75 percent of build and every paid upgrade cost at level 3', () => {
    let state = createInitialGameState()
    state.currentTierId = 'tier_2'
    state.resources = { ...state.resources, gold: 58, material: 118 }
    state = buildFacility(state, 'guard_post', tileId(0, -1))
    const instanceId = state.dungeon.tiles[tileId(0, -1)]!.facilityInstanceId!
    state = upgradeFacility(upgradeFacility(state, instanceId), instanceId)
    expect(getDemolitionRefund(state, instanceId)).toEqual({ gold: 43, material: 88 })
    const demolished = demolishFacility(state, instanceId)
    expect(demolished.resources.gold).toBe(43)
    expect(demolished.resources.material).toBe(88)
  })
})
