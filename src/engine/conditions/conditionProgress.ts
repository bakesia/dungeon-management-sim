import { resourceDefinitionById } from '../../content/resources/resources'
import type { ConditionDefinition } from '../../types/content'
import type { GameState } from '../../types/game'
import { getPopulationCapacity, getPopulationSpace, getPopulationTotal } from '../population/populationMetrics'
import { checkCondition } from './checkConditions'

export interface ConditionProgress {
  label: string
  current: number
  target: number
  met: boolean
}

export function getConditionProgress(state: GameState, condition: ConditionDefinition): ConditionProgress {
  if (condition.type === 'roomCountAtLeast') {
    return { label: '방', current: Object.keys(state.dungeon.rooms).length, target: condition.amount, met: checkCondition(state, condition) }
  }
  if (condition.type === 'populationAtLeast') {
    return { label: '인구', current: getPopulationTotal(state), target: condition.amount, met: checkCondition(state, condition) }
  }
  if (condition.type === 'populationSpaceAtLeast') {
    return { label: `빈 수용 인원 (최대 ${getPopulationCapacity(state)})`, current: getPopulationSpace(state), target: condition.amount, met: checkCondition(state, condition) }
  }
  if (condition.type === 'roomLevelCountAtLeast') {
    const current = Object.values(state.dungeon.rooms).filter((room) => room.level >= condition.minLevel).length
    return { label: `Lv.${condition.minLevel}+ 시설`, current, target: condition.amount, met: checkCondition(state, condition) }
  }
  if (condition.type === 'defenseWinsAtLeast') {
    return { label: '방어 성공', current: state.statistics.successfulDefenses, target: condition.amount, met: checkCondition(state, condition) }
  }
  if (condition.type === 'resourceAtLeast') {
    return { label: resourceDefinitionById[condition.resourceId]?.name ?? condition.resourceId, current: state.resources[condition.resourceId] ?? 0, target: condition.amount, met: checkCondition(state, condition) }
  }
  if (condition.type === 'tierAtLeast') {
    return { label: 'Tier', current: Number(state.currentTierId.replace('tier_', '')) || 1, target: condition.level, met: checkCondition(state, condition) }
  }

  return { label: condition.type, current: checkCondition(state, condition) ? 1 : 0, target: 1, met: checkCondition(state, condition) }
}
