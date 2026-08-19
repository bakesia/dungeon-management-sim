import { tierDefinitions } from '../../content/tiers/tiers'
import type { GameState } from '../../types/game'
import { checkConditions } from '../conditions/checkConditions'
import { applyEffect } from '../effects/applyEffects'
import { applyEffects } from '../effects/applyEffects'
import { resourceDefinitionById } from '../../content/resources/resources'
import type { EffectDefinition } from '../../types/content'

function formatPromotionRewards(effects: EffectDefinition[]): string {
  return effects.flatMap((effect) => effect.type === 'addResource'
    ? [`${resourceDefinitionById[effect.resourceId]?.name ?? effect.resourceId} +${effect.amount}`]
    : []).join(' · ')
}

export function processProgression(state: GameState, now = new Date()): GameState {
  if (state.status !== 'playing') return state
  const orderedTiers = [...tierDefinitions].sort((a, b) => a.level - b.level)
  let nextState = state
  let currentIndex = orderedTiers.findIndex((tier) => tier.id === nextState.currentTierId)
  if (currentIndex < 0) throw new Error(`Unknown currentTierId "${nextState.currentTierId}".`)

  while (currentIndex < orderedTiers.length - 1) {
    const nextTier = orderedTiers[currentIndex + 1]
    if (!nextTier || !checkConditions(nextState, nextTier.requirements)) break

    nextState = { ...nextState, currentTierId: nextTier.id }
    nextState = applyEffects(nextState, nextTier.promotionRewards, now)
    nextState = applyEffect(nextState, {
      type: 'addLog',
      category: 'progression',
      message: `[던전 성장] 던전이 ${nextTier.name}(Tier ${nextTier.level})으로 성장했습니다. [성장 보너스: ${formatPromotionRewards(nextTier.promotionRewards)}]`,
    }, now)
    currentIndex += 1

    if (currentIndex === orderedTiers.length - 1) {
      nextState = { ...nextState, status: 'clear' }
      break
    }
  }

  return nextState
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
