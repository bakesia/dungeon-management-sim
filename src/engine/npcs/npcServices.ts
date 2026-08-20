import { gameRules } from '../../content/gameRules'
import { npcDefinitionById } from '../../content/npcs/npcs'
import { mercenaryDefinitionById, mercenaryDefinitions, npcServiceDefinitionById, recruitmentOfferDefinitionById, recruitmentOfferDefinitions, shopItemDefinitionById, shopItemDefinitions } from '../../content/npcs/services'
import { raceDefinitionById } from '../../content/races/races'
import { tierDefinitionById } from '../../content/tiers/tiers'
import type { EffectDefinition, FeatureId, ResourceCost } from '../../types/content'
import type { GameState } from '../../types/game'
import { applyEffect, applyEffects } from '../effects/applyEffects'
import { defaultRandomSource, type RandomSource } from '../random'
import { canAfford, formatResourceCost, payResourceCost } from '../resources/resourceCosts'
import { getRepairCost } from '../construction/repairFacility'
import { canStoreAnyPositiveResourceEffect } from '../resources/resourceCapacity'
import { getPopulationSpace } from '../population/populationMetrics'

export function isFeatureUnlocked(state: GameState, featureId: FeatureId): boolean {
  return Object.values(state.npcs).some((npc) => npc.joined && npcDefinitionById[npc.npcId]?.featureId === featureId)
}

function requireFeature(state: GameState, featureId: FeatureId): void {
  if (!isFeatureUnlocked(state, featureId)) throw new Error('해당 NPC가 아직 던전에 합류하지 않았습니다.')
}

function finishService(state: GameState, effects: EffectDefinition[], message: string, now: Date): GameState {
  return applyEffect(applyEffects(state, effects, now), { type: 'addLog', category: 'system', message }, now)
}

export function purchaseShopItem(state: GameState, itemId: string, now = new Date()): GameState {
  requireFeature(state, 'shop')
  const item = shopItemDefinitionById[itemId]
  const offering = state.shop.offerings.find((entry) => entry.itemId === itemId)
  if (!item || !offering) throw new Error('현재 상점에 없는 물품입니다.')
  if (offering.stock <= 0) throw new Error('해당 물품은 품절되었습니다.')
  if (!canAfford(state, item.cost)) throw new Error(`구매 비용이 부족합니다: ${formatResourceCost(item.cost)}`)
  if (!canStoreAnyPositiveResourceEffect(state, item.effects)) throw new Error('저장 공간이 부족해 해당 물품을 구매할 수 없습니다.')
  const paid = payResourceCost(state, item.cost, now)
  const purchased = finishService(paid, item.effects, `[상점] ${item.name} 구매 완료. [${formatResourceCost(item.cost)} 소모]`, now)
  return { ...purchased, shop: { ...purchased.shop, offerings: purchased.shop.offerings.map((entry) => entry.itemId === itemId ? { ...entry, stock: entry.stock - 1 } : entry) } }
}

export function hireMercenary(state: GameState, contractId: string, now = new Date()): GameState {
  requireFeature(state, 'tavern')
  const contract = mercenaryDefinitionById[contractId]
  if (!contract || !state.tavern.offers.includes(contractId)) throw new Error('현재 모집 중인 용병대가 아닙니다.')
  if (state.activeMercenaries.some((item) => item.contractId === contractId && state.day < item.expiresOnDay)) throw new Error('이미 고용 중인 용병대입니다.')
  if (!canAfford(state, contract.cost)) throw new Error(`고용 비용이 부족합니다: ${formatResourceCost(contract.cost)}`)
  const paid = payResourceCost(state, contract.cost, now)
  const logged = applyEffect(paid, { type: 'addLog', category: 'system', message: `[주점] ${contract.name} 고용. ${contract.durationDays} DAY 동안 방어력 +${contract.combatPower}` }, now)
  return { ...logged, activeMercenaries: [...logged.activeMercenaries, { contractId, hiredAtDay: state.day, expiresOnDay: state.day + contract.durationDays, combatPower: contract.combatPower }] }
}

export function recruitResident(state: GameState, offerId: string, now = new Date()): GameState {
  requireFeature(state, 'tavern')
  const definition = recruitmentOfferDefinitionById[offerId]
  const offer = state.tavern.recruitmentOffers.find((entry) => entry.offerId === offerId)
  if (!definition || !offer) throw new Error('현재 주점에서 모집 중인 주민이 아닙니다.')
  if (offer.remaining <= 0) throw new Error('이번 모집 주기의 인원이 모두 합류했습니다.')
  if (getPopulationSpace(state) < definition.count) throw new Error(`숙소가 부족합니다. 빈 수용 공간 ${definition.count}칸이 필요합니다.`)
  if (!canAfford(state, definition.cost)) throw new Error(`모집 비용이 부족합니다: ${formatResourceCost(definition.cost)}`)

  const paid = payResourceCost(state, definition.cost, now)
  const recruited = applyEffect(paid, { type: 'addPopulation', raceId: definition.raceId, amount: definition.count }, now)
  const raceName = raceDefinitionById[definition.raceId]?.name ?? definition.raceId
  const logged = applyEffect(recruited, {
    type: 'addLog', category: 'progression',
    message: `[주민 모집] ${raceName} ${definition.count}명이 영구 합류했습니다. [${formatResourceCost(definition.cost)} 소모]`,
  }, now)
  return {
    ...logged,
    tavern: {
      ...logged.tavern,
      recruitmentOffers: logged.tavern.recruitmentOffers.map((entry) => entry.offerId === offerId ? { ...entry, remaining: entry.remaining - 1 } : entry),
    },
  }
}

export function performNpcService(state: GameState, serviceId: string, now = new Date()): GameState {
  const service = npcServiceDefinitionById[serviceId]
  if (!service) throw new Error(`NPC 서비스 "${serviceId}"을 찾을 수 없습니다.`)
  requireFeature(state, service.featureId)
  if (!canAfford(state, service.cost)) throw new Error(`서비스 비용이 부족합니다: ${formatResourceCost(service.cost)}`)
  const paid = payResourceCost(state, service.cost, now)
  return finishService(paid, service.effects, `[${service.name}] 지원을 준비했습니다. [${formatResourceCost(service.cost)} 소모]`, now)
}

function scaleCost(cost: ResourceCost, multiplier: number): ResourceCost {
  return Object.fromEntries(Object.entries(cost).map(([id, amount]) => [id, Math.max(1, Math.ceil(amount * multiplier))]))
}

export function repairWithBlacksmith(state: GameState, instanceId: string, now = new Date()): GameState {
  requireFeature(state, 'blacksmith')
  const room = state.dungeon.rooms[instanceId]
  if (!room || room.condition !== 'damaged') throw new Error('손상된 시설만 수리할 수 있습니다.')
  const cost = scaleCost(getRepairCost(state, instanceId), gameRules.npcs.blacksmithRepairDiscount)
  if (!canAfford(state, cost)) throw new Error(`수리 비용이 부족합니다: ${formatResourceCost(cost)}`)
  const repaired = applyEffect(payResourceCost(state, cost, now), { type: 'repairRoom', instanceId }, now)
  return applyEffect(repaired, { type: 'addLog', category: 'system', message: `[대장간] 시설 수리 완료. [${formatResourceCost(cost)} 소모]` }, now)
}

function weightedPick<T extends { weight: number }>(pool: T[], randomSource: RandomSource): T | undefined {
  const total = pool.reduce((sum, item) => sum + item.weight, 0)
  let cursor = Math.min(Math.max(randomSource.next(), 0), 0.999999999) * total
  for (const item of pool) { cursor -= item.weight; if (cursor < 0) return item }
  return pool.at(-1)
}

function pickUnique<T extends { id: string; weight: number }>(pool: T[], count: number, randomSource: RandomSource): T[] {
  const remaining = [...pool]
  const selected: T[] = []
  while (remaining.length > 0 && selected.length < count) {
    const item = weightedPick(remaining, randomSource)
    if (!item) break
    selected.push(item)
    remaining.splice(remaining.indexOf(item), 1)
  }
  return selected
}

export function processNpcRuntime(state: GameState, randomSource: RandomSource = defaultRandomSource): GameState {
  const tier = tierDefinitionById[state.currentTierId]?.level ?? 1
  const activeMercenaries = state.activeMercenaries.filter((item) => state.day < item.expiresOnDay)
  const timedModifiers = state.timedModifiers.filter((item) => !item.expiresOnDay || state.day < item.expiresOnDay)
  const shop = state.day - state.shop.lastRefreshDay >= gameRules.npcs.shopRefreshDays
    ? { lastRefreshDay: state.day, offerings: pickUnique(shopItemDefinitions.filter((item) => item.minTier <= tier), 3, randomSource).map((item) => ({ itemId: item.id, stock: item.stock })) }
    : state.shop
  const refreshedMercenaries = state.day - state.tavern.lastRefreshDay >= gameRules.npcs.tavernRefreshDays
  const refreshedRecruitment = state.day - state.tavern.lastRecruitmentRefreshDay >= gameRules.npcs.recruitmentRefreshDays
  const tavern = {
    lastRefreshDay: refreshedMercenaries ? state.day : state.tavern.lastRefreshDay,
    lastRecruitmentRefreshDay: refreshedRecruitment ? state.day : state.tavern.lastRecruitmentRefreshDay,
    offers: refreshedMercenaries
      ? pickUnique(mercenaryDefinitions.filter((item) => item.minTier <= tier), 3, randomSource).map((item) => item.id)
      : state.tavern.offers,
    recruitmentOffers: refreshedRecruitment
      ? pickUnique(recruitmentOfferDefinitions.filter((item) => item.minTier <= tier), 3, randomSource).map((item) => ({ offerId: item.id, remaining: item.stock }))
      : state.tavern.recruitmentOffers,
  }
  return { ...state, activeMercenaries, timedModifiers, shop, tavern }
}
