import { describe, expect, it } from 'vitest'
import { applyEffect } from '../effects/applyEffects'
import { createInitialGameState } from '../game/createInitialGameState'
import { calculateDungeonDefense } from '../invasion/calculateDungeonDefense'
import { hireMercenary, isFeatureUnlocked, performNpcService, processNpcRuntime, purchaseShopItem, repairWithBlacksmith } from './npcServices'
import { chooseEvent } from '../events/processEvents'

function join(state: ReturnType<typeof createInitialGameState>, npcId: string) { return applyEffect(state, { type: 'joinNpc', npcId }) }

describe('NPC services', () => {
  it('joins an NPC through the generic event effect and unlocks its feature', () => {
    const state = createInitialGameState(); state.currentTierId = 'tier_2'; state.day = 8; state.events.currentEventId = 'event_npc_merchant_join'
    const joined = chooseEvent(state, 'standard')
    expect(joined.resources.gold).toBe(70)
    expect(joined.npcs.npc_merchant?.joined).toBe(true)
    expect(isFeatureUnlocked(joined, 'shop')).toBe(true)
  })

  it('unlocks stock-limited shop purchases through the merchant', () => {
    let state = join(createInitialGameState(), 'npc_merchant')
    state = purchaseShopItem(state, 'emergency_food')
    expect(state.resources.gold).toBe(85)
    expect(state.resources.food).toBe(60)
    expect(state.shop.offerings.find((item) => item.itemId === 'emergency_food')?.stock).toBe(1)
  })

  it('adds temporary mercenary defense and mana support effects', () => {
    let state = join(createInitialGameState(), 'npc_tavern_keeper')
    const baseDefense = calculateDungeonDefense(state)
    state = hireMercenary(state, 'orc_mercenaries')
    expect(calculateDungeonDefense(state)).toBe(baseDefense + 25)
    expect(state.resources.gold).toBe(60)

    state = join(state, 'npc_mage'); state.resources.mana = 100
    state = performNpcService(state, 'arcane_barrier')
    expect(calculateDungeonDefense(state)).toBe(baseDefense + 50)
    expect(state.resources.mana).toBe(70)
    state.day = state.activeMercenaries[0]!.expiresOnDay
    expect(processNpcRuntime(state).activeMercenaries).toHaveLength(0)
  })

  it('refreshes shop stock and applies healer and informant effects', () => {
    let state = join(createInitialGameState(), 'npc_merchant'); state.currentTierId = 'tier_2'; state.day = 5
    state = processNpcRuntime(state, { next: () => 0 })
    expect(state.shop.lastRefreshDay).toBe(5)
    expect(state.shop.offerings).toHaveLength(3)
    state = join(state, 'npc_healer'); state = performNpcService(state, 'recovery_supplies')
    expect(state.timedModifiers.some((item) => item.type === 'residentLossChanceMultiplier')).toBe(true)
    state = join(state, 'npc_informant'); state = performNpcService(state, 'intel_power')
    expect(state.invasion.intel.powerRange).toBe(true)
  })

  it('uses the blacksmith discount and repairs a damaged facility', () => {
    let state = join(createInitialGameState(), 'npc_blacksmith')
    state = applyEffect(state, { type: 'damageRoom', instanceId: 'facility-mine-1' })
    state = repairWithBlacksmith(state, 'facility-mine-1')
    expect(state.resources.material).toBe(74)
    expect(state.dungeon.rooms['facility-mine-1']?.condition).toBe('normal')
  })
})
