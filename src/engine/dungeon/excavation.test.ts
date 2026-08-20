import { describe, expect, it } from 'vitest'
import { advanceDay } from '../day/advanceDay'
import { createInitialGameState, tileId } from '../game/createInitialGameState'
import { canExcavate, excavateTile, getExcavationCapacity, getTileMapState } from './excavation'

describe('excavation', () => {
  it('provides two actions per day, charges Material 10, and resets next day', () => {
    let state = createInitialGameState()
    expect(getExcavationCapacity()).toBe(2)
    expect(state.excavation.actionsRemaining).toBe(2)

    state = excavateTile(state, tileId(0, -2))
    expect(state.excavation.actionsRemaining).toBe(1)
    expect(state.resources.material).toBe(70)
    expect(state.dungeon.tiles[tileId(0, -2)]).toMatchObject({ terrain: 'floor', revealed: true })

    state = excavateTile(state, tileId(2, 0))
    expect(state.excavation.actionsRemaining).toBe(0)
    expect(state.resources.material).toBe(60)
    expect(canExcavate(state, tileId(0, 2))).toMatchObject({ allowed: false, reason: '오늘의 굴착 횟수를 모두 사용했습니다.' })
    expect(() => excavateTile(state, tileId(0, 2))).toThrow('오늘의 굴착 횟수')

    state = advanceDay(state, { randomSource: { next: () => 0.99 } })
    expect(state.excavation.actionsRemaining).toBe(2)
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
})
