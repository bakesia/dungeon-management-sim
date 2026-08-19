import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../game/createInitialGameState'
import { adjustWorkerAssignment } from '../population/assignWorkers'
import { buildFacility } from '../construction/facilities'
import { advanceDay } from './advanceDay'

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
    expect(next.logs.map((entry) => entry.message)).toContain('주민들이 식량을 소비했습니다. [식량 -5]')
    expect(next.logs.at(-1)?.message).toBe('DAY 2 시작')
  })

  it('clamps food to zero and adds a warning when food is insufficient', () => {
    const state = createInitialGameState()
    state.resources.food = 2

    const next = advanceDay(state, { randomSource: { next: () => 0.99 } })

    expect(next.resources.food).toBe(0)
    expect(next.logs.some((entry) => entry.category === 'warning' && entry.message.includes('3 부족'))).toBe(true)
  })

  it('processes production before food and maintenance', () => {
    let state = createInitialGameState()
    state = adjustWorkerAssignment(state, 'facility-mine-1', 'worker', 1)
    state = buildFacility(state, 'trap_room', '0:0:-1')

    const next = advanceDay(state, { randomSource: { next: () => 0.99 } })

    expect(next.resources.material).toBe(58)
    expect(next.resources.food).toBe(35)
    expect(next.resources.mana).toBe(19)
    const messages = next.logs.map((entry) => entry.message)
    expect(messages.findIndex((message) => message.includes('채굴장 생산')))
      .toBeLessThan(messages.findIndex((message) => message.includes('식량을 소비')))
    expect(messages.findIndex((message) => message.includes('식량을 소비')))
      .toBeLessThan(messages.findIndex((message) => message.includes('함정실 유지비')))
  })
})
