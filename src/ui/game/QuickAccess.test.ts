import { describe, expect, it } from 'vitest'
import { npcDefinitions } from '../../content/npcs/npcs'
import { createInitialGameState } from '../../engine/game/createInitialGameState'
import { getJoinedQuickAccessFeatures } from './quickAccessModel'

describe('quick access feature visibility', () => {
  it('does not expose NPC features before the NPC joins', () => {
    expect(getJoinedQuickAccessFeatures(createInitialGameState())).toEqual([])
  })

  it('exposes only features backed by joined NPCs', () => {
    const state = createInitialGameState()
    const [firstNpc, secondNpc] = npcDefinitions
    if (!firstNpc || !secondNpc) throw new Error('Quick access test requires at least two NPC definitions.')

    state.npcs[firstNpc.id] = { npcId: firstNpc.id, discovered: true, joined: true }

    expect(getJoinedQuickAccessFeatures(state)).toEqual([firstNpc.featureId])
    expect(getJoinedQuickAccessFeatures(state)).not.toContain(secondNpc.featureId)
  })
})
