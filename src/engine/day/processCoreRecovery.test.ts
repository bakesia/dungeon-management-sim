import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/createInitialGameState'
import { processCoreRecovery } from './processCoreRecovery'

describe('processCoreRecovery', () => {
  it('recovers one Core HP on a peaceful day', () => {
    const state = createInitialGameState()
    state.core.hp = 90
    expect(processCoreRecovery(state, false).core.hp).toBe(91)
  })

  it('skips recovery on an invasion day or after game over', () => {
    const state = createInitialGameState()
    state.core.hp = 90
    expect(processCoreRecovery(state, true).core.hp).toBe(90)
    state.core.hp = 0
    expect(processCoreRecovery(state, false).core.hp).toBe(0)
  })

  it('never exceeds Core max HP', () => {
    const state = createInitialGameState()
    state.core.hp = state.core.maxHp
    expect(processCoreRecovery(state, false).core.hp).toBe(state.core.maxHp)
  })
})
