import { npcDefinitions } from '../../content/npcs/npcs'
import type { FeatureId } from '../../types/content'
import type { GameState } from '../../types/game'

export function getJoinedQuickAccessFeatures(state: GameState): FeatureId[] {
  return [...new Set(
    npcDefinitions
      .filter((npc) => state.npcs[npc.id]?.joined)
      .map((npc) => npc.featureId),
  )]
}
