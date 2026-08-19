import { facilityDefinitionById } from '../../content/facilities/facilities'
import type { GameState } from '../../types/game'

export function getPopulationTotal(state: GameState): number {
  return state.population.reduce((total, group) => total + group.count, 0)
}

export function getPopulationCapacity(state: GameState): number {
  return Object.values(state.dungeon.rooms).reduce((capacity, room) => {
    const definition = facilityDefinitionById[room.definitionId]
    const level = definition?.levels.find((item) => item.level === room.level)
    return capacity + (level?.populationCapacity ?? 0)
  }, 0)
}

export function getPopulationSpace(state: GameState): number {
  return Math.max(0, getPopulationCapacity(state) - getPopulationTotal(state))
}
