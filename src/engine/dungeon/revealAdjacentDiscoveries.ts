import { discoveryDefinitionById } from '../../content/discoveries/discoveries'
import type { DungeonTile, GameState } from '../../types/game'
import { applyEffect } from '../effects/applyEffects'
import { tileId } from '../game/createInitialGameState'
import { getLatentTileResult } from '../world/worldGeneration'

const neighborOffsets = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }]

/** Reveals data-defined discoveries on rock when a newly opened floor touches them orthogonally. */
export function revealAdjacentDiscoveries(
  state: GameState,
  floorTileIds: string[],
  now = new Date(),
): GameState {
  const tiles = { ...state.dungeon.tiles }
  const discovered: DungeonTile[] = []

  floorTileIds.forEach((floorTileId) => {
    const floorTile = tiles[floorTileId]
    if (!floorTile || floorTile.terrain !== 'floor' || !floorTile.revealed) return
    neighborOffsets.forEach((offset) => {
      const neighborId = tileId(
        floorTile.coordinate.x + offset.x,
        floorTile.coordinate.y + offset.y,
        floorTile.coordinate.floor ?? 0,
      )
      const rock = tiles[neighborId]
      if (!rock || rock.terrain !== 'rock' || rock.discovery) return
      const latent = getLatentTileResult(state.world.seed, state.world.generationVersion, rock.coordinate)
      const definition = discoveryDefinitionById[latent.discoveryId]
      if (!definition.revealWhenAdjacentFloor) return
      const revealedRock: DungeonTile = {
        ...rock,
        revealed: true,
        discovery: { discoveryId: latent.discoveryId, variant: latent.variant, resolved: false },
      }
      tiles[neighborId] = revealedRock
      discovered.push(revealedRock)
    })
  })

  let nextState = discovered.length > 0
    ? { ...state, dungeon: { ...state.dungeon, tiles } }
    : state
  discovered.forEach((tile) => {
    const definition = discoveryDefinitionById[tile.discovery!.discoveryId]
    nextState = applyEffect(nextState, {
      type: 'addLog',
      category: 'progression',
      message: `[발견]\n${definition.name}이 있는 암반이 드러났습니다. [좌표 ${tile.coordinate.x}, ${tile.coordinate.y}]`,
      presentation: 'typewriter',
      sound: 'event_positive',
    }, now)
  })
  return nextState
}
