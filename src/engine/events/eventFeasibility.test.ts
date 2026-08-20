import { describe, expect, it } from 'vitest'
import { eventDefinitionById } from '../../content/events/events'
import { createInitialGameState } from '../game/createInitialGameState'
import { getEligibleChoices, getEventsWithNoEligibleChoices } from './processEvents'

describe('event choice feasibility', () => {
  const boundaryStates = [
    { name: 'all resources zero', mutate: (state: ReturnType<typeof createInitialGameState>) => { state.resources = { gold: 0, material: 0, food: 0, mana: 0 } } },
    { name: 'low population and core HP', mutate: (state: ReturnType<typeof createInitialGameState>) => { state.population = []; state.core.hp = 1 } },
    { name: 'full population', mutate: (state: ReturnType<typeof createInitialGameState>) => { state.population[0]!.count = 10 } },
    { name: 'Tier 3 with no resources', mutate: (state: ReturnType<typeof createInitialGameState>) => { state.currentTierId = 'tier_3'; state.resources = { gold: 0, material: 0, food: 0, mana: 0 } } },
  ]

  it.each(boundaryStates)('never exposes a condition-eligible event with zero choices: $name', ({ mutate }) => {
    const state = createInitialGameState()
    state.day = 30
    mutate(state)
    expect(getEventsWithNoEligibleChoices(state).map((event) => event.id)).toEqual([])
  })

  it('keeps the external rumor resolvable at zero Gold', () => {
    const state = createInitialGameState()
    state.day = 30
    state.resources.gold = 0
    const event = eventDefinitionById.event_outside_rumor!
    expect(getEligibleChoices(state, event).map((choice) => choice.id)).toContain('dismiss')
    expect(getEligibleChoices(state, event).map((choice) => choice.id)).not.toContain('pay')
  })
})
