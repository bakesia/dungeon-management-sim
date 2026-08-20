import { describe, expect, it } from 'vitest'
import { applyEffect } from '../effects/applyEffects'
import { createInitialGameState } from '../game/createInitialGameState'
import { calculateDungeonDefense } from '../invasion/calculateDungeonDefense'
import { getResourceCapacity } from '../resources/resourceCapacity'
import { addItem, getItemQuantity, hasItem, removeItem } from './inventory'
import { sellInventoryItem } from '../npcs/npcServices'

describe('inventory and artifacts', () => {
  it('adds, stacks, checks, and removes inventory centrally', () => {
    let state = createInitialGameState()
    state = addItem(state, 'loot_broken_blade', 2)
    state = addItem(state, 'loot_broken_blade', 1)
    expect(getItemQuantity(state, 'loot_broken_blade')).toBe(3)
    expect(hasItem(state, 'loot_broken_blade', 3)).toBe(true)
    expect(removeItem(state, 'loot_broken_blade', 2).inventory).toEqual([{ itemId: 'loot_broken_blade', quantity: 1 }])
    expect(() => removeItem(state, 'loot_broken_blade', 4)).toThrow('수량이 부족')
    expect(() => addItem(state, 'missing_item', 1)).toThrow('알 수 없는 아이템')
  })

  it('auto-applies each artifact definition once even when duplicate copies exist', () => {
    let state = createInitialGameState()
    const baseDefense = calculateDungeonDefense(state)
    const baseCapacity = getResourceCapacity(state, 'gold')
    state = addItem(state, 'artifact_ward_rune', 2)
    state = addItem(state, 'artifact_hoard_stone', 1)
    expect(calculateDungeonDefense(state)).toBe(baseDefense + 5)
    expect(getResourceCapacity(state, 'gold')).toBe(baseCapacity + 20)
  })

  it('sells loot for its unit value after the merchant joins', () => {
    let state = applyEffect(createInitialGameState(), { type: 'joinNpc', npcId: 'npc_merchant' })
    state = addItem(state, 'loot_armor_scrap', 2)
    state = sellInventoryItem(state, 'loot_armor_scrap', 2)
    expect(state.resources.gold).toBe(118)
    expect(getItemQuantity(state, 'loot_armor_scrap')).toBe(0)
  })

  it('can sell an artifact and immediately removes its passive effect', () => {
    let state = applyEffect(createInitialGameState(), { type: 'joinNpc', npcId: 'npc_merchant' })
    state = addItem(state, 'artifact_ward_rune', 1)
    const defended = calculateDungeonDefense(state)
    state = sellInventoryItem(state, 'artifact_ward_rune', 1)
    expect(calculateDungeonDefense(state)).toBe(defended - 5)
  })
})
