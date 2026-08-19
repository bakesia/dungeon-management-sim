import { resourceDefinitions } from '../../content/resources/resources'
import type { FacilityInstance, GameState, DungeonTile } from '../../types/game'

export const CURRENT_SAVE_VERSION = 1

const tileId = (x: number, y: number, floor = 0) => `${floor}:${x}:${y}`

const createFacility = (definitionId: string, instanceId: string): FacilityInstance => ({
  instanceId,
  definitionId,
  level: 1,
  assignedWorkers: {},
  durability: 100,
})

function createInitialTiles(): Record<string, DungeonTile> {
  const tiles: Record<string, DungeonTile> = {}

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

  tiles[tileId(0, 0)] = {
    id: tileId(0, 0),
    coordinate: { x: 0, y: 0, floor: 0 },
    status: 'occupied',
    facility: createFacility('dungeon_core', 'facility-core-1'),
  }
  tiles[tileId(-1, 0)] = {
    id: tileId(-1, 0),
    coordinate: { x: -1, y: 0, floor: 0 },
    status: 'occupied',
    facility: createFacility('mine', 'facility-mine-1'),
  }
  tiles[tileId(1, 0)] = {
    id: tileId(1, 0),
    coordinate: { x: 1, y: 0, floor: 0 },
    status: 'occupied',
    facility: createFacility('quarters', 'facility-quarters-1'),
  }
  tiles[tileId(0, -1)] = {
    id: tileId(0, -1),
    coordinate: { x: 0, y: -1, floor: 0 },
    status: 'empty',
  }
  tiles[tileId(0, 1)] = {
    id: tileId(0, 1),
    coordinate: { x: 0, y: 1, floor: 0 },
    status: 'empty',
  }

  return tiles
}

export function createInitialGameState(now = new Date()): GameState {
  const timestamp = now.toISOString()

  return {
    saveVersion: CURRENT_SAVE_VERSION,
    day: 1,
    resources: Object.fromEntries(
      resourceDefinitions.map((resource) => [resource.id, resource.initialAmount]),
    ),
    population: [
      { id: 'goblin-workers-1', raceId: 'goblin', jobId: 'worker', count: 4 },
      { id: 'goblin-guards-1', raceId: 'goblin', jobId: 'guard', count: 1 },
    ],
    currentTierId: 'tier_1',
    core: { hp: 100, maxHp: 100 },
    dungeon: { tiles: createInitialTiles() },
    flags: [],
    logs: [
      { id: 'opening-1', day: 1, message: '오래 잠들어 있던 던전 코어가 희미하게 빛나기 시작합니다.', tone: 'system' },
      { id: 'opening-2', day: 1, message: '고블린 주민 5명이 당신의 명령을 기다리고 있습니다.', tone: 'default' },
      { id: 'opening-3', day: 1, message: '주변의 막힌 공간을 굴착해 던전을 확장하십시오.', tone: 'warning' },
    ],
    statistics: {
      successfulDefenses: 0,
      lastInvasionDay: null,
    },
    metadata: {
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  }
}
