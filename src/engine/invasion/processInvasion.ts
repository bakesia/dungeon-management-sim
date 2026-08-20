import { facilityDefinitionById } from '../../content/facilities/facilities'
import { gameRules } from '../../content/gameRules'
import { invaderDefinitions } from '../../content/invaders/invaders'
import { resourceDefinitionById } from '../../content/resources/resources'
import { tierDefinitionById } from '../../content/tiers/tiers'
import type { EffectDefinition, InvaderDefinition } from '../../types/content'
import type { GameState, InvasionResolution, PopulationGroup } from '../../types/game'
import { getRoomConditionEfficiency } from '../construction/roomCondition'
import { applyEffect, applyEffects } from '../effects/applyEffects'
import { calculateFacilityEfficiency, getFacilityLevel } from '../population/assignWorkers'
import { defaultRandomSource, type RandomSource } from '../random'
import { calculateDungeonDefenseBreakdown } from './calculateDungeonDefense'

function clampRoll(value: number): number {
  return Math.min(Math.max(value, 0), 0.999999999)
}

export function getEligibleInvaders(state: GameState): InvaderDefinition[] {
  const tierLevel = tierDefinitionById[state.currentTierId]?.level ?? 1
  const tierEligible = invaderDefinitions.filter((invader) =>
    tierLevel >= invader.allowedTierMin
    && tierLevel <= invader.allowedTierMax)
  const fameEligible = tierEligible.filter((invader) => state.invasion.fame >= invader.minimumFame)
  if (fameEligible.length === 0) {
    const lowestRequirement = Math.min(...tierEligible.map((invader) => invader.minimumFame))
    return tierEligible.filter((invader) => invader.minimumFame === lowestRequirement)
  }

  const requirements = [...new Set(fameEligible.map((invader) => invader.minimumFame))].sort((a, b) => b - a)
  const poolFloor = requirements[1] ?? requirements[0] ?? 0
  return fameEligible.filter((invader) => invader.minimumFame >= poolFloor)
}

function selectInvader(state: GameState, randomSource: RandomSource): InvaderDefinition | null {
  const eligible = getEligibleInvaders(state)
  const totalWeight = eligible.reduce((total, invader) => total + invader.weight, 0)
  if (totalWeight <= 0) return null
  let cursor = clampRoll(randomSource.next()) * totalWeight
  for (const invader of eligible) {
    cursor -= invader.weight
    if (cursor < 0) return invader
  }
  return eligible.at(-1) ?? null
}

export function getFameInvasionChance(state: GameState, pressure = state.invasion.raidPressure): number {
  const tierChance = tierDefinitionById[state.currentTierId]?.invasionChance ?? 0
  const fame = Math.max(0, state.invasion.fame)
  const fameBonus = gameRules.invasion.fame.maximumChanceBonus * (fame / (fame + gameRules.invasion.fame.chanceScale))
  const serviceOffset = state.timedModifiers.filter((modifier) => modifier.type === 'raidChanceOffset' && (!modifier.expiresOnDay || state.day < modifier.expiresOnDay)).reduce((sum, modifier) => sum + modifier.value, 0)
  return Math.max(0, Math.min(0.55, tierChance + fameBonus + Math.min(pressure, gameRules.invasion.pity.maximumPressureBonus) + serviceOffset))
}

export function getFameLevel(fame: number): '무명' | '소문난' | '주목받는' | '악명 높은' | '대악명' {
  if (fame >= 100) return '대악명'
  if (fame >= 65) return '악명 높은'
  if (fame >= 30) return '주목받는'
  if (fame >= 10) return '소문난'
  return '무명'
}

export function getRaidProximity(state: GameState): { label: string; maximumDays: number } {
  const maximumDays = Math.max(0, gameRules.invasion.pity.forceAfterDays - state.invasion.daysSinceLastInvasion)
  if (maximumDays <= 1) return { label: '매우 가까움', maximumDays }
  if (maximumDays <= 3) return { label: '가까움', maximumDays }
  if (maximumDays <= 5) return { label: '움직임 감지', maximumDays }
  return { label: '당분간 여유', maximumDays }
}

function rollCombatPower(invader: InvaderDefinition, randomSource: RandomSource): number {
  const { min, max } = invader.powerRange
  return min + Math.floor(clampRoll(randomSource.next()) * (max - min + 1))
}

function rollLoot(invader: InvaderDefinition, randomSource: RandomSource): EffectDefinition[] {
  return (invader.lootTable ?? []).flatMap((drop) => {
    if (randomSource.next() >= drop.chance) return []
    const quantity = drop.quantity.min + Math.floor(clampRoll(randomSource.next()) * (drop.quantity.max - drop.quantity.min + 1))
    return quantity > 0 ? [{ type: 'addItem' as const, itemId: drop.itemId, quantity }] : []
  })
}

function formatEffects(state: GameState, effects: EffectDefinition[]): string {
  const descriptions = effects.flatMap((effect) => {
    if (effect.type === 'addResource') return [`${resourceDefinitionById[effect.resourceId]?.name ?? effect.resourceId} ${effect.amount >= 0 ? '+' : ''}${effect.amount}`]
    if (effect.type === 'changeCoreHp') return [`코어 HP ${effect.amount >= 0 ? '+' : ''}${effect.amount}`]
    if (effect.type === 'changeFame') return [`악명 ${effect.amount >= 0 ? '+' : ''}${effect.amount}`]
    if (effect.type === 'removePopulation') return [`주민 -${effect.amount}`]
    if (effect.type === 'damageRoom') {
      const room = state.dungeon.rooms[effect.instanceId]
      return [`${room ? facilityDefinitionById[room.definitionId]?.name ?? room.definitionId : effect.instanceId} 손상`]
    }
    return []
  })
  return descriptions.length > 0 ? descriptions.join(' · ') : '추가 변화 없음'
}

function getResidentLossChanceMultiplier(state: GameState): number {
  return Object.values(state.dungeon.rooms).reduce((multiplier, room) => {
    const effectiveness = calculateFacilityEfficiency(room) * getRoomConditionEfficiency(room)
    return (getFacilityLevel(room)?.modifiers ?? []).reduce((current, modifier) => {
      if (modifier.type !== 'residentLossChanceMultiplier') return current
      return current * (1 - (1 - modifier.value) * effectiveness)
    }, multiplier)
  }, 1) * state.timedModifiers
    .filter((modifier) => modifier.type === 'residentLossChanceMultiplier' && (!modifier.expiresOnDay || state.day < modifier.expiresOnDay))
    .reduce((value, modifier) => value * modifier.value, 1)
}

function choosePopulationLoss(state: GameState, randomSource: RandomSource): PopulationGroup | null {
  const totalPopulation = state.population.reduce((total, group) => total + group.count, 0)
  if (totalPopulation <= 0) return null
  let cursor = clampRoll(randomSource.next()) * totalPopulation
  for (const group of state.population) {
    cursor -= group.count
    if (cursor < 0) return group
  }
  return state.population.at(-1) ?? null
}

function createDefeatEffects(state: GameState, invader: InvaderDefinition, randomSource: RandomSource): EffectDefinition[] {
  const damage = gameRules.invasion.damage
  const effects: EffectDefinition[] = [{ type: 'changeCoreHp', amount: -Math.ceil(invader.raidPower * damage.coreHpRatio) }]
  const resourceLosses = [
    { resourceId: 'gold', amount: -Math.ceil(invader.raidPower * damage.goldRatio) },
    { resourceId: 'material', amount: -Math.ceil(invader.raidPower * damage.materialRatio) },
    { resourceId: 'food', amount: -Math.ceil(invader.raidPower * damage.foodRatio) },
  ]
  const resourceLoss = resourceLosses[Math.floor(clampRoll(randomSource.next()) * resourceLosses.length)]
  if (resourceLoss) effects.push({ type: 'addResource', ...resourceLoss })
  if (randomSource.next() >= damage.secondaryDamageChance) return effects

  if (randomSource.next() < 0.5) {
    const populationLossChance = Math.min(damage.maximumPopulationLossChance, invader.raidPower * damage.populationLossChancePerRaidPower) * getResidentLossChanceMultiplier(state)
    if (randomSource.next() < populationLossChance) {
      const group = choosePopulationLoss(state, randomSource)
      if (group) effects.push({ type: 'removePopulation', raceId: group.raceId, amount: 1 })
    }
    return effects
  }

  const candidates = Object.values(state.dungeon.rooms).filter((room) => {
    const definition = facilityDefinitionById[room.definitionId]
    return definition?.buildable && room.condition === 'normal'
  })
  const selected = candidates[Math.floor(clampRoll(randomSource.next()) * candidates.length)]
  if (selected) effects.push({ type: 'damageRoom', instanceId: selected.instanceId })
  return effects
}

export function resolveInvasion(state: GameState, invader: InvaderDefinition, randomSource: RandomSource = defaultRandomSource): InvasionResolution {
  const defense = calculateDungeonDefenseBreakdown(state)
  const actualCombatPower = rollCombatPower(invader, randomSource)
  const success = defense.total >= actualCombatPower
  return {
    id: `invasion-${state.day}-${state.invasion.totalDefenses + 1}`,
    invaderId: invader.id,
    raidPower: invader.raidPower,
    actualCombatPower,
    startedOnDay: state.day,
    defensePower: defense.total,
    success,
    contributions: defense.contributions,
    effects: success ? [...invader.rewards, ...rollLoot(invader, randomSource)] : createDefeatEffects(state, invader, randomSource),
  }
}

export function applyInvasionResolution(state: GameState, resolution: InvasionResolution, now = new Date()): GameState {
  if (state.invasion.pendingResolution?.id !== resolution.id) return state
  const invader = invaderDefinitions.find((definition) => definition.id === resolution.invaderId)
  if (!invader) throw new Error(`Unknown invaderId "${resolution.invaderId}" in pending invasion.`)

  const fameEffect: EffectDefinition = { type: 'changeFame', amount: resolution.success ? gameRules.invasion.fame.victoryGain : -gameRules.invasion.fame.defeatLoss }
  const appliedEffects = [...resolution.effects, fameEffect]
  const logCountBeforeEffects = state.logs.length
  let nextState = applyEffects(state, appliedEffects, now)
  const effectLogs = nextState.logs.slice(logCountBeforeEffects)
  nextState = { ...nextState, logs: nextState.logs.slice(0, logCountBeforeEffects) }

  const contributionLines = resolution.contributions.length > 0
    ? resolution.contributions.map((item) => `${item.label.padEnd(12, ' ')} +${item.amount}`).join('\n')
    : '방어 기여 없음'
  const effectSummary = [formatEffects(state, appliedEffects), ...effectLogs.map((entry) => entry.message)].filter(Boolean).join('\n')
  const groupId = `invasion-${resolution.id}`
  nextState = applyEffect(nextState, {
    type: 'addLog', category: resolution.success ? 'invasion' : 'warning', logDay: resolution.startedOnDay,
    presentationGroupId: groupId, presentationSequence: 1, presentationPriority: 100,
    presentation: 'typewriter', sound: resolution.success ? 'defense_win' : 'defense_loss',
    message: `[침입 보고]\n${invader.name}\n예상 전투력 ${invader.powerRange.min}–${invader.powerRange.max}\n\n[방어 판정]\n실제 전투력 ${resolution.actualCombatPower}\n--------------------\n${contributionLines}\n--------------------\n던전 방어력 ${resolution.defensePower}\n\n[결과]\n${resolution.success ? '방어 성공' : '방어 실패'}\n${effectSummary}`,
  }, now)
  const sequence = nextState.invasion.totalDefenses + 1
  return {
    ...nextState,
    timedModifiers: nextState.timedModifiers.filter((modifier) => !modifier.consumeOnInvasion),
    invasion: {
      ...nextState.invasion,
      pendingResolution: null,
      daysSinceLastInvasion: 0,
      raidPressure: 0,
      totalDefenses: sequence,
      totalWins: nextState.invasion.totalWins + (resolution.success ? 1 : 0),
      totalLosses: nextState.invasion.totalLosses + (resolution.success ? 0 : 1),
      lastEncounter: { sequence, invaderId: invader.id, result: resolution.success ? 'win' : 'loss' },
      intel: { powerRange: false, invaderCategory: false, arrivalEstimate: false },
    },
    statistics: resolution.success ? { ...nextState.statistics, successfulDefenses: nextState.statistics.successfulDefenses + 1 } : nextState.statistics,
  }
}

export function processInvasionRoll(state: GameState, randomSource: RandomSource = defaultRandomSource): GameState {
  if (state.status !== 'playing' || state.invasion.pendingResolution) return state
  const isCooldownActive = state.invasion.totalDefenses > 0 && state.invasion.daysSinceLastInvasion < gameRules.invasion.safeDaysAfterInvasion
  if (isCooldownActive) {
    return { ...state, invasion: { ...state.invasion, daysSinceLastInvasion: state.invasion.daysSinceLastInvasion + 1 } }
  }

  const raidPressure = Math.min(gameRules.invasion.pity.maximumPressureBonus, state.invasion.raidPressure + gameRules.invasion.pity.pressurePerEligibleDay)
  const forcedByPity = state.invasion.daysSinceLastInvasion >= gameRules.invasion.pity.forceAfterDays
  if (!forcedByPity && randomSource.next() >= getFameInvasionChance(state, raidPressure)) {
    return { ...state, invasion: { ...state.invasion, raidPressure, daysSinceLastInvasion: state.invasion.daysSinceLastInvasion + 1 } }
  }

  const pressuredState = { ...state, invasion: { ...state.invasion, raidPressure } }
  const invader = selectInvader(pressuredState, randomSource)
  if (!invader) return pressuredState
  return { ...pressuredState, invasion: { ...pressuredState.invasion, pendingResolution: resolveInvasion(pressuredState, invader, randomSource) } }
}
