import { gameRules } from '../../content/gameRules'
import { invaderDefinitions } from '../../content/invaders/invaders'
import { resourceDefinitionById } from '../../content/resources/resources'
import { tierDefinitionById } from '../../content/tiers/tiers'
import type { EffectDefinition, InvaderDefinition } from '../../types/content'
import type { GameState, PopulationGroup } from '../../types/game'
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
  ) * getResidentLossChanceMultiplier(state)
  if (randomSource.next() < populationLossChance) {
    const group = choosePopulationLoss(state, randomSource)
    if (group) effects.push({ type: 'removePopulation', raceId: group.raceId, jobId: group.jobId, amount: 1 })
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
  now = new Date(),
): GameState {
  const defense = calculateDungeonDefenseBreakdown(state)
  const contributionLines = defense.contributions.length > 0
    ? defense.contributions.map((item) => `${item.label.padEnd(12, ' ')} +${item.amount}`).join('\n')
    : '방어 기여 없음'
  let nextState = applyEffect(state, {
    type: 'addLog',
    category: 'invasion',
    message: `[침입 보고]\n${invader.name} · 적 전투력 ${invader.combatPower}\n--------------------\n${contributionLines}\n--------------------\n총 방어력 ${defense.total}`,
  }, now)

  if (defense.total >= invader.combatPower) {
    nextState = applyEffects(nextState, invader.rewards, now)
    nextState = applyEffect(nextState, {
      type: 'addLog',
      category: 'invasion',
      message: `[방어 성공]\n${invader.name}을 격퇴했습니다.\n${formatEffects(nextState, invader.rewards)}`,
    }, now)
    return {
      ...nextState,
      invasion: {
        daysSinceLastInvasion: 0,
        totalDefenses: nextState.invasion.totalDefenses + 1,
        totalWins: nextState.invasion.totalWins + 1,
        totalLosses: nextState.invasion.totalLosses,
      },
      statistics: {
        ...nextState.statistics,
        successfulDefenses: nextState.statistics.successfulDefenses + 1,
      },
    }
  }

  const defeatEffects = createDefeatEffects(nextState, invader, randomSource)
  nextState = applyEffects(nextState, defeatEffects, now)
  nextState = applyEffect(nextState, {
    type: 'addLog',
    category: 'warning',
    message: `[방어 실패]\n${invader.name}의 약탈로 피해를 입었습니다.\n${formatEffects(state, defeatEffects)}`,
  }, now)
  return {
    ...nextState,
    invasion: {
      daysSinceLastInvasion: 0,
      totalDefenses: nextState.invasion.totalDefenses + 1,
      totalWins: nextState.invasion.totalWins,
      totalLosses: nextState.invasion.totalLosses + 1,
    },
  }
}

export function processInvasionRoll(
  state: GameState,
  randomSource: RandomSource = defaultRandomSource,
  now = new Date(),
): GameState {
  if (state.status !== 'playing') return state

  const isCooldownActive = state.invasion.totalDefenses > 0
    && state.invasion.daysSinceLastInvasion < gameRules.invasion.safeDaysAfterInvasion
  if (isCooldownActive) {
    return {
      ...state,
      invasion: { ...state.invasion, daysSinceLastInvasion: state.invasion.daysSinceLastInvasion + 1 },
    }
  }

  const invasionChance = tierDefinitionById[state.currentTierId]?.invasionChance ?? 0
  if (randomSource.next() >= invasionChance) {
    return {
      ...state,
      invasion: { ...state.invasion, daysSinceLastInvasion: state.invasion.daysSinceLastInvasion + 1 },
    }
  }

  const invader = selectInvader(state, randomSource)
  return invader ? resolveInvasion(state, invader, randomSource, now) : state
}
