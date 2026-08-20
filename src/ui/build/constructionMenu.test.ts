import { describe, expect, it } from 'vitest'
import { getConstructionMenuGroups } from './constructionMenu'

describe('construction menu groups', () => {
  it('shows available facilities first and sorts locked facilities by unlock tier', () => {
    const tierOne = getConstructionMenuGroups(1)
    expect(tierOne.available.map((facility) => facility.id)).toEqual(['quarters', 'mine', 'fungus_farm', 'warehouse'])
    expect(tierOne.locked.map((facility) => facility.requiredTier)).toEqual([2, 2, 2, 2, 3, 3])
    expect(tierOne.locked[0]?.name).toBe('경비실')
  })

  it('reveals facilities immediately when the current tier changes', () => {
    expect(getConstructionMenuGroups(1).locked.some((facility) => facility.id === 'guard_post')).toBe(true)
    expect(getConstructionMenuGroups(2).available.some((facility) => facility.id === 'guard_post')).toBe(true)
  })
})
