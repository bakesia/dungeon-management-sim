import { describe, expect, it } from 'vitest'
import { checkConditions } from '../conditions/checkConditions'
import { createInitialGameState } from '../game/createInitialGameState'
import { chooseEvent, getEligibleEvents, processEventRoll } from './processEvents'

describe('event engine', () => {
  it('supports the v0.1 condition set', () => {
    const state = createInitialGameState()
    expect(checkConditions(state, [
      { type: 'resourceAtLeast', resourceId: 'gold', amount: 100 },
      { type: 'resourceAtMost', resourceId: 'mana', amount: 30 },
      { type: 'populationAtLeast', amount: 5 },
      { type: 'populationSpaceAtLeast', amount: 0 },
      { type: 'hasRace', raceId: 'goblin' },
      { type: 'hasRoom', facilityId: 'mine', minLevel: 1 },
      { type: 'roomCountAtLeast', amount: 3 },
      { type: 'roomLevelCountAtLeast', minLevel: 1, amount: 3 },
      { type: 'defenseWinsAtLeast', amount: 0 },
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

  it('unlocks a follow-up event through a data-defined flag', () => {
    const state = createInitialGameState()
    state.day = 5
    state.dungeon.rooms['facility-quarters-1']!.level = 2
    expect(getEligibleEvents(state).some((event) => event.id === 'event_orc_returns')).toBe(false)

    state.events.currentEventId = 'event_wounded_orc'
    const helped = chooseEvent(state, 'help')

    expect(helped.flags.wounded_orc_helped).toBe(true)
    expect(getEligibleEvents(helped).some((event) => event.id === 'event_orc_returns')).toBe(true)
  })

  it('applies compound choice effects through the shared effect pipeline', () => {
    const state = createInitialGameState()
    state.events.currentEventId = 'event_old_storehouse'

    const resolved = chooseEvent(state, 'open')

    expect(resolved.resources.food).toBe(52)
    expect(resolved.resources.material).toBe(87)
    expect(resolved.logs.at(-1)?.message).toContain('보급품')
  })
})
