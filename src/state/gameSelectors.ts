import { tierDefinitionById } from '../content/tiers/tiers'
import { getPopulationCapacity, getPopulationTotal } from '../engine/population/populationMetrics'
import type { GameState } from '../types/game'

export function selectPopulationTotal(state: GameState): number {
  return getPopulationTotal(state)
}

export function selectPopulationCapacity(state: GameState): number {
  return getPopulationCapacity(state)
}

export function selectCurrentTier(state: GameState) {
  return tierDefinitionById[state.currentTierId]
}
