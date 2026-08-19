import { describe, expect, it } from 'vitest'
import { emptyBuildIntent, getReadyBuild, selectBuildFacility, selectBuildTarget } from './buildIntent'

describe('build intent', () => {
  it('resolves a tile-first build without asking for the tile again', () => {
    const intent = selectBuildFacility(selectBuildTarget(emptyBuildIntent, 'tile-a'), 'mine')
    expect(getReadyBuild(intent)).toEqual({ facilityId: 'mine', targetTileId: 'tile-a' })
  })

  it('resolves a facility-first build when a tile is later selected', () => {
    const intent = selectBuildTarget(selectBuildFacility(emptyBuildIntent, 'quarters'), 'tile-b')
    expect(getReadyBuild(intent)).toEqual({ facilityId: 'quarters', targetTileId: 'tile-b' })
  })
})
