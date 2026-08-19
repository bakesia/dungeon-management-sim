import { resourceDefinitionById } from '../../content/resources/resources'
import type { EffectDefinition, ResourceCost } from '../../types/content'
import type { GameState } from '../../types/game'
import { applyEffects } from '../effects/applyEffects'

export function canAfford(state: GameState, cost: ResourceCost): boolean {
  return Object.entries(cost).every(([resourceId, amount]) => (state.resources[resourceId] ?? 0) >= amount)
}

export function formatResourceCost(cost: ResourceCost): string {
  return Object.entries(cost)
    .map(([resourceId, amount]) => `${resourceDefinitionById[resourceId]?.name ?? resourceId} ${amount}`)
    .join(' · ')
}

export function payResourceCost(state: GameState, cost: ResourceCost, now = new Date()): GameState {
  if (!canAfford(state, cost)) {
    throw new Error(`Cannot pay resource cost: ${formatResourceCost(cost)}.`)
  }

  const effects: EffectDefinition[] = Object.entries(cost).map(([resourceId, amount]) => ({
    type: 'addResource',
    resourceId,
    amount: -amount,
  }))
  return applyEffects(state, effects, now)
}
