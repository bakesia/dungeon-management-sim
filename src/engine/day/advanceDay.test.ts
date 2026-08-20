import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/createInitialGameState'
import { adjustResidentAssignment } from '../population/assignWorkers'
import { buildFacility } from '../construction/facilities'
import type { RandomSource } from '../random'

function sequenceRandom(values: number[]): RandomSource {
  let index = 0
  return { next: () => values[index++] ?? values.at(-1) ?? 0 }
}
import { advanceDay } from './advanceDay'
import { applyInvasionResolution } from '../invasion/processInvasion'

describe('advanceDay', () => {
  it('consumes population food, advances the day, and appends logs', () => {
    const state = createInitialGameState(new Date('2026-01-01T00:00:00.000Z'))
    const next = advanceDay(state, {
      now: new Date('2026-01-02T00:00:00.000Z'),
      randomSource: { next: () => 0.99 },
    })

    expect(next.day).toBe(2)
    expect(next.resources.food).toBe(35)
    expect(next.statistics.totalDaysPlayed).toBe(1)
    expect(next.events.daysSinceLastEvent).toBe(1)
    expect(next.invasion.daysSinceLastInvasion).toBe(1)
    expect(next.logs.map((entry) => entry.message)).toContain('DAY 1 종료')
    expect(next.logs.some((entry) => entry.message.includes('[오늘의 수급]') && entry.message.includes('식량') && entry.message.includes('-5 주민 소비'))).toBe(true)
    expect(next.logs.at(-1)?.message).toBe('DAY 2 시작')
  })

  it('clamps food to zero and adds a warning when food is insufficient', () => {
    const state = createInitialGameState()
    state.resources.food = 2

    const next = advanceDay(state, { randomSource: { next: () => 0.99 } })

    expect(next.resources.food).toBe(0)
    expect(next.logs.some((entry) => entry.category === 'warning' && entry.message.includes('3 부족'))).toBe(true)
  })

  it('processes maintenance before production and food', () => {
    let state = createInitialGameState()
    state.currentTierId = 'tier_2'
    state = adjustResidentAssignment(state, 'facility-mine-1', 'goblin', 1)
    state = buildFacility(state, 'trap_room', '0:0:-1')

    const next = advanceDay(state, { randomSource: { next: () => 0.99 } })

    expect(next.resources.material).toBe(58)
    expect(next.resources.food).toBe(35)
    expect(next.resources.mana).toBe(19)
    const messages = next.logs.map((entry) => entry.message)
    const economyLogs = messages.filter((message) => message.includes('[오늘의 수급]'))
    expect(economyLogs).toHaveLength(1)
    expect(economyLogs[0]).toContain('골드')
    expect(economyLogs[0]).toContain('자재')
    expect(economyLogs[0]).toContain('식량')
    expect(economyLogs[0]).toContain('마력')
  })

  it('can generate an event and resolve an automatic invasion in the same day', () => {
    const state = createInitialGameState()
    state.day = 2
    state.events.daysSinceLastEvent = 2
    state.events.daysSinceDailyEvent = 1

    const next = advanceDay(state, { randomSource: sequenceRandom([0, 0, 0, 0.99]) })

    expect(next.events.currentEventId).toBe('event_small_ore_vein')
    expect(next.invasion.totalDefenses).toBe(0)
    expect(next.invasion.pendingResolution).not.toBeNull()
    expect(next.logs.some((entry) => entry.category === 'invasion')).toBe(false)
  })

  it('recovers Core HP after a peaceful day but skips recovery when an invasion occurs', () => {
    const peaceful = createInitialGameState()
    peaceful.core.hp = 90
    expect(advanceDay(peaceful, { randomSource: { next: () => 0.99 } }).core.hp).toBe(91)

    const invaded = createInitialGameState()
    invaded.core.hp = 90
    const next = advanceDay(invaded, { randomSource: sequenceRandom([0.99, 0, 0, 0.99, 0.99]) })
    expect(next.invasion.totalDefenses).toBe(0)
    expect(next.invasion.pendingResolution).not.toBeNull()
    expect(next.core.hp).toBe(90)
    const applied = applyInvasionResolution(next, next.invasion.pendingResolution!)
    expect(applied.invasion.totalDefenses).toBe(1)
    expect(applied.core.hp).toBeLessThan(90)
  })
})
