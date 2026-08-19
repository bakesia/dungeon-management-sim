import { gameRules } from '../../content/gameRules'
import type { GameState } from '../../types/game'
import { applyEffects } from '../effects/applyEffects'

export function processCoreRecovery(
  state: GameState,
  invasionOccurred: boolean,
  now = new Date(),
): GameState {
  if (invasionOccurred || state.core.hp <= 0 || state.core.hp >= state.core.maxHp) return state
  const amount = Math.min(gameRules.core.passiveRegenPerDay, state.core.maxHp - state.core.hp)
  return applyEffects(state, [
    { type: 'changeCoreHp', amount },
    { type: 'addLog', category: 'system', message: `던전 코어가 천천히 회복되었습니다. [CORE HP +${amount}]` },
  ], now)
}
