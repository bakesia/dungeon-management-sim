import { describe, expect, it } from 'vitest'
import { invaderDefinitionById } from '../../content/invaders/invaders'
import type { RandomSource } from '../random'
import { buildFacility } from '../construction/facilities'
import { createInitialGameState } from '../game/createInitialGameState'
import { applyInvasionResolution, getDailyThreatGain, processInvasionRoll, resolveInvasion } from './processInvasion'

function sequenceRandom(values: number[]): RandomSource {
  let index = 0
  return { next: () => values[index++] ?? values.at(-1) ?? 0 }
}

describe('invasion engine', () => {
  it('applies data rewards and records a defense victory', () => {
    let state = createInitialGameState()
    state.currentTierId = 'tier_2'
    state = buildFacility(state, 'trap_room', '0:0:-1')
    const resolution = resolveInvasion(state, invaderDefinitionById.invader_wandering_adventurer!, { next: () => 0.99 })
    expect(state.resources.gold).toBe(100)
    const next = applyInvasionResolution({ ...state, invasion: { ...state.invasion, pendingResolution: resolution } }, resolution)

    expect(next.resources.gold).toBe(125)
    expect(next.resources.mana).toBe(24)
    expect(next.invasion.totalWins).toBe(1)
    expect(next.statistics.successfulDefenses).toBe(1)
    expect(next.logs.at(-1)?.message).toContain('방어 성공')
    expect(applyInvasionResolution(next, resolution)).toBe(next)
  })

  it('derives defeat damage from raidPower and can trigger game over', () => {
    const state = createInitialGameState()
    const resolution = resolveInvasion(state, invaderDefinitionById.invader_beginner_party!, { next: () => 0.99 })
    const defeated = applyInvasionResolution({ ...state, invasion: { ...state.invasion, pendingResolution: resolution } }, resolution)

    expect(defeated.resources).toMatchObject({ gold: 91, material: 73, food: 35 })
    expect(defeated.core.hp).toBe(86)
    expect(defeated.invasion.totalLosses).toBe(1)

    const gameOverResolution = resolveInvasion(state, {
      id: 'test_overwhelming_force', name: '압도적 병력', combatPower: 999, raidPower: 200,
      allowedTierMin: 1, allowedTierMax: 5, rewards: [], tags: ['test'],
    }, { next: () => 0.99 })
    const gameOver = applyInvasionResolution({ ...state, invasion: { ...state.invasion, pendingResolution: gameOverResolution } }, gameOverResolution)
    expect(gameOver.core.hp).toBe(0)
    expect(gameOver.status).toBe('gameOver')
  })

  it('damages at most one eligible facility on a defeat using the central RNG', () => {
    const state = createInitialGameState()
    const resolution = resolveInvasion(state, {
      id: 'test_raiders', name: '시험 약탈대', combatPower: 999, raidPower: 20,
      allowedTierMin: 1, allowedTierMax: 5, rewards: [], tags: ['test'],
    }, sequenceRandom([0.99, 0, 0]))
    const defeated = applyInvasionResolution({ ...state, invasion: { ...state.invasion, pendingResolution: resolution } }, resolution)

    const damagedRooms = Object.values(defeated.dungeon.rooms).filter((room) => room.condition === 'damaged')
    expect(damagedRooms).toHaveLength(1)
    expect(damagedRooms[0]?.definitionId).toBe('mine')
  })

  it('provides two complete safe days after an invasion', () => {
    let state = createInitialGameState()
    state.invasion = { daysSinceLastInvasion: 0, totalDefenses: 1, totalWins: 0, totalLosses: 1, lastEncounter: null, threat: 40, intel: { powerRange: false, invaderCategory: false, arrivalEstimate: false }, pendingResolution: null }

    state = processInvasionRoll(state, { next: () => 0 })
    expect(state.invasion.daysSinceLastInvasion).toBe(1)
    expect(state.invasion.totalDefenses).toBe(1)
    expect(state.invasion.threat).toBe(40)
    state = processInvasionRoll(state, { next: () => 0 })
    expect(state.invasion.daysSinceLastInvasion).toBe(2)
    expect(state.invasion.totalDefenses).toBe(1)

    state = processInvasionRoll(state, sequenceRandom([0, 0, 0.99]))
    expect(state.invasion.pendingResolution).not.toBeNull()
    const resolution = state.invasion.pendingResolution!
    state = applyInvasionResolution(state, resolution)
    expect(state.invasion.totalDefenses).toBe(2)
    expect(state.invasion.threat).toBe(15)
  })

  it('forces an invasion at maximum threat even when the random roll would fail', () => {
    const state = createInitialGameState()
    state.invasion.threat = 99
    const next = processInvasionRoll(state, sequenceRandom([0.99, 0, 0.99, 0.99]))
    expect(next.invasion.totalDefenses).toBe(0)
    expect(next.invasion.pendingResolution).not.toBeNull()
  })

  it('uses tier and population in daily threat gain and permits early random invasions', () => {
    const state = createInitialGameState()
    state.currentTierId = 'tier_3'
    state.population[0]!.count = 20
    expect(getDailyThreatGain(state)).toBe(18)
    state.invasion.threat = 40
    expect(processInvasionRoll(state, sequenceRandom([0, 0, 0.99, 0.99])).invasion.pendingResolution).not.toBeNull()
  })
})
