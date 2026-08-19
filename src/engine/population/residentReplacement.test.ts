import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/createInitialGameState'
import { adjustResidentAssignment } from './assignWorkers'
import { confirmPopulationReplacement, declinePopulationJoin, offerPopulationJoin } from './residentReplacement'

describe('resident replacement', () => {
  it('joins immediately when capacity is available', () => {
    const state = createInitialGameState()
    state.dungeon.rooms['facility-quarters-1']!.level = 2
    const joined = offerPopulationJoin(state, 'orc', 2)
    expect(joined.populationJoin.pending).toBeNull()
    expect(joined.population.find((group) => group.raceId === 'orc')?.count).toBe(2)
  })

  it('requires an exact replacement count and removes idle residents first', () => {
    let state = createInitialGameState()
    state = adjustResidentAssignment(state, 'facility-mine-1', 'goblin', 1)
    state = adjustResidentAssignment(state, 'facility-mine-1', 'goblin', 1)
    state = offerPopulationJoin(state, 'orc', 4)

    expect(() => confirmPopulationReplacement(state, { goblin: 3 })).toThrow('정확히 4명')
    const replaced = confirmPopulationReplacement(state, { goblin: 4 })
    expect(replaced.population.reduce((total, group) => total + group.count, 0)).toBe(5)
    expect(replaced.population.find((group) => group.raceId === 'goblin')?.count).toBe(1)
    expect(replaced.population.find((group) => group.raceId === 'orc')?.count).toBe(4)
    expect(replaced.dungeon.rooms['facility-mine-1']?.residentAssignments).toEqual([{ raceId: 'goblin', count: 1 }])
    expect(replaced.logs.some((entry) => entry.message.includes('채굴장 배치 인원 -1'))).toBe(true)
  })

  it('can decline a pending join without changing population', () => {
    const state = offerPopulationJoin(createInitialGameState(), 'imp', 1)
    const declined = declinePopulationJoin(state)
    expect(declined.populationJoin.pending).toBeNull()
    expect(declined.population).toEqual(createInitialGameState().population)
  })
})
