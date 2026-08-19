import { SAVE_VERSION } from '../../app/version'
import {
  initialEmptyTileCoordinates,
  initialFacilityPlacements,
  initialPopulationGroups,
} from '../../content/initialGame'
import { resourceDefinitions } from '../../content/resources/resources'
import type { DungeonTile, FacilityInstance, GameState } from '../../types/game'

export const tileId = (x: number, y: number, floor = 0) => `${floor}:${x}:${y}`

function createFacility(definitionId: string, instanceId: string, roomTileId: string): FacilityInstance {
  return {
    instanceId,
    definitionId,
    level: 1,
    assignedWorkers: {},
    durability: 100,
    tileId: roomTileId,
  }
}

function createInitialDungeon(): GameState['dungeon'] {
  const tiles: Record<string, DungeonTile> = {}
  const rooms: Record<string, FacilityInstance> = {}

  for (let y = -3; y <= 3; y += 1) {
    for (let x = -3; x <= 3; x += 1) {
      const id = tileId(x, y)
      tiles[id] = {
        id,
        coordinate: { x, y, floor: 0 },
        status: Math.abs(x) + Math.abs(y) <= 2 ? 'diggable' : 'undiscovered',
      }
    }
  }

  initialFacilityPlacements.forEach((placement) => {
    const id = tileId(placement.x, placement.y)
    const room = createFacility(placement.definitionId, placement.instanceId, id)
    rooms[room.instanceId] = room
    tiles[id] = {
      id,
      coordinate: { x: placement.x, y: placement.y, floor: 0 },
      status: 'occupied',
      facilityInstanceId: room.instanceId,
    }
  })

  initialEmptyTileCoordinates.forEach((coordinate) => {
    const id = tileId(coordinate.x, coordinate.y)
    tiles[id] = {
      id,
      coordinate: { ...coordinate, floor: 0 },
      status: 'empty',
    }
  })

  return { tiles, rooms }
}

export function createInitialGameState(now = new Date()): GameState {
  const timestamp = now.toISOString()

  return {
    saveVersion: SAVE_VERSION,
    day: 1,
    resources: Object.fromEntries(
      resourceDefinitions.map((resource) => [resource.id, resource.initialAmount]),
    ),
    population: initialPopulationGroups.map((group) => ({ ...group })),
    currentTierId: 'tier_1',
    core: { hp: 100, maxHp: 100 },
    dungeon: createInitialDungeon(),
    flags: {},
    logs: [
      {
        id: 'opening-1',
        day: 1,
        message: '오래 잠들어 있던 던전 코어가 희미하게 빛나기 시작합니다.',
        category: 'system',
      },
      {
        id: 'opening-2',
        day: 1,
        message: '고블린 주민 5명이 당신의 명령을 기다리고 있습니다.',
        category: 'system',
      },
      {
        id: 'opening-3',
        day: 1,
        message: '주변의 막힌 공간을 굴착해 던전을 확장하십시오.',
        category: 'warning',
      },
    ],
    events: {
      currentEventId: null,
      completedEventIds: [],
      daysSinceLastEvent: 0,
    },
    invasion: {
      daysSinceLastInvasion: 0,
      totalDefenses: 0,
      totalWins: 0,
      totalLosses: 0,
    },
    statistics: {
      successfulDefenses: 0,
      totalDaysPlayed: 0,
    },
    status: 'playing',
    metadata: {
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  }
}
