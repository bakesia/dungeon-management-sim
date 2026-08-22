import { describe, expect, it } from 'vitest'
import { advanceDay } from '../day/advanceDay'
import { createInitialGameState, tileId } from '../game/createInitialGameState'
import { canExcavate, excavateTile, getExcavationCapacity, getExcavationCost, getTileMapState } from './excavation'
import { getGuaranteedGoldCoordinate, getLatentTileResult } from '../world/worldGeneration'
import { resolveExcavationDiscovery } from './discoveryResolution'
import { revealAdjacentDiscoveries } from './revealAdjacentDiscoveries'

function createStateWithEmptyTargets(targetIds: string[]) {
  const state = createInitialGameState()
  for (let index = 0; index < 10_000; index += 1) {
    const seed = `empty-test-${index}`
    if (targetIds.every((id) => getLatentTileResult(seed, state.world.generationVersion, state.dungeon.tiles[id]!.coordinate).discoveryId === 'empty')) {
      state.world.seed = seed
      return state
    }
  }
  throw new Error('Could not find deterministic empty excavation fixtures.')
}

describe('excavation', () => {
  it('uses the same Manhattan-distance material cost bands for checks and execution', () => {
    expect(getExcavationCost({ x: 3, y: 0 })).toEqual({ material: 10 })
    expect(getExcavationCost({ x: 4, y: 0 })).toEqual({ material: 15 })
    expect(getExcavationCost({ x: 7, y: 0 })).toEqual({ material: 20 })
    expect(getExcavationCost({ x: 10, y: 0 })).toEqual({ material: 25 })

    const state = createInitialGameState()
    const floorId = tileId(3, 0)
    const targetId = tileId(4, 0)
    state.dungeon.tiles[floorId] = { id: floorId, coordinate: { x: 3, y: 0, floor: 0 }, terrain: 'floor', revealed: true }
    state.dungeon.tiles[targetId] = { id: targetId, coordinate: { x: 4, y: 0, floor: 0 }, terrain: 'rock', revealed: true }
    for (let index = 0; index < 10_000; index += 1) {
      const seed = `distance-cost-test-${index}`
      if (getLatentTileResult(seed, state.world.generationVersion, state.dungeon.tiles[targetId]!.coordinate).discoveryId === 'empty') {
        state.world.seed = seed
        break
      }
    }
    state.resources.material = 14
    expect(canExcavate(state, targetId)).toMatchObject({ allowed: false, reason: expect.stringContaining('자재 15') })
    state.resources.material = 15
    const excavated = excavateTile(state, targetId)
    expect(excavated.resources.material).toBe(0)
  })

  it('reveals an orthogonally adjacent latent gold vein once, then preserves it through excavation', () => {
    const state = createInitialGameState()
    state.world.seed = 'adjacent-gold-test'
    const gold = getGuaranteedGoldCoordinate(state.world.seed)
    const goldId = tileId(gold.x, gold.y)
    const floor = gold.x === 0
      ? { x: gold.x, y: gold.y - Math.sign(gold.y) }
      : { x: gold.x - Math.sign(gold.x), y: gold.y }
    const floorId = tileId(floor.x, floor.y)
    state.dungeon.tiles[goldId] = { id: goldId, coordinate: { ...gold, floor: 0 }, terrain: 'rock', revealed: false }
    state.dungeon.tiles[floorId] = { id: floorId, coordinate: { ...floor, floor: 0 }, terrain: 'floor', revealed: true }
    const otherNeighborCoordinates = [{ x: floor.x, y: floor.y - 1 }, { x: floor.x + 1, y: floor.y }, { x: floor.x, y: floor.y + 1 }, { x: floor.x - 1, y: floor.y }]
    otherNeighborCoordinates
      .filter((coordinate) => coordinate.x !== gold.x || coordinate.y !== gold.y)
      .forEach((coordinate) => {
        const id = tileId(coordinate.x, coordinate.y)
        state.dungeon.tiles[id] = { id, coordinate: { ...coordinate, floor: 0 }, terrain: 'floor', revealed: true }
      })

    const revealed = revealAdjacentDiscoveries(state, [floorId])
    expect(revealed.dungeon.tiles[goldId]).toMatchObject({
      terrain: 'rock',
      revealed: true,
      discovery: { discoveryId: 'gold_vein', resolved: false },
    })
    expect(revealed.dungeon.tiles[goldId]?.persistentNode).toBeUndefined()
    expect(revealed.logs.length).toBe(state.logs.length + 1)
    expect(revealAdjacentDiscoveries(revealed, [floorId]).logs).toHaveLength(revealed.logs.length)

    const excavated = excavateTile(revealed, goldId)
    expect(excavated.dungeon.tiles[goldId]).toMatchObject({
      terrain: 'floor',
      discovery: { discoveryId: 'gold_vein', resolved: true },
      persistentNode: { type: 'gold_vein' },
    })
    expect(excavated.logs.filter((log) => log.message.includes('금맥')).length).toBe(1)
  })

  it('does not reveal a latent gold vein from a diagonal floor', () => {
    const state = createInitialGameState()
    state.world.seed = 'diagonal-gold-test'
    const gold = getGuaranteedGoldCoordinate(state.world.seed)
    const goldId = tileId(gold.x, gold.y)
    const diagonalId = tileId(gold.x + 1, gold.y + 1)
    state.dungeon.tiles[goldId] = { id: goldId, coordinate: { ...gold, floor: 0 }, terrain: 'rock', revealed: false }
    state.dungeon.tiles[diagonalId] = { id: diagonalId, coordinate: { x: gold.x + 1, y: gold.y + 1, floor: 0 }, terrain: 'floor', revealed: true }

    const unchanged = revealAdjacentDiscoveries(state, [diagonalId])
    expect(unchanged.dungeon.tiles[goldId]?.discovery).toBeUndefined()
  })

  it('provides two actions per day, charges Material 10, and resets next day', () => {
    let state = createStateWithEmptyTargets([tileId(0, -2), tileId(2, 0)])
    expect(getExcavationCapacity()).toBe(2)
    expect(state.excavation.actionsRemaining).toBe(2)
    expect(state.excavation.totalCompleted).toBe(0)

    state = excavateTile(state, tileId(0, -2))
    expect(state.excavation.actionsRemaining).toBe(1)
    expect(state.resources.material).toBe(70)
    expect(state.excavation.totalCompleted).toBe(1)
    expect(state.dungeon.tiles[tileId(0, -2)]).toMatchObject({ terrain: 'floor', revealed: true })

    state = excavateTile(state, tileId(2, 0))
    expect(state.excavation.actionsRemaining).toBe(0)
    expect(state.resources.material).toBe(60)
    expect(state.excavation.totalCompleted).toBe(2)
    expect(canExcavate(state, tileId(0, 2))).toMatchObject({ allowed: false, reason: '오늘의 굴착 횟수를 모두 사용했습니다.' })
    expect(() => excavateTile(state, tileId(0, 2))).toThrow('오늘의 굴착 횟수')

    state = advanceDay(state, { randomSource: { next: () => 0.99 } })
    expect(state.excavation.actionsRemaining).toBe(2)
    expect(state.excavation.totalCompleted).toBe(2)
  })

  it('blocks insufficient resources and inaccessible or diagonal-only rocks without consuming anything', () => {
    const poor = createInitialGameState()
    poor.resources.material = 0
    const poorSnapshot = structuredClone(poor)
    expect(canExcavate(poor, tileId(0, -2)).allowed).toBe(false)
    expect(() => excavateTile(poor, tileId(0, -2))).toThrow('비용이 부족')
    expect(poor).toEqual(poorSnapshot)

    const inaccessible = createInitialGameState()
    const diagonalId = tileId(2, 1)
    inaccessible.dungeon.tiles[diagonalId] = { ...inaccessible.dungeon.tiles[diagonalId]!, revealed: true }
    expect(getTileMapState(inaccessible, inaccessible.dungeon.tiles[diagonalId]!)).toBe('unrevealed-rock')
    expect(canExcavate(inaccessible, diagonalId)).toMatchObject({ allowed: false })
    const inaccessibleMaterial = inaccessible.resources.material
    const inaccessibleActions = inaccessible.excavation.actionsRemaining
    expect(() => excavateTile(inaccessible, diagonalId)).toThrow('상하좌우')
    expect(inaccessible.resources.material).toBe(inaccessibleMaterial)
    expect(inaccessible.excavation.actionsRemaining).toBe(inaccessibleActions)
    expect(canExcavate(inaccessible, '0:99:99')).toMatchObject({ allowed: false, reason: '맵 범위 밖의 좌표는 굴착할 수 없습니다.' })

    const adjacentId = tileId(0, -2)
    expect(canExcavate(inaccessible, adjacentId).allowed).toBe(true)
    expect(getTileMapState(inaccessible, inaccessible.dungeon.tiles[adjacentId]!)).toBe('excavatable-rock')
  })

  it('stores resolved discovery state and cannot resolve the same tile twice', () => {
    const state = createInitialGameState()
    const targetId = tileId(0, -2)
    const excavated = excavateTile(state, targetId)
    expect(excavated.dungeon.tiles[targetId]?.discovery).toMatchObject({ resolved: true })
    const loaded = structuredClone(excavated)
    expect(loaded.dungeon.tiles[targetId]?.discovery).toEqual(excavated.dungeon.tiles[targetId]?.discovery)
    expect(canExcavate(loaded, targetId).allowed).toBe(false)
    expect(() => excavateTile(loaded, targetId)).toThrow('암반 타일만')
  })

  it('keeps the five-tile starting floor while surrounding rock remains the excavation target', () => {
    const state = createInitialGameState()
    const floorTiles = Object.values(state.dungeon.tiles).filter((tile) => tile.terrain === 'floor' && tile.revealed)
    expect(floorTiles.map((tile) => tile.id).sort()).toEqual([
      tileId(-1, 0),
      tileId(0, -1),
      tileId(0, 0),
      tileId(0, 1),
      tileId(1, 0),
    ].sort())
    expect(state.dungeon.tiles[tileId(0, -2)]).toMatchObject({ terrain: 'rock', revealed: true })
  })

  it('blocks hazards for the first three direct excavations and stores the resolved safe result', () => {
    const targetId = tileId(1, -2)
    const state = createInitialGameState()
    state.dungeon.tiles[tileId(0, -2)] = { ...state.dungeon.tiles[tileId(0, -2)]!, terrain: 'floor', revealed: true }
    state.dungeon.tiles[targetId] = { ...state.dungeon.tiles[targetId]!, revealed: true }
    for (let index = 0; index < 10_000; index += 1) {
      const seed = `hazard-test-${index}`
      if (getLatentTileResult(seed, state.world.generationVersion, state.dungeon.tiles[targetId]!.coordinate).discoveryId === 'hazard') {
        state.world.seed = seed
        break
      }
    }
    const safe = excavateTile(state, targetId)
    expect(safe.dungeon.tiles[targetId]?.discovery?.discoveryId).toBe('empty')
    expect(safe.excavation.totalCompleted).toBe(1)
  })

  it('resolves deterministic material, loot, artifact, hazard, and special outcomes only once', () => {
    const targetId = tileId(0, -2)
    const makeDiscovery = (discoveryId: 'material_cache' | 'loot' | 'artifact' | 'hazard' | 'special_event', variant: number) => {
      const state = createInitialGameState()
      const tile = state.dungeon.tiles[targetId]!
      state.dungeon.tiles[targetId] = { ...tile, terrain: 'floor', revealed: true, discovery: { discoveryId, variant, resolved: true, source: 'excavation' } }
      state.excavation.totalCompleted = 4
      return state
    }
    expect(resolveExcavationDiscovery(makeDiscovery('material_cache', 10), targetId).resources.material).toBe(95)
    expect(resolveExcavationDiscovery(makeDiscovery('loot', 42), targetId).inventory.length).toBeGreaterThan(0)
    expect(resolveExcavationDiscovery(makeDiscovery('artifact', 7), targetId).inventory[0]?.itemId).toContain('artifact_')
    expect(resolveExcavationDiscovery(makeDiscovery('hazard', 1), targetId).resources.mana).toBeLessThan(30)
    expect(resolveExcavationDiscovery(makeDiscovery('special_event', 3), targetId).events.currentEventId).toContain('event_excavation_')

    const material = resolveExcavationDiscovery(makeDiscovery('material_cache', 10), targetId)
    const reloaded = structuredClone(material)
    expect(reloaded.dungeon.tiles[targetId]?.discovery).toEqual(material.dungeon.tiles[targetId]?.discovery)
  })

  it('opens three or four cavern tiles for free without consuming extra material or actions', () => {
    const targetId = tileId(0, -2)
    const state = createInitialGameState()
    const tile = state.dungeon.tiles[targetId]!
    state.dungeon.tiles[targetId] = { ...tile, terrain: 'floor', revealed: true, discovery: { discoveryId: 'cavern', variant: 12345, resolved: true, source: 'excavation' } }
    state.excavation.actionsRemaining = 1
    state.excavation.totalCompleted = 1
    const floorCount = Object.values(state.dungeon.tiles).filter((candidate) => candidate.terrain === 'floor').length
    const resolved = resolveExcavationDiscovery(state, targetId)
    const opened = Object.values(resolved.dungeon.tiles).filter((candidate) => candidate.terrain === 'floor').length - floorCount
    expect([3, 4]).toContain(opened)
    expect(resolved.excavation.actionsRemaining).toBe(1)
    expect(resolved.resources.material).toBeGreaterThanOrEqual(80)
    expect(Object.values(resolved.dungeon.tiles).filter((candidate) => candidate.discovery?.source === 'cavern').length).toBe(opened)
  })

  it('reveals a gold-bearing rock next to a cavern-opened floor', () => {
    const state = createInitialGameState()
    state.world.seed = 'cavern-adjacent-gold-test'
    const gold = getGuaranteedGoldCoordinate(state.world.seed)
    const origin = { x: gold.x - 2, y: gold.y, floor: 0 }
    const originId = tileId(origin.x, origin.y)
    const cavernTiles = [
      { x: origin.x + 1, y: origin.y, floor: 0 },
      { x: origin.x + 1, y: origin.y + 1, floor: 0 },
      { x: origin.x, y: origin.y + 1, floor: 0 },
    ]
    state.dungeon.tiles[originId] = { id: originId, coordinate: origin, terrain: 'floor', revealed: true, discovery: { discoveryId: 'cavern', variant: 0, resolved: true, source: 'excavation' } }
    cavernTiles.forEach((coordinate) => {
      const id = tileId(coordinate.x, coordinate.y)
      state.dungeon.tiles[id] = { id, coordinate, terrain: 'rock', revealed: false }
    })
    const goldId = tileId(gold.x, gold.y)
    state.dungeon.tiles[goldId] = { id: goldId, coordinate: { ...gold, floor: 0 }, terrain: 'rock', revealed: false }
    const materialBefore = state.resources.material
    const actionsBefore = state.excavation.actionsRemaining

    const resolved = resolveExcavationDiscovery(state, originId)
    expect(resolved.dungeon.tiles[goldId]).toMatchObject({
      terrain: 'rock',
      revealed: true,
      discovery: { discoveryId: 'gold_vein', resolved: false },
    })
    expect(resolved.resources.material).toBeGreaterThanOrEqual(materialBefore)
    expect(resolved.excavation.actionsRemaining).toBe(actionsBefore)
  })
})
