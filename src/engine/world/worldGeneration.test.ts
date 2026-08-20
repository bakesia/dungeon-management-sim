import { describe, expect, it } from 'vitest'
import type { RandomSource } from '../random'
import { excavateTile } from '../dungeon/excavation'
import { createInitialGameState, tileId } from '../game/createInitialGameState'
import { getLatentTileResult } from './worldGeneration'

const coordinate = { x: 7, y: -3, floor: 0 }

describe('coordinate world generation', () => {
  it('returns the same latent result for the same seed, version, and coordinate', () => {
    expect(getLatentTileResult('fixed-seed', 1, coordinate)).toEqual(getLatentTileResult('fixed-seed', 1, coordinate))
  })

  it('uses coordinate, seed, and generation version as independent inputs', () => {
    const coordinates = Array.from({ length: 12 }, (_, index) => ({ x: index, y: index - 5, floor: 0 }))
    expect(new Set(coordinates.map((item) => getLatentTileResult('fixed-seed', 1, item).variant)).size).toBeGreaterThan(1)
    expect(new Set(coordinates.map((item) => getLatentTileResult(`seed-${item.x}`, 1, coordinate).variant)).size).toBeGreaterThan(1)
    expect(() => getLatentTileResult('fixed-seed', 2, coordinate)).toThrow('Unsupported world generation version')
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
})
