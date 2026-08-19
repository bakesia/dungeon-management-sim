import { facilityDefinitionById } from '../../content/facilities/facilities'
import type { RaceId } from '../../types/content'
import type { GameState } from '../../types/game'
import { getAssignedResidents, getAssignedResidentsByRace, getPopulationByRace } from './assignWorkers'

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

export { getPopulationByRace }

export function getAssignedPopulation(state: GameState): number {
  return getAssignedResidents(state)
}

export function getIdlePopulation(state: GameState): number {
  return Math.max(0, getPopulationTotal(state) - getAssignedPopulation(state))
}

export function getRacePopulationSummary(state: GameState, raceId: RaceId) {
  const total = getPopulationByRace(state, raceId)
  const assigned = getAssignedResidentsByRace(state, raceId)
  const placements = Object.values(state.dungeon.rooms).flatMap((room) => {
    const count = room.residentAssignments
      .filter((assignment) => assignment.raceId === raceId)
      .reduce((sum, assignment) => sum + assignment.count, 0)
    if (count <= 0) return []
    return [{ roomId: room.instanceId, name: facilityDefinitionById[room.definitionId]?.name ?? room.definitionId, count }]
  })
  return { total, assigned, idle: Math.max(0, total - assigned), placements }
}
