import { describe, expect, it } from 'vitest'
import { getFameLevel } from './processInvasion'

describe('infamy rank derivation', () => {
  it('moves up and down directly from the current numeric value', () => {
    expect(getFameLevel(10)).toBe('소문난')
    expect(getFameLevel(9)).toBe('무명')
    expect(getFameLevel(65)).toBe('악명 높은')
    expect(getFameLevel(29)).toBe('소문난')
  })
})
