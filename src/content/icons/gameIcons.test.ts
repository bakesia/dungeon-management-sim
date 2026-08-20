import { describe, expect, it } from 'vitest'
import { facilityDefinitions } from '../facilities/facilities'
import { resourceDefinitions } from '../resources/resources'
import { GAME_ICON_ATLAS_COLUMNS, GAME_ICON_ATLAS_ROWS, gameIconDefinitionById, gameIconDefinitions } from './gameIcons'

describe('game icon mappings', () => {
  it('resolves every active resource and facility icon', () => {
    for (const resource of resourceDefinitions) expect(gameIconDefinitionById[resource.iconId]).toBeDefined()
    for (const facility of facilityDefinitions) expect(gameIconDefinitionById[facility.iconId]).toBeDefined()
  })

  it('includes HUD icons inside the atlas bounds', () => {
    expect(gameIconDefinitionById.hud_population).toBeDefined()
    expect(gameIconDefinitionById.hud_fame).toBeDefined()
    for (const icon of gameIconDefinitions) {
      expect(icon.column).toBeGreaterThanOrEqual(0)
      expect(icon.column).toBeLessThan(GAME_ICON_ATLAS_COLUMNS)
      expect(icon.row).toBeGreaterThanOrEqual(0)
      expect(icon.row).toBeLessThan(GAME_ICON_ATLAS_ROWS)
    }
  })
})
