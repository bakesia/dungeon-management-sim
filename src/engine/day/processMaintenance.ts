import { facilityDefinitionById } from '../../content/facilities/facilities'
import { gameRules } from '../../content/gameRules'
import { resourceDefinitionById } from '../../content/resources/resources'
import type { FacilityInstance, GameState } from '../../types/game'
import { applyEffect, applyEffects } from '../effects/applyEffects'
import { getFacilityLevel } from '../population/assignWorkers'

export function getRoomGoldMaintenance(room: FacilityInstance): number {
  const definition = facilityDefinitionById[room.definitionId]
  if (!definition?.buildable) return 0
  return getFacilityLevel(room)?.goldMaintenance ?? 0
}

export function getTotalGoldMaintenance(state: GameState): number {
  return Object.values(state.dungeon.rooms).reduce((total, room) => total + getRoomGoldMaintenance(room), 0)
}

export function processMaintenance(state: GameState, now = new Date(), addSummaryLog = true): GameState {
  const requiredGold = getTotalGoldMaintenance(state)
  const paidGold = Math.min(state.resources.gold ?? 0, requiredGold)
  const shortfall = requiredGold - paidGold
  const efficiencyMultiplier = shortfall > 0 ? gameRules.maintenance.unpaidEfficiencyMultiplier : 1
  let nextState: GameState = {
    ...state,
    resources: { ...state.resources, gold: Math.max(0, (state.resources.gold ?? 0) - paidGold) },
    maintenance: { requiredGold, paidGold, shortfall, efficiencyMultiplier },
  }

  const secondaryEffects = Object.values(nextState.dungeon.rooms).flatMap((room) =>
    (getFacilityLevel(room)?.maintenanceEffects ?? []).filter(
      (effect) => effect.type !== 'addResource' || effect.resourceId !== 'gold',
    ),
  )
  nextState = applyEffects(nextState, secondaryEffects, now)

  const secondaryText = secondaryEffects.flatMap((effect) => {
    if (effect.type !== 'addResource') return []
    return [`${resourceDefinitionById[effect.resourceId]?.name ?? effect.resourceId} ${effect.amount}`]
  }).join(' · ')
  if (!addSummaryLog && shortfall === 0) return nextState
  nextState = applyEffect(nextState, {
    type: 'addLog',
    category: shortfall > 0 ? 'warning' : 'resource',
    message: shortfall > 0
      ? `[유지비 부족] 골드 ${paidGold}/${requiredGold} 지불. 부족분 ${shortfall}. 오늘 생산과 방어 효율이 ${Math.round(efficiencyMultiplier * 100)}%로 감소합니다.${secondaryText ? ` [${secondaryText}]` : ''}`
      : `[시설 유지비] 골드 -${paidGold}${secondaryText ? ` · ${secondaryText}` : ''}`,
  }, now)
  return nextState
}
