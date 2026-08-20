import { describe, expect, it } from 'vitest'
import { getInventoryEntriesForTab } from './inventoryView'

describe('inventory tabs', () => {
  const entries = [
    { itemId: 'loot_broken_blade', quantity: 2 },
    { itemId: 'artifact_ward_rune', quantity: 1 },
    { itemId: 'loot_adventurer_pack', quantity: 1 },
  ]

  it('separates normal items and artifacts', () => {
    expect(getInventoryEntriesForTab(entries, 'normal').map((entry) => entry.itemId)).toEqual(['loot_broken_blade', 'loot_adventurer_pack'])
    expect(getInventoryEntriesForTab(entries, 'artifact').map((entry) => entry.itemId)).toEqual(['artifact_ward_rune'])
  })
})
