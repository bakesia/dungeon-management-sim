import { gameRules } from '../../content/gameRules'
import type { ResourceCost } from '../../types/content'
import type { GameState } from '../../types/game'
import type { ActionCheck } from '../../types/engine'
import { applyEffect } from '../effects/applyEffects'
import { tileId } from '../game/createInitialGameState'
import { canAfford, formatResourceCost, payResourceCost } from '../resources/resourceCosts'

const neighborOffsets = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
]

function isSecuredTile(status: string): boolean {
  return status === 'empty' || status === 'occupied'
}

export function getDigCost(): ResourceCost {
  return { ...gameRules.excavation.cost }
}

export function canDigTile(state: GameState, targetTileId: string): ActionCheck {
  const tile = state.dungeon.tiles[targetTileId]
  if (!tile) return { allowed: false, reason: `타일 "${targetTileId}"을 찾을 수 없습니다.` }
  if (tile.status !== 'diggable') return { allowed: false, reason: '굴착 가능한 암반만 굴착할 수 있습니다.' }

  const isAdjacent = neighborOffsets.some((offset) => {
    const neighbor = state.dungeon.tiles[tileId(
      tile.coordinate.x + offset.x,
      tile.coordinate.y + offset.y,
      tile.coordinate.floor ?? 0,
    )]
    return neighbor ? isSecuredTile(neighbor.status) : false
  })

  if (!isAdjacent) return { allowed: false, reason: '확보된 던전과 인접한 공간만 굴착할 수 있습니다.' }
  if (!canAfford(state, getDigCost())) return { allowed: false, reason: `굴착 비용이 부족합니다: ${formatResourceCost(getDigCost())}` }
  return { allowed: true }
}

export function digTile(state: GameState, targetTileId: string, now = new Date()): GameState {
  const check = canDigTile(state, targetTileId)
  if (!check.allowed) throw new Error(check.reason)

  let nextState = payResourceCost(state, getDigCost(), now)
  const target = nextState.dungeon.tiles[targetTileId]
  if (!target) throw new Error(`Tile "${targetTileId}" disappeared during excavation.`)

  const tiles = { ...nextState.dungeon.tiles, [targetTileId]: { ...target, status: 'empty' as const } }
  neighborOffsets.forEach((offset) => {
    const neighborId = tileId(
      target.coordinate.x + offset.x,
      target.coordinate.y + offset.y,
      target.coordinate.floor ?? 0,
    )
    const neighbor = tiles[neighborId]
    if (neighbor?.status === 'undiscovered') tiles[neighborId] = { ...neighbor, status: 'diggable' }
  })

  nextState = { ...nextState, dungeon: { ...nextState.dungeon, tiles } }
  return applyEffect(nextState, {
    type: 'addLog',
    category: 'system',
    message: `암반을 굴착해 빈 공간을 확보했습니다. [${formatResourceCost(getDigCost())} 소모]`,
  }, now)
}
