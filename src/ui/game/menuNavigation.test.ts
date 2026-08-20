import { describe, expect, it } from 'vitest'
import { headerMenuView, quickAccessNpcMenuView } from './menuNavigation'

describe('quick access menu navigation', () => {
  it('keeps the header menu and NPC shortcut on separate initial views', () => {
    expect(headerMenuView).toBe('main')
    expect(quickAccessNpcMenuView).toBe('npcs')
  })
})
