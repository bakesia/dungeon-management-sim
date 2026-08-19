import { describe, expect, it } from 'vitest'
import { createInitialGameState, tileId } from '../game/createInitialGameState'
import { buildFacility, demolishFacility, upgradeFacility } from './facilities'

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
    expect(demolished.dungeon.tiles[tile]?.status).toBe('empty')
    expect(demolished.dungeon.rooms[instanceId!]).toBeUndefined()
  })

  it('never permits the dungeon core to be demolished', () => {
    expect(() => demolishFacility(createInitialGameState(), 'facility-core-1')).toThrow('철거할 수 없습니다')
  })
})
