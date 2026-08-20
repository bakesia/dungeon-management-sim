import { describe, expect, it } from 'vitest'
import { invaderDefinitionById } from '../../content/invaders/invaders'
import type { RandomSource } from '../random'
import { buildFacility } from '../construction/facilities'
import { createInitialGameState } from '../game/createInitialGameState'
import { applyInvasionResolution, getEligibleInvaders, getFameInvasionChance, processInvasionRoll, resolveInvasion } from './processInvasion'

function sequenceRandom(values: number[]): RandomSource {
  let index = 0
  return { next: () => values[index++] ?? values.at(-1) ?? 0 }
}

describe('invasion engine', () => {
  it('applies data rewards, fame, and an atomic defense report', () => {
    let state = createInitialGameState()
    state.currentTierId = 'tier_2'
    state = buildFacility(state, 'trap_room', '0:0:-1')
    const resolution = resolveInvasion(state, invaderDefinitionById.invader_wandering_adventurer!, { next: () => 0.99 })
    const next = applyInvasionResolution({ ...state, invasion: { ...state.invasion, pendingResolution: resolution } }, resolution)

    expect(next.resources.gold).toBe(114)
    expect(next.resources.mana).toBe(23)
    expect(next.invasion.fame).toBe(5)
    expect(next.invasion.totalWins).toBe(1)
    expect(next.statistics.successfulDefenses).toBe(1)
    expect(next.logs.at(-1)?.message).toContain('방어 성공')
    expect(next.logs.at(-1)?.presentationGroupId).toContain('invasion-')
    expect(applyInvasionResolution(next, resolution)).toBe(next)
  })

  it('always damages the core and one resource on defeat, then can trigger game over', () => {
    const state = createInitialGameState()
    const resolution = resolveInvasion(state, invaderDefinitionById.invader_elite_subjugation!, sequenceRandom([0, 0, 0.99]))
    const defeated = applyInvasionResolution({ ...state, invasion: { ...state.invasion, pendingResolution: resolution } }, resolution)

    expect(defeated.resources.gold).toBe(80)
    expect(defeated.core.hp).toBe(77)
    expect(defeated.invasion.totalLosses).toBe(1)
    expect(defeated.invasion.fame).toBe(0)

    const gameOverResolution = { ...resolution, id: 'game-over-resolution', effects: [{ type: 'changeCoreHp' as const, amount: -200 }] }
    const gameOver = applyInvasionResolution({ ...state, invasion: { ...state.invasion, pendingResolution: gameOverResolution } }, gameOverResolution)
    expect(gameOver.core.hp).toBe(0)
    expect(gameOver.status).toBe('gameOver')
  })

  it('damages at most one eligible facility as optional secondary damage', () => {
    const state = createInitialGameState()
    const resolution = resolveInvasion(state, invaderDefinitionById.invader_elite_subjugation!, sequenceRandom([0, 0, 0, 0.9, 0]))
    const defeated = applyInvasionResolution({ ...state, invasion: { ...state.invasion, pendingResolution: resolution } }, resolution)

    const damagedRooms = Object.values(defeated.dungeon.rooms).filter((room) => room.condition === 'damaged')
    expect(damagedRooms).toHaveLength(1)
    expect(damagedRooms[0]?.definitionId).toBe('mine')
  })

  it('provides one complete safe day after an invasion', () => {
    let state = createInitialGameState()
    state.invasion = { ...state.invasion, daysSinceLastInvasion: 0, totalDefenses: 1, totalLosses: 1, fame: 40 }

    state = processInvasionRoll(state, { next: () => 0 })
    expect(state.invasion.daysSinceLastInvasion).toBe(1)
    expect(state.invasion.fame).toBe(40)
    state = processInvasionRoll(state, sequenceRandom([0, 0, 0]))
    expect(state.invasion.pendingResolution).not.toBeNull()
  })

  it('forces an invasion after the hidden pity limit without changing fame', () => {
    const state = createInitialGameState()
    state.invasion.daysSinceLastInvasion = 6
    const next = processInvasionRoll(state, sequenceRandom([0.99, 0, 0]))
    expect(next.invasion.pendingResolution).not.toBeNull()
    expect(next.invasion.fame).toBe(0)
  })

  it('uses fame as a soft chance bonus and unlocks stronger invader pools', () => {
    const state = createInitialGameState()
    const baseChance = getFameInvasionChance(state, 0)
    state.invasion.fame = 100
    expect(getFameInvasionChance(state, 0)).toBeGreaterThan(baseChance)
    expect(getFameInvasionChance(state, 0)).toBeLessThanOrEqual(0.55)

    state.currentTierId = 'tier_2'
    expect(getEligibleInvaders(state).map((invader) => invader.id)).toContain('invader_veteran_party')

    state.currentTierId = 'tier_3'
    expect(getEligibleInvaders(state).map((invader) => invader.id)).toEqual(['invader_veteran_party', 'invader_elite_subjugation'])
  })

  it('rolls actual combat power inside the invader range', () => {
    const state = createInitialGameState()
    const invader = invaderDefinitionById.invader_wandering_adventurer!
    expect(resolveInvasion(state, invader, { next: () => 0 }).actualCombatPower).toBe(invader.powerRange.min)
    expect(resolveInvasion(state, invader, { next: () => 0.999 }).actualCombatPower).toBe(invader.powerRange.max)
  })

  it('uses the injected RNG for deterministic loot drops', () => {
    let state = createInitialGameState()
    state.currentTierId = 'tier_2'
    state = buildFacility(state, 'trap_room', '0:0:-1')
    const invader = invaderDefinitionById.invader_wandering_adventurer!
    const dropped = resolveInvasion(state, invader, sequenceRandom([0, 0, 0]))
    expect(dropped.effects).toContainEqual({ type: 'addItem', itemId: 'loot_broken_blade', quantity: 1 })
    const missed = resolveInvasion(state, invader, sequenceRandom([0, 0.99]))
    expect(missed.effects.some((effect) => effect.type === 'addItem')).toBe(false)
  })
})
