import type { GameState } from '../../types/game'
import { applyEffect } from '../effects/applyEffects'
import { processEventRoll } from '../events/processEvents'
import { defaultRandomSource, type RandomSource } from '../random'
import { processInvasionRoll } from '../invasion/processInvasion'
import { processDailyProduction } from './processDailyProduction'
import { processFoodConsumption } from './processFoodConsumption'
import { processMaintenance } from './processMaintenance'
import { processPopulationState } from './processPopulationState'
import { processProgression } from './processProgression'

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

  let nextState = applyEffect(state, {
    type: 'addLog',
    category: 'system',
    message: `DAY ${state.day} 종료`,
  }, now)

  nextState = processDailyProduction(nextState, now)
  nextState = processFoodConsumption(nextState, now)
  nextState = processMaintenance(nextState, now)
  nextState = processPopulationState(nextState)
  nextState = processEventRoll(nextState, randomSource, now)
  nextState = processInvasionRoll(nextState, randomSource, now)
  nextState = processProgression(nextState, now)

  nextState = {
    ...nextState,
    day: nextState.day + 1,
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
