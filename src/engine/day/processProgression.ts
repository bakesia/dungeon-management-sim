import { facilityDefinitions } from '../../content/facilities/facilities'
import { resourceDefinitionById } from '../../content/resources/resources'
import { tierDefinitions } from '../../content/tiers/tiers'
import type { EffectDefinition, TierDefinition } from '../../types/content'
import type { GameState } from '../../types/game'
import { checkConditions } from '../conditions/checkConditions'
import { applyEffect, applyEffects } from '../effects/applyEffects'

function orderedTiers(): TierDefinition[] {
  return [...tierDefinitions].sort((a, b) => a.level - b.level)
}

export function getNextTier(state: GameState): TierDefinition | null {
  const tiers = orderedTiers()
  const currentIndex = tiers.findIndex((tier) => tier.id === state.currentTierId)
  if (currentIndex < 0) throw new Error(`Unknown currentTierId "${state.currentTierId}".`)
  return tiers[currentIndex + 1] ?? null
}

export function canPromoteDungeon(state: GameState): boolean {
  const nextTier = getNextTier(state)
  return state.status === 'playing' && Boolean(nextTier && checkConditions(state, nextTier.requirements))
}

function formatPromotionRewards(effects: EffectDefinition[]): string {
  return effects.flatMap((effect) => {
    if (effect.type === 'addResource') return [`${resourceDefinitionById[effect.resourceId]?.name ?? effect.resourceId} +${effect.amount}`]
    if (effect.type === 'changeFame') return [`악명 +${effect.amount}`]
    return []
  }).join(' · ')
}

export function getNewlyUnlockedFacilityNames(fromTier: number, toTier: number): string[] {
  return facilityDefinitions
    .filter((facility) => facility.buildable && facility.requiredTier > fromTier && facility.requiredTier <= toTier)
    .map((facility) => facility.name)
}

export function promoteDungeon(state: GameState, now = new Date()): GameState {
  const nextTier = getNextTier(state)
  if (!nextTier) throw new Error('이미 최종 Tier에 도달했습니다.')
  if (!canPromoteDungeon(state)) throw new Error(`Tier ${nextTier.level} 승급 조건을 현재 충족하지 못했습니다.`)

  const currentTier = tierDefinitions.find((tier) => tier.id === state.currentTierId)
  const unlocked = getNewlyUnlockedFacilityNames(currentTier?.level ?? nextTier.level - 1, nextTier.level)
  let nextState: GameState = { ...state, currentTierId: nextTier.id }
  nextState = applyEffects(nextState, nextTier.promotionRewards, now)
  nextState = applyEffect(nextState, {
    type: 'addLog',
    category: 'progression',
    message: `[TIER UP]\n${currentTier?.name ?? '던전'} → ${nextTier.name}\n성장 보너스: ${formatPromotionRewards(nextTier.promotionRewards)}${unlocked.length > 0 ? `\n신규 시설: ${unlocked.join(', ')}` : ''}`,
    presentation: 'typewriter',
    sound: 'tier_up',
    presentationGroupId: `tier-up-${state.day}-${nextTier.level}`,
    presentationSequence: 1,
    presentationPriority: 90,
  }, now)

  if (nextTier.level === orderedTiers().at(-1)?.level) nextState = { ...nextState, status: 'clear' }
  return nextState
}

/** DAY 처리에서는 승급하지 않는다. 기존 호출부를 위한 명시적 no-op 경계다. */
export function processProgression(state: GameState): GameState {
  return state
}

export function continueAfterClear(state: GameState, now = new Date()): GameState {
  if (state.status !== 'clear') throw new Error('클리어 상태에서만 계속 운영을 선택할 수 있습니다.')
  let nextState: GameState = {
    ...state,
    status: 'playing',
    flags: { ...state.flags, v01_clear_seen: true },
  }
  nextState = applyEffect(nextState, {
    type: 'addLog',
    category: 'progression',
    message: '[계속 운영] 거대 던전의 경영을 계속합니다.',
  }, now)
  return nextState
}
