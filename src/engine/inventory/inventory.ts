import { itemDefinitionById } from '../../content/items/items'
import type { ItemDefinition, ItemId, ItemModifierDefinition } from '../../types/content'
import type { GameState } from '../../types/game'

export function getItemQuantity(state: GameState, itemId: ItemId): number {
  return state.inventory.find((entry) => entry.itemId === itemId)?.quantity ?? 0
}

export function hasItem(state: GameState, itemId: ItemId, quantity = 1): boolean {
  return getItemQuantity(state, itemId) >= quantity
}

export function addItem(state: GameState, itemId: ItemId, quantity: number): GameState {
  if (!itemDefinitionById[itemId]) throw new Error(`알 수 없는 아이템입니다: ${itemId}`)
  if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('추가할 아이템 수량이 올바르지 않습니다.')
  const exists = state.inventory.some((entry) => entry.itemId === itemId)
  return { ...state, inventory: exists
    ? state.inventory.map((entry) => entry.itemId === itemId ? { ...entry, quantity: entry.quantity + quantity } : entry)
    : [...state.inventory, { itemId, quantity }] }
}

export function removeItem(state: GameState, itemId: ItemId, quantity: number): GameState {
  if (!Number.isInteger(quantity) || quantity <= 0 || !hasItem(state, itemId, quantity)) throw new Error('판매하거나 제거할 아이템 수량이 부족합니다.')
  return { ...state, inventory: state.inventory.flatMap((entry) => entry.itemId !== itemId ? [entry] : entry.quantity === quantity ? [] : [{ ...entry, quantity: entry.quantity - quantity }]) }
}

export function getOwnedArtifacts(state: GameState): ItemDefinition[] {
  return state.inventory.flatMap((entry) => {
    const item = itemDefinitionById[entry.itemId]
    return item?.category === 'artifact' && entry.quantity > 0 ? [item] : []
  })
}

export function getActiveArtifactModifiers(state: GameState): ItemModifierDefinition[] {
  return getOwnedArtifacts(state).flatMap((item) => item.modifiers ?? [])
}
