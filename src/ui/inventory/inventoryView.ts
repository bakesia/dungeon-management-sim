import { itemDefinitionById } from '../../content/items/items'
import type { InventoryEntry } from '../../types/game'

export type InventoryTab = 'normal' | 'artifact'

export function getInventoryEntriesForTab(entries: InventoryEntry[], tab: InventoryTab): InventoryEntry[] {
  return entries.filter((entry) => (itemDefinitionById[entry.itemId]?.category === 'artifact') === (tab === 'artifact'))
}
