import { discoveryDefinitionById } from '../../content/discoveries/discoveries'
import { gameRules } from '../../content/gameRules'
import type { ResourceCost } from '../../types/content'
import type { DungeonTile, GameState } from '../../types/game'
import type { ActionCheck } from '../../types/engine'
import { applyEffect } from '../effects/applyEffects'
import { tileId } from '../game/createInitialGameState'
import { canAfford, formatResourceCost, payResourceCost } from '../resources/resourceCosts'
import { getLatentTileResult } from '../world/worldGeneration'

const neighborOffsets = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
]

function getNeighborTiles(state: GameState, tile: DungeonTile): DungeonTile[] {
  return neighborOffsets.flatMap((offset) => {
    const neighbor = state.dungeon.tiles[tileId(
      tile.coordinate.x + offset.x,
      tile.coordinate.y + offset.y,
      tile.coordinate.floor ?? 0,
    )]
    return neighbor ? [neighbor] : []
  })
}

export function getExcavationCapacity(): number {
  return gameRules.excavation.baseActionsPerDay
}

export function getExcavationCost(): ResourceCost {
  return { ...gameRules.excavation.cost }
}

export function isExcavationAccessible(state: GameState, tile: DungeonTile): boolean {
  return tile.terrain === 'rock'
    && tile.revealed
    && getNeighborTiles(state, tile).some((neighbor) => neighbor.terrain === 'floor' && neighbor.revealed)
}

export type TileMapState = 'unrevealed-rock' | 'excavatable-rock' | 'revealed-floor' | 'occupied'

export function getTileMapState(state: GameState, tile: DungeonTile): TileMapState {
  if (tile.facilityInstanceId) return 'occupied'
  if (tile.terrain === 'floor' && tile.revealed) return 'revealed-floor'
  return isExcavationAccessible(state, tile) ? 'excavatable-rock' : 'unrevealed-rock'
}

export function canExcavate(state: GameState, targetTileId: string): ActionCheck {
  const tile = state.dungeon.tiles[targetTileId]
  if (!tile) return { allowed: false, reason: '맵 범위 밖의 좌표는 굴착할 수 없습니다.' }
  if (tile.terrain !== 'rock') return { allowed: false, reason: '암반 타일만 굴착할 수 있습니다.' }
  if (!tile.revealed) return { allowed: false, reason: '아직 접근할 수 없는 암반입니다.' }
  if (!isExcavationAccessible(state, tile)) return { allowed: false, reason: '공개된 바닥과 상하좌우로 인접한 암반만 굴착할 수 있습니다.' }
  if (state.excavation.actionsRemaining <= 0) return { allowed: false, reason: '오늘의 굴착 횟수를 모두 사용했습니다.' }
  if (!canAfford(state, getExcavationCost())) {
    return { allowed: false, reason: `굴착 비용이 부족합니다: ${formatResourceCost(getExcavationCost())}` }
  }
  return { allowed: true }
}

export function excavateTile(state: GameState, targetTileId: string, now = new Date()): GameState {
  const check = canExcavate(state, targetTileId)
  if (!check.allowed) throw new Error(check.reason)

  const originalTarget = state.dungeon.tiles[targetTileId]
  if (!originalTarget) throw new Error(`Tile "${targetTileId}" disappeared during excavation.`)
  const latent = getLatentTileResult(state.world.seed, state.world.generationVersion, originalTarget.coordinate)
  const definition = discoveryDefinitionById[latent.discoveryId]
  let nextState = payResourceCost(state, getExcavationCost(), now)
  const target = nextState.dungeon.tiles[targetTileId]
  if (!target) throw new Error(`Tile "${targetTileId}" disappeared after paying excavation cost.`)

  const tiles = {
    ...nextState.dungeon.tiles,
    [targetTileId]: {
      ...target,
      terrain: 'floor' as const,
      revealed: true,
      discovery: { discoveryId: latent.discoveryId, variant: latent.variant, resolved: true },
      persistentNode: latent.persistentNodeType ? { type: latent.persistentNodeType } : undefined,
    },
  }
  neighborOffsets.forEach((offset) => {
    const neighborId = tileId(
      target.coordinate.x + offset.x,
      target.coordinate.y + offset.y,
      target.coordinate.floor ?? 0,
    )
    const neighbor = tiles[neighborId]
    if (neighbor?.terrain === 'rock' && !neighbor.revealed) tiles[neighborId] = { ...neighbor, revealed: true }
  })

  nextState = {
    ...nextState,
    excavation: { actionsRemaining: nextState.excavation.actionsRemaining - 1 },
    dungeon: { ...nextState.dungeon, tiles },
  }
  const discoveryText = latent.discoveryId === 'empty' ? '' : ` · ${definition.name} 발견`
  const spentText = formatResourceCost(Object.fromEntries(
    Object.entries(getExcavationCost()).map(([resourceId, amount]) => [resourceId, -amount]),
  ))
  return applyEffect(nextState, {
    type: 'addLog',
    category: 'system',
    message: `[굴착] 암반을 굴착했습니다. ${spentText}${discoveryText}`,
  }, now)
}
