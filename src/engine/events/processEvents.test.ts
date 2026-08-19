import { describe, expect, it } from 'vitest'
import { checkConditions } from '../conditions/checkConditions'
import { createInitialGameState } from '../game/createInitialGameState'
import { chooseEvent, processEventRoll } from './processEvents'

describe('event engine', () => {
  it('supports the v0.1 condition set', () => {
    const state = createInitialGameState()
    expect(checkConditions(state, [
      { type: 'resourceAtLeast', resourceId: 'gold', amount: 100 },
      { type: 'resourceAtMost', resourceId: 'mana', amount: 30 },
      { type: 'populationAtLeast', amount: 5 },
      { type: 'hasRace', raceId: 'goblin' },
      { type: 'hasRoom', facilityId: 'mine', minLevel: 1 },
      { type: 'tierAtLeast', level: 1 },
      { type: 'flagEquals', flag: 'missing_flag', value: false },
      { type: 'dayAtLeast', day: 1 },
    ])).toBe(true)
  })

  it('forces an eligible event after three consecutive eventless days and resolves its choice', () => {
    const state = createInitialGameState()
    state.day = 2
    state.events.daysSinceLastEvent = 2

    const triggered = processEventRoll(state, { next: () => 0 })
    expect(triggered.events.currentEventId).toBe('event_small_ore_vein')

    const resolved = chooseEvent(triggered, 'mine')
    expect(resolved.events.currentEventId).toBeNull()
    expect(resolved.events.completedEventIds).toContain('event_small_ore_vein')
    expect(resolved.resources.material).toBe(92)
    expect(resolved.flags.ore_vein_found).toBe(true)
  })
})
