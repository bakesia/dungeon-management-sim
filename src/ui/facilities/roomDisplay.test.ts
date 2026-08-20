import { describe, expect, it } from 'vitest'
import { buildFacility, demolishFacility, upgradeFacility } from '../../engine/construction/facilities'
import { createInitialGameState, tileId } from '../../engine/game/createInitialGameState'
import { adjustResidentAssignment } from '../../engine/population/assignWorkers'
import type { GameState } from '../../types/game'
import { compareRoomsForDisplay, getRoomDisplayName } from './roomDisplay'

function getMineRooms(state: GameState) {
  return Object.values(state.dungeon.rooms)
    .filter((room) => room.definitionId === 'mine')
    .sort(compareRoomsForDisplay)
}

function getMineNames(state: GameState) {
  return getMineRooms(state).map((room) => getRoomDisplayName(state, room))
}

describe('room display names', () => {
  it('derives stable type-local numbers across save/load, renumbering, and instance actions', () => {
    let state = createInitialGameState()
    state = { ...state, resources: { ...state.resources, material: 500 } }
    state = buildFacility(state, 'mine', tileId(0, -1))
    state = buildFacility(state, 'mine', tileId(0, 1))

    const [, secondMine, thirdMine] = getMineRooms(state)
    expect(secondMine).toBeDefined()
    expect(thirdMine).toBeDefined()
    expect(getMineNames(state)).toEqual(['채굴장 1', '채굴장 2', '채굴장 3'])
    expect(getRoomDisplayName(state, state.dungeon.rooms['facility-quarters-1']!)).toBe('숙소 1')

    const loaded = JSON.parse(JSON.stringify(state)) as GameState
    expect(getMineNames(loaded)).toEqual(getMineNames(state))

    state = demolishFacility(state, secondMine!.instanceId)
    expect(getMineNames(state)).toEqual(['채굴장 1', '채굴장 2'])

    state = upgradeFacility(state, thirdMine!.instanceId)
    expect(state.dungeon.rooms[thirdMine!.instanceId]?.level).toBe(2)
    state = adjustResidentAssignment(state, thirdMine!.instanceId, 'goblin', 1)
    expect(state.dungeon.rooms[thirdMine!.instanceId]?.residentAssignments).toEqual([{ raceId: 'goblin', count: 1 }])

    state = buildFacility(state, 'mine', tileId(0, -1))
    expect(getMineNames(state)).toEqual(['채굴장 1', '채굴장 2', '채굴장 3'])
  })
})
