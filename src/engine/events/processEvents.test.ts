import { describe, expect, it } from 'vitest'
import { checkConditions } from '../conditions/checkConditions'
import { createInitialGameState } from '../game/createInitialGameState'
import { chooseEvent, getEligibleEvents, getEventWeight, processEventRoll, processNpcVisitRoll } from './processEvents'
import { eventDefinitionById } from '../../content/events/events'
import { processInvasionRoll } from '../invasion/processInvasion'

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

  it('allows one blank day but forces a daily event on the next day', () => {
    const state = createInitialGameState()
    state.day = 2
    const blank = processEventRoll(state, { next: () => 0.99 })
    expect(blank.events.currentEventId).toBeNull()
    expect(blank.events.daysSinceDailyEvent).toBe(1)

    const triggered = processEventRoll(blank, { next: () => 0 })
    expect(triggered.events.currentEventId).toBe('event_small_ore_vein')
    expect(triggered.events.daysSinceDailyEvent).toBe(0)

    const resolved = chooseEvent(triggered, 'mine')
    expect(resolved.events.currentEventId).toBeNull()
    expect(resolved.events.completedEventIds).toContain('event_small_ore_vein')
    expect(resolved.resources.material).toBe(92)
    expect(resolved.flags.ore_vein_found).toBe(true)
  })

  it('keeps daily pity separate from NPC visits and invasions', () => {
    const state = createInitialGameState()
    state.day = 8
    state.currentTierId = 'tier_2'
    state.events.daysSinceDailyEvent = 1
    const visited = processNpcVisitRoll(state, { next: () => 0 })
    expect(visited.events.currentEventId).toBe('event_npc_merchant_join')
    expect(visited.events.daysSinceDailyEvent).toBe(1)

    const invasionState = createInitialGameState()
    invasionState.events.daysSinceDailyEvent = 1
    invasionState.invasion.threat = 99
    const invaded = processInvasionRoll(invasionState, { next: () => 0 })
    expect(invaded.invasion.pendingResolution).not.toBeNull()
    expect(invaded.events.daysSinceDailyEvent).toBe(1)
  })

  it('queues an existing daily event behind a special visitor', () => {
    const state = createInitialGameState()
    state.day = 8
    state.currentTierId = 'tier_2'
    state.events.currentEventId = 'event_fungus_colony'
    const visited = processNpcVisitRoll(state, { next: () => 0 })
    expect(visited.events.currentEventId).toBe('event_npc_merchant_join')
    expect(visited.events.pendingEventIds).toEqual(['event_fungus_colony'])
  })

  it('connects precursor flags to follow-ups and NPC join prices', () => {
    const state = createInitialGameState()
    state.events.currentEventId = 'event_abandoned_cart'
    const helped = chooseEvent(state, 'track')
    expect(helped.flags.merchant_trail_followed).toBe(true)
    expect(getEligibleEvents(helped).some((event) => event.id === 'event_familiar_peddler')).toBe(true)
    const merchant = eventDefinitionById.event_npc_merchant_join!
    expect(checkConditions(helped, merchant.choices.find((choice) => choice.id === 'discount')?.conditions)).toBe(true)
    expect(checkConditions(helped, merchant.choices.find((choice) => choice.id === 'standard')?.conditions)).toBe(false)
  })

  it('connects blacksmith, tavern, mage, healer, and informant precursor chains', () => {
    const cases = [
      { seed: 'event_broken_forge_tools', choice: 'keep', flag: 'forge_tools_kept', follow: 'event_tools_owner', npc: 'event_npc_blacksmith_join', price: 'discount' },
      { seed: 'event_wandering_mercenaries', choice: 'welcome', flag: 'mercenaries_welcomed', follow: 'event_mercenary_tales', npc: 'event_npc_tavern_join', price: 'discount' },
      { seed: 'event_mana_anomaly', choice: 'stabilize', flag: 'mana_stabilized', follow: 'event_arcane_mark', npc: 'event_npc_mage_join', price: 'discount' },
      { seed: 'event_wounded_orc', choice: 'help', flag: 'compassionate_dungeon', follow: 'event_healers_rumor', npc: 'event_npc_healer_join', price: 'discount' },
      { seed: 'event_scout_traces', choice: 'study', flag: 'adventurer_scouted', follow: 'event_coded_scout_note', npc: null, price: null },
    ]
    cases.forEach((item) => {
      const state = createInitialGameState()
      state.day = 20
      state.events.currentEventId = item.seed
      const result = chooseEvent(state, item.choice)
      expect(result.flags[item.flag]).toBe(true)
      expect(getEligibleEvents(result).some((event) => event.id === item.follow)).toBe(true)
      if (item.npc && item.price) {
        const choice = eventDefinitionById[item.npc]?.choices.find((candidate) => candidate.id === item.price)
        expect(checkConditions(result, choice?.conditions)).toBe(true)
      }
    })

    const scouted = createInitialGameState()
    scouted.day = 20
    scouted.events.currentEventId = 'event_scout_traces'
    const decodedSeed = chooseEvent(scouted, 'study')
    decodedSeed.events.currentEventId = 'event_coded_scout_note'
    const decoded = chooseEvent(decodedSeed, 'decode')
    const discount = eventDefinitionById.event_npc_informant_join?.choices.find((choice) => choice.id === 'discount')
    expect(decoded.flags.intelligence_network_seed).toBe(true)
    expect(checkConditions(decoded, discount?.conditions)).toBe(true)
  })

  it('applies precursor surcharges and lets declined visitors retry after cooldown', () => {
    const state = createInitialGameState()
    state.currentTierId = 'tier_2'
    state.day = 8
    state.flags.merchant_goods_taken = true
    const merchant = eventDefinitionById.event_npc_merchant_join!
    expect(checkConditions(state, merchant.choices.find((choice) => choice.id === 'surcharge')?.conditions)).toBe(true)
    expect(checkConditions(state, merchant.choices.find((choice) => choice.id === 'standard')?.conditions)).toBe(false)

    const visited = processNpcVisitRoll(state, { next: () => 0 })
    const declined = chooseEvent(visited, 'decline')
    declined.events.history.push(
      { eventId: 'event_fungus_colony', day: 9 },
      { eventId: 'event_material_loss', day: 10 },
      { eventId: 'event_small_collapse', day: 11 },
      { eventId: 'event_mana_anomaly', day: 12 },
      { eventId: 'event_pantry_rats', day: 13 },
    )
    declined.day = 15
    expect(getEligibleEvents(declined).some((event) => event.id === merchant.id)).toBe(false)
    declined.day = 16
    expect(getEligibleEvents(declined).some((event) => event.id === merchant.id)).toBe(true)
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

  it('excludes the five most recent events and enforces the default eight-day cooldown', () => {
    const state = createInitialGameState(); state.day = 20
    state.events.history = [
      { eventId: 'event_fungus_colony', day: 13 },
      { eventId: 'event_material_loss', day: 16 },
      { eventId: 'event_small_collapse', day: 17 },
      { eventId: 'event_mana_anomaly', day: 18 },
      { eventId: 'event_wandering_merchant', day: 19 },
      { eventId: 'event_scout_traces', day: 20 },
    ]
    const eligible = getEligibleEvents(state).map((event) => event.id)
    expect(eligible).not.toContain('event_material_loss')
    expect(eligible).not.toContain('event_fungus_colony')
    state.day = 21
    expect(getEligibleEvents(state).map((event) => event.id)).toContain('event_fungus_colony')
  })

  it('reduces repeated category weight and boosts chain/NPC events', () => {
    const state = createInitialGameState(); state.day = 20
    state.events.history = [{ eventId: 'event_small_ore_vein', day: 1 }, { eventId: 'event_groundwater', day: 2 }]
    expect(getEventWeight(state, eventDefinitionById.event_old_chest!)).toBeCloseTo(7 * 0.35)
    const npcState = { ...state, currentTierId: 'tier_2', day: 20 }
    expect(getEventWeight(npcState, eventDefinitionById.event_npc_merchant_join!)).toBe(35)
  })

  it('permanently excludes completed once events', () => {
    const state = createInitialGameState(); state.day = 20
    state.events.completedEventIds = ['event_small_ore_vein']
    expect(getEligibleEvents(state).map((event) => event.id)).not.toContain('event_small_ore_vein')
  })
})
