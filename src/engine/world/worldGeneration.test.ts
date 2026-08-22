import { describe, expect, it } from 'vitest'
import type { RandomSource } from '../random'
import { excavateTile } from '../dungeon/excavation'
import { createInitialGameState, tileId } from '../game/createInitialGameState'
import { getCavernShape, getCavernTileResult, getGuaranteedGoldCoordinate, getLatentTileResult } from './worldGeneration'

const coordinate = { x: 7, y: -3, floor: 0 }

describe('coordinate world generation', () => {
  it('returns the same latent result for the same seed, version, and coordinate', () => {
    expect(getLatentTileResult('fixed-seed', 1, coordinate)).toEqual(getLatentTileResult('fixed-seed', 1, coordinate))
  })

  it('uses coordinate, seed, and generation version as independent inputs', () => {
    const coordinates = Array.from({ length: 12 }, (_, index) => ({ x: index, y: index - 5, floor: 0 }))
    expect(new Set(coordinates.map((item) => getLatentTileResult('fixed-seed', 1, item).variant)).size).toBeGreaterThan(1)
    expect(new Set(coordinates.map((item) => getLatentTileResult(`seed-${item.x}`, 1, coordinate).variant)).size).toBeGreaterThan(1)
    expect(getLatentTileResult('fixed-seed', 2, coordinate)).toEqual(getLatentTileResult('fixed-seed', 2, coordinate))
    expect(() => getLatentTileResult('fixed-seed', 3, coordinate)).toThrow('Unsupported world generation version')
  })

  it('does not depend on general RNG consumption or save serialization', () => {
    let consumed = 0
    const generalRandom: RandomSource = { next: () => (++consumed % 10) / 10 }
    const before = getLatentTileResult('fixed-seed', 1, coordinate)
    for (let index = 0; index < 10; index += 1) generalRandom.next()
    expect(getLatentTileResult('fixed-seed', 1, coordinate)).toEqual(before)

    const state = createInitialGameState()
    const loaded = JSON.parse(JSON.stringify(state)) as typeof state
    expect(getLatentTileResult(loaded.world.seed, loaded.world.generationVersion, coordinate))
      .toEqual(getLatentTileResult(state.world.seed, state.world.generationVersion, coordinate))
  })

  it('keeps coordinate results unchanged when two accessible rocks are excavated in reverse order', () => {
    const firstId = tileId(0, -2)
    const secondId = tileId(2, 0)
    const initial = createInitialGameState(new Date(), { next: () => 0.25 })
    const firstThenSecond = excavateTile(excavateTile(initial, firstId), secondId)
    const secondThenFirst = excavateTile(excavateTile(initial, secondId), firstId)

    expect(firstThenSecond.dungeon.tiles[firstId]?.discovery).toEqual(secondThenFirst.dungeon.tiles[firstId]?.discovery)
    expect(firstThenSecond.dungeon.tiles[secondId]?.discovery).toEqual(secondThenFirst.dungeon.tiles[secondId]?.discovery)
  })

  it('keeps the guaranteed first vein inside the connected map, away from the core axes', () => {
    for (let index = 0; index < 100; index += 1) {
      const seed = `gold-guardrail-${index}`
      const guaranteed = getGuaranteedGoldCoordinate(seed)
      expect([3, 4]).toContain(Math.abs(guaranteed.x) + Math.abs(guaranteed.y))
      expect(guaranteed.x).not.toBe(0)
      expect(guaranteed.y).not.toBe(0)
      expect(getLatentTileResult(seed, 2, guaranteed).discoveryId).toBe('gold_vein')
    }
  })

  it('samples the target discovery bands without early danger or adjacent cavern/rare piles', () => {
    const counts = new Map<string, number>()
    let samples = 0
    for (let seedIndex = 0; seedIndex < 250; seedIndex += 1) {
      const seed = `distribution-${seedIndex}`
      for (let y = -3; y <= 3; y += 1) for (let x = -3; x <= 3; x += 1) {
        if ((x === 0 && Math.abs(y) <= 1) || (y === 0 && Math.abs(x) <= 1)) continue
        const result = getLatentTileResult(seed, 2, { x, y })
        counts.set(result.discoveryId, (counts.get(result.discoveryId) ?? 0) + 1)
        samples += 1
        if (Math.abs(x) + Math.abs(y) <= 2) expect(result.discoveryId).not.toBe('hazard')
        if (result.discoveryId === 'cavern' || result.discoveryId === 'artifact' || result.discoveryId === 'special_event') {
          const neighborIds = [{ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 }]
            .map((neighbor) => getLatentTileResult(seed, 2, neighbor).discoveryId)
          if (result.discoveryId === 'cavern') expect(neighborIds).not.toContain('cavern')
          if (result.discoveryId === 'artifact' || result.discoveryId === 'special_event') {
            expect(neighborIds.every((id) => id !== 'artifact' && id !== 'special_event')).toBe(true)
          }
        }
      }
    }
    const ratio = (id: string) => (counts.get(id) ?? 0) / samples
    expect(ratio('empty')).toBeGreaterThan(0.45)
    expect(ratio('empty')).toBeLessThan(0.68)
    expect(ratio('material_cache')).toBeGreaterThan(0.08)
    expect(ratio('cavern')).toBeGreaterThan(0.06)
    expect(ratio('loot')).toBeGreaterThan(0.05)
    expect(ratio('hazard')).toBeGreaterThan(0.035)
    expect(ratio('gold_vein')).toBeGreaterThan(0.025)
    expect(ratio('artifact')).toBeGreaterThan(0.008)
    expect(ratio('special_event')).toBeGreaterThan(0.003)
  })

  it('places the first vein around the intended normal exploration window across many seeds', () => {
    const explorationOrder = Array.from({ length: 7 * 7 }, (_, index) => ({ x: index % 7 - 3, y: Math.floor(index / 7) - 3 }))
      .filter(({ x, y }) => !((x === 0 && Math.abs(y) <= 1) || (y === 0 && Math.abs(x) <= 1)))
      .sort((first, second) => Math.abs(first.x) + Math.abs(first.y) - Math.abs(second.x) - Math.abs(second.y)
        || first.y - second.y || first.x - second.x)
    const timings = Array.from({ length: 500 }, (_, index) => {
      const seed = `timing-${index}`
      return explorationOrder.findIndex((coordinate) => getLatentTileResult(seed, 2, coordinate).discoveryId === 'gold_vein') + 1
    })
    const average = timings.reduce((total, value) => total + value, 0) / timings.length
    expect(timings.every((value) => value > 0)).toBe(true)
    expect(average).toBeGreaterThanOrEqual(15)
    expect(average).toBeLessThanOrEqual(24)
    expect(timings.filter((value) => value <= 22).length / timings.length).toBeGreaterThan(0.55)
  })

  it('keeps cavern shapes and lowered internal rewards deterministic without cavern or gold chains', () => {
    expect(getCavernShape(12345)).toEqual(getCavernShape(12345))
    expect([3, 4]).toContain(getCavernShape(12345).additionalTiles)
    for (let index = 0; index < 100; index += 1) {
      const result = getCavernTileResult('cavern-seed', 2, { x: 0, y: 2 }, { x: index, y: -index })
      expect(['empty', 'loot', 'material_cache', 'hazard', 'artifact']).toContain(result.discoveryId)
    }
  })
})
