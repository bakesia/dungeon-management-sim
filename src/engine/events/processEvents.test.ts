import { describe, expect, it } from 'vitest'
import { checkConditions } from '../conditions/checkConditions'
import { createInitialGameState } from '../game/createInitialGameState'
import { canChooseEventChoice, chooseEvent, getEligibleEvents, getEligibleNpcVisitEvents, getEventWeight, processEventRoll, processNpcVisitRoll } from './processEvents'
import { eventDefinitionById } from '../../content/events/events'
import { processInvasionRoll } from '../invasion/processInvasion'
import { processNpcRuntime } from '../npcs/npcServices'
import { updateNpcEligibility } from '../npcs/npcEligibility'
import { applyEffect } from '../effects/applyEffects'

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
    const visited = processNpcVisitRoll(processNpcRuntime(state, { next: () => 0 }), { next: () => 0 })
    expect(visited.events.currentEventId).toBe('event_npc_merchant_join')
    expect(visited.events.daysSinceDailyEvent).toBe(1)

    const invasionState = createInitialGameState()
    invasionState.events.daysSinceDailyEvent = 1
    invasionState.invasion.daysSinceLastInvasion = 8
    const invaded = processInvasionRoll(invasionState, { next: () => 0 })
    expect(invaded.invasion.pendingResolution).not.toBeNull()
    expect(invaded.events.daysSinceDailyEvent).toBe(1)
  })

  it('queues an existing daily event behind a special visitor', () => {
    const state = createInitialGameState()
    state.day = 8
    state.currentTierId = 'tier_2'
    state.events.currentEventId = 'event_fungus_colony'
    const visited = processNpcVisitRoll(processNpcRuntime(state, { next: () => 0 }), { next: () => 0 })
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

    const visited = processNpcVisitRoll(processNpcRuntime(state, { next: () => 0 }), { next: () => 0 })
    const declined = chooseEvent(visited, 'decline')
    declined.day = 12
    expect(getEligibleNpcVisitEvents(declined).some((event) => event.id === merchant.id)).toBe(false)
    declined.day = 13
    expect(getEligibleNpcVisitEvents(declined).some((event) => event.id === merchant.id)).toBe(true)
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

  it('persists NPC eligibility after a threshold is reached', () => {
    const state = createInitialGameState()
    state.day = 3
    const eligible = updateNpcEligibility(state)
    expect(eligible.npcs.npc_merchant).toMatchObject({ eligible: true, eligibleSinceDay: 3 })
    eligible.resources.gold = 0
    expect(updateNpcEligibility(eligible).npcs.npc_merchant?.eligible).toBe(true)
  })

  it('captures NPC eligibility before spending a fulfilled resource threshold', () => {
    const state = createInitialGameState()
    state.day = 3
    const spent = applyEffect(state, { type: 'addResource', resourceId: 'gold', amount: -90 })
    expect(spent.resources.gold).toBe(10)
    expect(spent.npcs.npc_merchant).toMatchObject({ eligible: true, eligibleSinceDay: 3 })
  })

  it('never offers a join event again after the NPC joins', () => {
    const state = createInitialGameState()
    state.day = 3
    const eligible = updateNpcEligibility(state)
    eligible.events.currentEventId = 'event_npc_merchant_join'
    const joined = chooseEvent(eligible, 'standard')
    joined.day = 30
    expect(joined.npcs.npc_merchant?.joined).toBe(true)
    expect(getEligibleNpcVisitEvents(joined).map((event) => event.id)).not.toContain('event_npc_merchant_join')
  })

  it('uses the shared choice predicate for both Tavern price paths', () => {
    const state = createInitialGameState()
    state.currentTierId = 'tier_2'
    state.day = 8
    const tavern = eventDefinitionById.event_npc_tavern_join!
    const standard = tavern.choices.find((choice) => choice.id === 'standard')!
    const discount = tavern.choices.find((choice) => choice.id === 'discount')!
    expect(canChooseEventChoice(state, standard)).toBe(true)
    expect(canChooseEventChoice(state, discount)).toBe(false)
    state.flags.mercenaries_welcomed = true
    expect(canChooseEventChoice(state, standard)).toBe(false)
    expect(canChooseEventChoice(state, discount)).toBe(true)
  })

  it('marks multiple NPCs eligible but presents at most one visit per DAY', () => {
    const state = createInitialGameState()
    state.currentTierId = 'tier_2'
    state.day = 8
    const eligible = updateNpcEligibility(state)
    expect(Object.values(eligible.npcs).filter((npc) => npc.eligible && !npc.joined).length).toBeGreaterThanOrEqual(2)
    const visited = processNpcVisitRoll(eligible, { next: () => 0 })
    expect(visited.events.history.filter((entry) => entry.day === 8 && entry.eventId.startsWith('event_npc_')).length).toBe(1)
    expect(getEligibleNpcVisitEvents(visited).length).toBeGreaterThanOrEqual(1)
    const rolledAgain = processNpcVisitRoll(visited, { next: () => 0 })
    expect(rolledAgain.events.history.filter((entry) => entry.day === 8 && entry.eventId.startsWith('event_npc_')).length).toBe(1)
  })

  it('does not increase 악명 when quietly treating the fallen traveler', () => {
    const state = createInitialGameState()
    state.resources.food = 20
    state.events.currentEventId = 'event_wounded_traveler'
    const treated = chooseEvent(state, 'treat')
    expect(treated.invasion.fame).toBe(0)
    expect(treated.logs.some((entry) => entry.message.includes('악명 +'))).toBe(false)
  })
})
