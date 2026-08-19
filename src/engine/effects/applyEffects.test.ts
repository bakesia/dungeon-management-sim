import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/createInitialGameState'
import { applyEffects } from './applyEffects'

describe('applyEffects', () => {
  it('applies reusable resource, flag, core HP, and log effects immutably', () => {
    const state = createInitialGameState(new Date('2026-01-01T00:00:00.000Z'))
    const next = applyEffects(state, [
      { type: 'addResource', resourceId: 'gold', amount: 15 },
      { type: 'setFlag', flag: 'test_flag', value: true },
      { type: 'changeCoreHp', amount: -20 },
      { type: 'addLog', message: '효과 테스트', category: 'system' },
    ], new Date('2026-01-02T00:00:00.000Z'))

    expect(next.resources.gold).toBe(115)
    expect(next.flags.test_flag).toBe(true)
    expect(next.core.hp).toBe(80)
    expect(next.logs.at(-1)?.message).toBe('효과 테스트')
    expect(state.resources.gold).toBe(100)
    expect(state.flags.test_flag).toBeUndefined()
  })

  it('never reduces a resource below zero', () => {
    const state = createInitialGameState()
    const next = applyEffects(state, [
      { type: 'addResource', resourceId: 'food', amount: -999 },
    ])

    expect(next.resources.food).toBe(0)
  })

  it('adds and removes population while keeping resident assignments within the remaining population', () => {
    const state = createInitialGameState()
    state.dungeon.rooms['facility-quarters-1']!.level = 2
    state.dungeon.rooms['facility-mine-1']!.residentAssignments = [{ raceId: 'goblin', count: 2 }]

    const added = applyEffects(state, [
      { type: 'addPopulation', raceId: 'orc', amount: 1 },
    ])
    expect(added.population.find((group) => group.raceId === 'orc')?.count).toBe(1)

    const removed = applyEffects(added, [
      { type: 'removePopulation', raceId: 'goblin', amount: 4 },
    ])
    expect(removed.population.find((group) => group.raceId === 'goblin')?.count).toBe(1)
    expect(removed.dungeon.rooms['facility-mine-1']?.residentAssignments).toHaveLength(1)
    expect(removed.dungeon.rooms['facility-mine-1']?.residentAssignments[0]?.count).toBe(1)
  })

  it('never grows population beyond housing capacity', () => {
    const state = createInitialGameState()
    state.dungeon.rooms['facility-quarters-1']!.level = 2

    const next = applyEffects(state, [
      { type: 'addPopulation', raceId: 'goblin', amount: 8 },
    ])

    expect(next.population.reduce((total, group) => total + group.count, 0)).toBe(10)
    expect(next.logs.at(-1)?.message).toContain('3명이 합류하지 못했습니다')
  })
})
