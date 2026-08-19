import { describe, expect, it } from 'vitest'
import { createInitialGameState, tileId } from '../game/createInitialGameState'
import { canDigTile, digTile } from './digTile'

describe('digTile', () => {
  it('charges the configured cost and reveals the next adjacent rock', () => {
    const state = createInitialGameState()
    const targetId = tileId(0, -2)
    const newlyRevealedId = tileId(0, -3)

    expect(canDigTile(state, targetId).allowed).toBe(true)
    expect(state.dungeon.tiles[newlyRevealedId]?.status).toBe('undiscovered')

    const next = digTile(state, targetId)

    expect(next.resources.material).toBe(70)
    expect(next.dungeon.tiles[targetId]?.status).toBe('empty')
    expect(next.dungeon.tiles[newlyRevealedId]?.status).toBe('diggable')
    expect(next.logs.at(-1)?.message).toContain('굴착')
  })

  it('rejects a diggable tile that is not next to secured space', () => {
    const state = createInitialGameState()
    const targetId = tileId(3, 3)
    state.dungeon.tiles[targetId] = { ...state.dungeon.tiles[targetId]!, status: 'diggable' }
    expect(canDigTile(state, targetId).allowed).toBe(false)
  })
})
