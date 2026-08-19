import { facilityDefinitionById } from '../../content/facilities/facilities'
import type { ResourceCost } from '../../types/content'
import type { GameState } from '../../types/game'
import type { ActionCheck } from '../../types/engine'
import { applyEffect } from '../effects/applyEffects'
import { canAfford, formatResourceCost, payResourceCost } from '../resources/resourceCosts'

const REPAIR_VALUE_RATIO = 0.25

export function getRepairCost(state: GameState, instanceId: string): ResourceCost {
  const room = state.dungeon.rooms[instanceId]
  if (!room) throw new Error(`시설 인스턴스 "${instanceId}"을 찾을 수 없습니다.`)
  const definition = facilityDefinitionById[room.definitionId]
  if (!definition?.buildable) throw new Error(`${definition?.name ?? room.definitionId}은 일반 수리 대상이 아닙니다.`)

  const totalValue: ResourceCost = { ...definition.buildCost }
  for (let level = 1; level < room.level; level += 1) {
    const upgradeCost = definition.levels.find((item) => item.level === level)?.upgradeCost ?? {}
    Object.entries(upgradeCost).forEach(([resourceId, amount]) => {
      totalValue[resourceId] = (totalValue[resourceId] ?? 0) + amount
    })
  }
  return Object.fromEntries(
    Object.entries(totalValue).map(([resourceId, amount]) => [resourceId, Math.max(1, Math.ceil(amount * REPAIR_VALUE_RATIO))]),
  )
}

export function canRepairFacility(state: GameState, instanceId: string): ActionCheck {
  const room = state.dungeon.rooms[instanceId]
  if (!room) return { allowed: false, reason: `시설 인스턴스 "${instanceId}"을 찾을 수 없습니다.` }
  const definition = facilityDefinitionById[room.definitionId]
  if (!definition?.buildable) return { allowed: false, reason: `${definition?.name ?? room.definitionId}은 일반 수리 대상이 아닙니다.` }
  if (room.condition !== 'damaged') return { allowed: false, reason: '손상된 시설만 수리할 수 있습니다.' }
  const cost = getRepairCost(state, instanceId)
  if (!canAfford(state, cost)) return { allowed: false, reason: `수리 비용이 부족합니다: ${formatResourceCost(cost)}` }
  return { allowed: true }
}

export function repairFacility(state: GameState, instanceId: string, now = new Date()): GameState {
  const check = canRepairFacility(state, instanceId)
  if (!check.allowed) throw new Error(check.reason)
  const room = state.dungeon.rooms[instanceId]
  const definition = room ? facilityDefinitionById[room.definitionId] : undefined
  if (!room || !definition) throw new Error(`Repair context disappeared for "${instanceId}".`)
  const cost = getRepairCost(state, instanceId)
  let nextState = payResourceCost(state, cost, now)
  nextState = applyEffect(nextState, { type: 'repairRoom', instanceId }, now)
  return applyEffect(nextState, {
    type: 'addLog',
    category: 'system',
    message: `[수리] ${definition.name}이 정상 상태로 복구되었습니다. [${formatResourceCost(cost)} 소모]`,
  }, now)
}
