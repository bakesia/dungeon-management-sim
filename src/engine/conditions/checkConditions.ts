import { tierDefinitionById } from '../../content/tiers/tiers'
import type { ConditionDefinition } from '../../types/content'
import type { GameState } from '../../types/game'
import { getPopulationSpace, getPopulationTotal } from '../population/populationMetrics'

export function checkCondition(state: GameState, condition: ConditionDefinition): boolean {
  if (condition.type === 'resourceAtLeast') return (state.resources[condition.resourceId] ?? 0) >= condition.amount
  if (condition.type === 'resourceAtMost') return (state.resources[condition.resourceId] ?? 0) <= condition.amount
  if (condition.type === 'populationAtLeast') {
    return getPopulationTotal(state) >= condition.amount
  }
  if (condition.type === 'populationSpaceAtLeast') return getPopulationSpace(state) >= condition.amount
  if (condition.type === 'hasRace') return state.population.some((group) => group.raceId === condition.raceId && group.count > 0)
  if (condition.type === 'hasRoom') {
    return Object.values(state.dungeon.rooms).some(
      (room) => room.definitionId === condition.facilityId && room.level >= (condition.minLevel ?? 1),
    )
  }
  if (condition.type === 'roomCountAtLeast') return Object.keys(state.dungeon.rooms).length >= condition.amount
  if (condition.type === 'roomLevelCountAtLeast') {
    return Object.values(state.dungeon.rooms).filter((room) => room.level >= condition.minLevel).length >= condition.amount
  }
  if (condition.type === 'defenseWinsAtLeast') return state.statistics.successfulDefenses >= condition.amount
  if (condition.type === 'tierAtLeast') return (tierDefinitionById[state.currentTierId]?.level ?? 0) >= condition.level
  if (condition.type === 'flagEquals') return (state.flags[condition.flag] ?? false) === condition.value
  if (condition.type === 'dayAtLeast') return state.day >= condition.day
  return false
}

export function checkConditions(state: GameState, conditions: ConditionDefinition[] = []): boolean {
  return conditions.every((condition) => checkCondition(state, condition))
}
