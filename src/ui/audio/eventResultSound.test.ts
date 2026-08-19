import { describe, expect, it } from 'vitest'
import { getEventResultSound } from './eventResultSound'

describe('getEventResultSound', () => {
  it('distinguishes positive, negative, mixed, and neutral outcomes', () => {
    expect(getEventResultSound([{ type: 'addResource', resourceId: 'gold', amount: 5 }])).toBe('event_positive')
    expect(getEventResultSound([{ type: 'changeCoreHp', amount: -5 }])).toBe('event_negative')
    expect(getEventResultSound([
      { type: 'addResource', resourceId: 'mana', amount: 8 },
      { type: 'changeCoreHp', amount: -5 },
    ])).toBe('event_mixed')
    expect(getEventResultSound([{ type: 'addLog', message: '아무 일도 없었습니다.' }])).toBe('event_neutral')
  })
})
