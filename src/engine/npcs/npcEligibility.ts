import { npcDefinitions } from '../../content/npcs/npcs'
import type { GameState } from '../../types/game'
import { checkConditions } from '../conditions/checkConditions'

export function updateNpcEligibility(state: GameState): GameState {
  let changed = false
  const npcs = { ...state.npcs }

  for (const definition of npcDefinitions) {
    const current = npcs[definition.id]
    if (current?.eligible || current?.joined) continue
    const thresholdReached = checkConditions(state, definition.unlockConditions)
    const precursorReached = definition.precursorFlags.some((flag) => state.flags[flag] === true)
    if (!thresholdReached && !precursorReached) continue
    npcs[definition.id] = {
      npcId: definition.id,
      eligible: true,
      discovered: true,
      joined: false,
      eligibleSinceDay: state.day,
    }
    changed = true
  }

  return changed ? { ...state, npcs } : state
}
