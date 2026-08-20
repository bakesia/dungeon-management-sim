import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/createInitialGameState'
import { adjustResidentAssignment } from './assignWorkers'
import { confirmPopulationReplacement, declinePopulationJoin, offerPopulationJoin } from './residentReplacement'
import { queuePopulationOffer } from './populationOffer'

describe('resident replacement', () => {
  it('keeps a decision pending even when capacity is available so part of a group can join', () => {
    const state = createInitialGameState()
    state.dungeon.rooms['facility-quarters-1']!.level = 2
    const joined = offerPopulationJoin(state, 'orc', 2)
    expect(joined.populationJoin.pending?.incoming).toEqual([{ raceId: 'orc', count: 2 }])
    const accepted = confirmPopulationReplacement(joined, { orc: 1 }, {})
    expect(accepted.population.find((group) => group.raceId === 'orc')?.count).toBe(1)
  })

  it('requires an exact replacement count and removes idle residents first', () => {
    let state = createInitialGameState()
    state = adjustResidentAssignment(state, 'facility-mine-1', 'goblin', 1)
    state = adjustResidentAssignment(state, 'facility-mine-1', 'goblin', 1)
    state = offerPopulationJoin(state, 'orc', 4)

    expect(() => confirmPopulationReplacement(state, { orc: 4 }, { goblin: 3 })).toThrow('정확히 4명')
    const replaced = confirmPopulationReplacement(state, { orc: 4 }, { goblin: 4 })
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

  it('prorates tavern costs by the number actually accepted', () => {
    let state = createInitialGameState()
    state.dungeon.rooms['facility-quarters-1']!.level = 2
    state = queuePopulationOffer(state, { incoming: [{ raceId: 'goblin', count: 2 }], source: 'tavern', sourceId: 'recruit_goblin_pair', cost: { gold: 24, food: 10 } })
    const accepted = confirmPopulationReplacement(state, { goblin: 1 }, {})
    expect(accepted.resources).toMatchObject({ gold: 88, food: 35 })
    expect(accepted.population.find((group) => group.raceId === 'goblin')?.count).toBe(6)
  })

  it('accepts mixed-race incoming groups independently', () => {
    let state = createInitialGameState()
    state.dungeon.rooms['facility-quarters-1']!.level = 2
    state = queuePopulationOffer(state, { incoming: [{ raceId: 'goblin', count: 2 }, { raceId: 'imp', count: 2 }], source: 'event' })
    const accepted = confirmPopulationReplacement(state, { goblin: 1, imp: 2 }, {})
    expect(accepted.population.find((group) => group.raceId === 'goblin')?.count).toBe(6)
    expect(accepted.population.find((group) => group.raceId === 'imp')?.count).toBe(2)
  })
})
