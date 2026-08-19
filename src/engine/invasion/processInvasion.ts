import { gameRules } from '../../content/gameRules'
import { invaderDefinitions } from '../../content/invaders/invaders'
import { resourceDefinitionById } from '../../content/resources/resources'
import { tierDefinitionById } from '../../content/tiers/tiers'
import type { EffectDefinition, InvaderDefinition } from '../../types/content'
import type { GameState, InvasionResolution, PopulationGroup } from '../../types/game'
import { applyEffect, applyEffects } from '../effects/applyEffects'
import { defaultRandomSource, type RandomSource } from '../random'
import { calculateDungeonDefenseBreakdown } from './calculateDungeonDefense'
import { facilityDefinitionById } from '../../content/facilities/facilities'
import { getRoomConditionEfficiency } from '../construction/roomCondition'
import { calculateFacilityEfficiency, getFacilityLevel } from '../population/assignWorkers'

function selectInvader(state: GameState, randomSource: RandomSource): InvaderDefinition | null {
  const tierLevel = tierDefinitionById[state.currentTierId]?.level ?? 1
  const eligible = invaderDefinitions.filter(
    (invader) => tierLevel >= invader.allowedTierMin && tierLevel <= invader.allowedTierMax,
  )
  if (eligible.length === 0) return null
  const index = Math.min(Math.floor(Math.max(0, randomSource.next()) * eligible.length), eligible.length - 1)
  return eligible[index] ?? null
}

export function getEligibleInvaders(state: GameState): InvaderDefinition[] {
  const tierLevel = tierDefinitionById[state.currentTierId]?.level ?? 1
  return invaderDefinitions.filter((invader) => tierLevel >= invader.allowedTierMin && tierLevel <= invader.allowedTierMax)
}

export function getDailyThreatGain(state: GameState): number {
  const tierLevel = tierDefinitionById[state.currentTierId]?.level ?? 1
  const population = state.population.reduce((total, group) => total + group.count, 0)
  return gameRules.invasion.threat.baseDailyGain
    + Math.max(0, tierLevel - 1) * gameRules.invasion.threat.tierGain
    + Math.floor(population / gameRules.invasion.threat.populationStep)
}

export function getThreatInvasionChance(state: GameState, threat = state.invasion.threat): number {
  const tierChance = tierDefinitionById[state.currentTierId]?.invasionChance ?? 0
  return Math.min(0.75, tierChance * 0.5 + (threat / gameRules.invasion.threat.maximum) * gameRules.invasion.threat.randomChanceAtMaximum)
}

export function getThreatLevel(threat: number): '안정' | '주의' | '경계' | '위험' | '침입 임박' {
  if (threat >= 100) return '침입 임박'
  if (threat >= 80) return '위험'
  if (threat >= 60) return '경계'
  if (threat >= 30) return '주의'
  return '안정'
}

function formatEffects(state: GameState, effects: EffectDefinition[]): string {
  return effects.flatMap((effect) => {
    if (effect.type === 'addResource') {
      return [`${resourceDefinitionById[effect.resourceId]?.name ?? effect.resourceId} ${effect.amount >= 0 ? '+' : ''}${effect.amount}`]
    }
    if (effect.type === 'changeCoreHp') return [`코어 HP ${effect.amount >= 0 ? '+' : ''}${effect.amount}`]
    if (effect.type === 'removePopulation') return [`주민 -${effect.amount}`]
    if (effect.type === 'damageRoom') {
      const room = state.dungeon.rooms[effect.instanceId]
      return [`${room ? facilityDefinitionById[room.definitionId]?.name ?? room.definitionId : effect.instanceId} 손상`]
    }
    return []
  }).join(' · ')
}

function getResidentLossChanceMultiplier(state: GameState): number {
  return Object.values(state.dungeon.rooms).reduce((multiplier, room) => {
    const effectiveness = calculateFacilityEfficiency(room) * getRoomConditionEfficiency(room)
    const modifiers = getFacilityLevel(room)?.modifiers ?? []
    return modifiers.reduce((current, modifier) => {
      if (modifier.type !== 'residentLossChanceMultiplier') return current
      const effectiveValue = 1 - (1 - modifier.value) * effectiveness
      return current * effectiveValue
    }, multiplier)
  }, 1)
}

function choosePopulationLoss(state: GameState, randomSource: RandomSource): PopulationGroup | null {
  const totalPopulation = state.population.reduce((total, group) => total + group.count, 0)
  if (totalPopulation <= 0) return null
  let cursor = Math.min(Math.max(randomSource.next(), 0), 0.999999999) * totalPopulation
  for (const group of state.population) {
    cursor -= group.count
    if (cursor < 0) return group
  }
  return state.population.at(-1) ?? null
}

function createDefeatEffects(
  state: GameState,
  invader: InvaderDefinition,
  randomSource: RandomSource,
): EffectDefinition[] {
  const damage = gameRules.invasion.damage
  const effects: EffectDefinition[] = [
    { type: 'addResource', resourceId: 'gold', amount: -Math.ceil(invader.raidPower * damage.goldRatio) },
    { type: 'addResource', resourceId: 'material', amount: -Math.ceil(invader.raidPower * damage.materialRatio) },
    { type: 'addResource', resourceId: 'food', amount: -Math.ceil(invader.raidPower * damage.foodRatio) },
    { type: 'changeCoreHp', amount: -Math.ceil(invader.raidPower * damage.coreHpRatio) },
  ]
  const populationLossChance = Math.min(
    damage.maximumPopulationLossChance,
    invader.raidPower * damage.populationLossChancePerRaidPower,
  ) * getResidentLossChanceMultiplier(state) * state.timedModifiers
    .filter((modifier) => modifier.type === 'residentLossChanceMultiplier' && (!modifier.expiresOnDay || state.day < modifier.expiresOnDay))
    .reduce((value, modifier) => value * modifier.value, 1)
  if (randomSource.next() < populationLossChance) {
    const group = choosePopulationLoss(state, randomSource)
    if (group) effects.push({ type: 'removePopulation', raceId: group.raceId, amount: 1 })
  }
  if (randomSource.next() < damage.facilityDamageChance) {
    const candidates = Object.values(state.dungeon.rooms).filter((room) => {
      const definition = facilityDefinitionById[room.definitionId]
      return definition?.buildable && room.condition === 'normal'
    })
    if (candidates.length > 0) {
      const index = Math.min(Math.floor(Math.max(0, randomSource.next()) * candidates.length), candidates.length - 1)
      const selected = candidates[index]
      if (selected) effects.push({ type: 'damageRoom', instanceId: selected.instanceId })
    }
  }
  return effects
}

export function resolveInvasion(
  state: GameState,
  invader: InvaderDefinition,
  randomSource: RandomSource = defaultRandomSource,
): InvasionResolution {
  const defense = calculateDungeonDefenseBreakdown(state)
  return {
    id: `invasion-${state.day}-${state.invasion.totalDefenses + 1}`,
    invaderId: invader.id,
    raidPower: invader.raidPower,
    defensePower: defense.total,
    success: defense.total >= invader.combatPower,
    contributions: defense.contributions,
    effects: defense.total >= invader.combatPower
      ? invader.rewards
      : createDefeatEffects(state, invader, randomSource),
  }
}

export function applyInvasionResolution(
  state: GameState,
  resolution: InvasionResolution,
  now = new Date(),
): GameState {
  if (state.invasion.pendingResolution?.id !== resolution.id) return state
  const invader = invaderDefinitions.find((definition) => definition.id === resolution.invaderId) ?? {
    id: resolution.invaderId,
    name: resolution.invaderId,
    combatPower: resolution.raidPower,
    raidPower: resolution.raidPower,
    allowedTierMin: 1,
    allowedTierMax: 5,
    rewards: [],
    tags: [],
  }

  const contributionLines = resolution.contributions.length > 0
    ? resolution.contributions.map((item) => `${item.label.padEnd(12, ' ')} +${item.amount}`).join('\n')
    : '방어 기여 없음'
  let nextState = applyEffect(state, {
    type: 'addLog',
    category: 'invasion',
    message: `[침입 보고]\n${invader.name} · 적 전투력 ${invader.combatPower}\n--------------------\n${contributionLines}\n--------------------\n총 방어력 ${resolution.defensePower}`,
    presentation: 'typewriter',
  }, now)
  nextState = applyEffects(nextState, resolution.effects, now)
  nextState = applyEffect(nextState, {
    type: 'addLog',
    category: resolution.success ? 'invasion' : 'warning',
    message: resolution.success
      ? `[방어 성공]\n${invader.name}을 격퇴했습니다.\n${formatEffects(nextState, resolution.effects)}`
      : `[방어 실패]\n${invader.name}의 약탈로 피해를 입었습니다.\n${formatEffects(state, resolution.effects)}`,
    presentation: 'typewriter',
    sound: resolution.success ? 'defense_win' : 'defense_loss',
  }, now)

  const sequence = nextState.invasion.totalDefenses + 1
  return {
    ...nextState,
    timedModifiers: nextState.timedModifiers.filter((modifier) => !modifier.consumeOnInvasion),
    invasion: {
      ...nextState.invasion,
      pendingResolution: null,
      daysSinceLastInvasion: 0,
      totalDefenses: sequence,
      totalWins: nextState.invasion.totalWins + (resolution.success ? 1 : 0),
      totalLosses: nextState.invasion.totalLosses + (resolution.success ? 0 : 1),
      lastEncounter: {
        sequence,
        invaderId: invader.id,
        result: resolution.success ? 'win' : 'loss',
      },
      threat: gameRules.invasion.threat.resetAfterInvasion,
      intel: { powerRange: false, invaderCategory: false, arrivalEstimate: false },
    },
    statistics: resolution.success
      ? { ...nextState.statistics, successfulDefenses: nextState.statistics.successfulDefenses + 1 }
      : nextState.statistics,
  }
}

export function processInvasionRoll(
  state: GameState,
  randomSource: RandomSource = defaultRandomSource,
): GameState {
  if (state.status !== 'playing' || state.invasion.pendingResolution) return state

  const isCooldownActive = state.invasion.totalDefenses > 0
    && state.invasion.daysSinceLastInvasion < gameRules.invasion.safeDaysAfterInvasion
  if (isCooldownActive) {
    return {
      ...state,
      invasion: { ...state.invasion, daysSinceLastInvasion: state.invasion.daysSinceLastInvasion + 1 },
    }
  }

  const threat = Math.min(gameRules.invasion.threat.maximum, state.invasion.threat + getDailyThreatGain(state))
  const forced = threat >= gameRules.invasion.threat.maximum
  if (!forced && randomSource.next() >= getThreatInvasionChance(state, threat)) {
    return {
      ...state,
      invasion: { ...state.invasion, threat, daysSinceLastInvasion: state.invasion.daysSinceLastInvasion + 1 },
    }
  }

  const invader = selectInvader(state, randomSource)
  const threatenedState = { ...state, invasion: { ...state.invasion, threat } }
  if (!invader) return threatenedState
  return {
    ...threatenedState,
    invasion: {
      ...threatenedState.invasion,
      pendingResolution: resolveInvasion(threatenedState, invader, randomSource),
    },
  }
}
