import { describe, expect, it } from 'vitest'
import { processDailyProduction } from '../day/processDailyProduction'
import { buildFacility } from '../construction/facilities'
import { createInitialGameState } from '../game/createInitialGameState'
import { adjustWorkerAssignment, calculateFacilityEfficiency } from './assignWorkers'

describe('worker assignment and production', () => {
  it('applies linear efficiency to room effects', () => {
    const state = createInitialGameState()
    const assigned = adjustWorkerAssignment(state, 'facility-mine-1', 'worker', 1)
    const room = assigned.dungeon.rooms['facility-mine-1']

    expect(calculateFacilityEfficiency(room!)).toBe(0.5)
    const produced = processDailyProduction(assigned)
    expect(produced.resources.material).toBe(83)
  })

  it('does not assign more residents than the available job population', () => {
    let state = buildFacility(createInitialGameState(), 'fungus_farm', '0:0:-1')
    const farmId = state.dungeon.tiles['0:0:-1']?.facilityInstanceId
    state = adjustWorkerAssignment(state, 'facility-mine-1', 'worker', 1)
    state = adjustWorkerAssignment(state, 'facility-mine-1', 'worker', 1)
    state = adjustWorkerAssignment(state, farmId!, 'worker', 1)
    state = adjustWorkerAssignment(state, farmId!, 'worker', 1)

    const extraRoom = {
      ...state.dungeon.rooms[farmId!],
      instanceId: 'extra-farm',
      tileId: 'test-tile',
      assignedWorkers: {},
    }
    state = { ...state, dungeon: { ...state.dungeon, rooms: { ...state.dungeon.rooms, 'extra-farm': extraRoom } } }
    expect(() => adjustWorkerAssignment(state, 'extra-farm', 'worker', 1)).toThrow('배치 가능한 주민이 없습니다')
  })
})
