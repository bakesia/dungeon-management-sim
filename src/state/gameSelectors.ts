import { facilityDefinitionById } from '../content/facilities/facilities'
import { tierDefinitionById } from '../content/tiers/tiers'
import type { GameState } from '../types/game'

export function selectPopulationTotal(state: GameState): number {
  return state.population.reduce((total, group) => total + group.count, 0)
}

export function selectPopulationCapacity(state: GameState): number {
  return Object.values(state.dungeon.rooms).reduce((capacity, room) => {
    const definition = facilityDefinitionById[room.definitionId]
    const level = definition?.levels.find((item) => item.level === room.level)
    return capacity + (level?.populationCapacity ?? 0)
  }, 0)
}

export function selectCurrentTier(state: GameState) {
  return tierDefinitionById[state.currentTierId]
}
