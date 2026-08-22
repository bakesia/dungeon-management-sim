import { facilityDefinitionById } from '../../content/facilities/facilities'
import type { FacilityId, ResourceCost } from '../../types/content'
import type { FacilityInstance, GameState } from '../../types/game'
import type { ActionCheck } from '../../types/engine'
import { checkConditions } from '../conditions/checkConditions'
import { tierDefinitionById } from '../../content/tiers/tiers'
import { applyEffect, applyEffects } from '../effects/applyEffects'
import { canAfford, formatResourceCost, payResourceCost } from '../resources/resourceCosts'

function createInstanceId(state: GameState, facilityId: FacilityId): string {
  let sequence = Object.keys(state.dungeon.rooms).length + 1
  let instanceId = `facility-${facilityId}-${sequence}`
  while (state.dungeon.rooms[instanceId]) {
    sequence += 1
    instanceId = `facility-${facilityId}-${sequence}`
  }
  return instanceId
}

export function canBuildFacility(state: GameState, facilityId: FacilityId, targetTileId: string): ActionCheck {
  const definition = facilityDefinitionById[facilityId]
  const tile = state.dungeon.tiles[targetTileId]
  if (!definition) return { allowed: false, reason: `시설 정의 "${facilityId}"을 찾을 수 없습니다.` }
  if (!definition.buildable) return { allowed: false, reason: `${definition.name}은 건설할 수 없습니다.` }
  const currentTier = tierDefinitionById[state.currentTierId]?.level ?? 1
  if (currentTier < definition.requiredTier) return { allowed: false, reason: `Tier ${definition.requiredTier}에서 해금되는 시설입니다.` }
  if (!tile || tile.terrain !== 'floor' || !tile.revealed || tile.facilityInstanceId) return { allowed: false, reason: '공개된 빈 바닥에만 시설을 건설할 수 있습니다.' }
  if (definition.requiredNodeType && tile.persistentNode?.type !== definition.requiredNodeType) {
    return { allowed: false, reason: `${definition.name}은 ${definition.requiredNodeType} 노드에서만 건설할 수 있습니다.` }
  }
  if (tile.persistentNode && !definition.requiredNodeType) return { allowed: false, reason: '자원 노드에는 전용 시설만 건설할 수 있습니다.' }
  if (!checkConditions(state, definition.requirements)) return { allowed: false, reason: `${definition.name}의 건설 조건을 충족하지 못했습니다.` }
  if (!canAfford(state, definition.buildCost)) return { allowed: false, reason: `건설 비용이 부족합니다: ${formatResourceCost(definition.buildCost)}` }
  return { allowed: true }
}

export function buildFacility(state: GameState, facilityId: FacilityId, targetTileId: string, now = new Date()): GameState {
  const check = canBuildFacility(state, facilityId, targetTileId)
  if (!check.allowed) throw new Error(check.reason)

  const definition = facilityDefinitionById[facilityId]
  const tile = state.dungeon.tiles[targetTileId]
  if (!definition || !tile) throw new Error(`Build context disappeared for "${facilityId}" at "${targetTileId}".`)

  let nextState = payResourceCost(state, definition.buildCost, now)
  const instanceId = createInstanceId(nextState, facilityId)
  const room: FacilityInstance = {
    instanceId,
    definitionId: facilityId,
    level: 1,
    residentAssignments: [],
    durability: 100,
    condition: 'normal',
    tileId: targetTileId,
  }

  nextState = {
    ...nextState,
    dungeon: {
      tiles: {
        ...nextState.dungeon.tiles,
        [targetTileId]: { ...tile, facilityInstanceId: instanceId },
      },
      rooms: { ...nextState.dungeon.rooms, [instanceId]: room },
    },
  }

  return applyEffect(nextState, {
    type: 'addLog',
    category: 'system',
    message: `${definition.name}${definition.showLevel === false ? '' : ' Lv.1'}을 건설했습니다. [${formatResourceCost(definition.buildCost)} 소모]`,
  }, now)
}

export function canUpgradeFacility(state: GameState, instanceId: string): ActionCheck {
  const room = state.dungeon.rooms[instanceId]
  if (!room) return { allowed: false, reason: `시설 인스턴스 "${instanceId}"을 찾을 수 없습니다.` }
  const definition = facilityDefinitionById[room.definitionId]
  if (!definition) return { allowed: false, reason: `시설 정의 "${room.definitionId}"을 찾을 수 없습니다.` }
  const level = definition.levels.find((item) => item.level === room.level)
  if (!level?.upgradeCost || !definition.levels.some((item) => item.level === room.level + 1)) {
    return { allowed: false, reason: '이미 최대 레벨입니다.' }
  }
  if (!canAfford(state, level.upgradeCost)) return { allowed: false, reason: `업그레이드 비용이 부족합니다: ${formatResourceCost(level.upgradeCost)}` }
  return { allowed: true }
}

export function upgradeFacility(state: GameState, instanceId: string, now = new Date()): GameState {
  const check = canUpgradeFacility(state, instanceId)
  if (!check.allowed) throw new Error(check.reason)
  const room = state.dungeon.rooms[instanceId]
  const definition = room ? facilityDefinitionById[room.definitionId] : undefined
  const level = definition?.levels.find((item) => item.level === room?.level)
  if (!room || !definition || !level?.upgradeCost) throw new Error(`Upgrade context disappeared for "${instanceId}".`)

  let nextState = payResourceCost(state, level.upgradeCost, now)
  nextState = {
    ...nextState,
    dungeon: {
      ...nextState.dungeon,
      rooms: {
        ...nextState.dungeon.rooms,
        [instanceId]: { ...room, level: room.level + 1 },
      },
    },
  }
  return applyEffect(nextState, {
    type: 'addLog',
    category: 'system',
    message: `${definition.name}을 Lv.${room.level + 1}로 업그레이드했습니다. [${formatResourceCost(level.upgradeCost)} 소모]`,
  }, now)
}

export function demolishFacility(state: GameState, instanceId: string, now = new Date()): GameState {
  const room = state.dungeon.rooms[instanceId]
  if (!room) throw new Error(`시설 인스턴스 "${instanceId}"을 찾을 수 없습니다.`)
  const definition = facilityDefinitionById[room.definitionId]
  if (!definition?.buildable) throw new Error(`${definition?.name ?? room.definitionId}은 철거할 수 없습니다.`)
  const tile = state.dungeon.tiles[room.tileId]
  if (!tile) throw new Error(`시설 타일 "${room.tileId}"을 찾을 수 없습니다.`)

  const refund = getDemolitionRefund(state, instanceId)
  const refundedState = applyEffects(state, Object.entries(refund).map(([resourceId, amount]) => ({
    type: 'addResource' as const,
    resourceId,
    amount,
  })), now)
  const rooms = { ...refundedState.dungeon.rooms }
  delete rooms[instanceId]
  const nextState: GameState = {
    ...refundedState,
    dungeon: {
      rooms,
      tiles: {
        ...refundedState.dungeon.tiles,
        [room.tileId]: { ...tile, facilityInstanceId: undefined },
      },
    },
  }
  return applyEffect(nextState, {
    type: 'addLog',
    category: 'system',
    message: `${definition.name}을 철거했습니다. 누적 투자비의 75%를 환급했습니다. [${formatResourceCost(refund)}] 배치된 주민은 자동으로 복귀했습니다.`,
  }, now)
}

export function getDemolitionRefund(state: GameState, instanceId: string): ResourceCost {
  const room = state.dungeon.rooms[instanceId]
  if (!room) throw new Error(`시설 인스턴스 "${instanceId}"을 찾을 수 없습니다.`)
  const definition = facilityDefinitionById[room.definitionId]
  if (!definition?.buildable) return {}

  const investment: ResourceCost = { ...definition.buildCost }
  for (let level = 1; level < room.level; level += 1) {
    const upgradeCost = definition.levels.find((item) => item.level === level)?.upgradeCost ?? {}
    for (const [resourceId, amount] of Object.entries(upgradeCost)) {
      investment[resourceId] = (investment[resourceId] ?? 0) + amount
    }
  }

  return Object.fromEntries(Object.entries(investment)
    .map(([resourceId, amount]): [string, number] => [resourceId, Math.floor(amount * 0.75)])
    .filter(([, amount]) => amount > 0))
}
