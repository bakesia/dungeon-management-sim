import type { GameState } from '../../types/game'
import { applyEffect } from '../effects/applyEffects'
import { processEventRoll, processNpcVisitRoll } from '../events/processEvents'
import { defaultRandomSource, type RandomSource } from '../random'
import { processInvasionRoll } from '../invasion/processInvasion'
import { processDailyProduction } from './processDailyProduction'
import { processFoodConsumption } from './processFoodConsumption'
import { processMaintenance } from './processMaintenance'
import { processPopulationState } from './processPopulationState'
import { processCoreRecovery } from './processCoreRecovery'
import { processNpcRuntime } from '../npcs/npcServices'
import { addDailyEconomySummary } from './dailyEconomy'
import { getExcavationCapacity } from '../dungeon/excavation'

export interface AdvanceDayContext {
  now?: Date
  randomSource?: RandomSource
}

export function advanceDay(state: GameState, context: AdvanceDayContext = {}): GameState {
  const now = context.now ?? new Date()
  const randomSource = context.randomSource ?? defaultRandomSource
  if (state.status !== 'playing') {
    throw new Error(`Cannot advance day while game status is "${state.status}".`)
  }
  if (state.events.currentEventId) {
    throw new Error('진행 중인 이벤트의 선택을 먼저 완료해야 합니다.')
  }
  if (state.events.pendingEventIds.length > 0 || state.populationJoin.pending || state.invasion.pendingResolution) {
    throw new Error('대기 중인 결정이나 침입 결과를 먼저 확인해야 합니다.')
  }

  let nextState = applyEffect(state, {
    type: 'addLog',
    category: 'system',
    message: `DAY ${state.day} 종료`,
  }, now)

  const economyStart = nextState
  const afterMaintenance = processMaintenance(nextState, now, false)
  const afterProduction = processDailyProduction(afterMaintenance, now, false)
  const afterFood = processFoodConsumption(afterProduction, now, false)
  nextState = addDailyEconomySummary(economyStart, afterMaintenance, afterProduction, afterFood, now)
  nextState = processPopulationState(nextState)
  nextState = processNpcRuntime(nextState, randomSource)
  nextState = processEventRoll(nextState, randomSource, now)
  nextState = processNpcVisitRoll(nextState, randomSource, now)
  nextState = processInvasionRoll(nextState, randomSource)
  nextState = processCoreRecovery(nextState, Boolean(nextState.invasion.pendingResolution), now)

  nextState = {
    ...nextState,
    day: nextState.day + 1,
    excavation: {
      actionsRemaining: getExcavationCapacity(),
    },
    statistics: {
      ...nextState.statistics,
      totalDaysPlayed: nextState.statistics.totalDaysPlayed + 1,
    },
    metadata: {
      ...nextState.metadata,
      updatedAt: now.toISOString(),
    },
  }

  if (nextState.status !== 'playing') return nextState

  return applyEffect(nextState, {
    type: 'addLog',
    category: 'system',
    message: `DAY ${nextState.day} 시작`,
  }, now)
}
