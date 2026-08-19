import type { GameState } from '../../types/game'

export function processPopulationState(state: GameState): GameState {
  // Morale, fatigue, and starvation consequences are intentionally deferred.
  return state
}
