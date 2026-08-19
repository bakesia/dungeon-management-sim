import { SAVE_VERSION } from '../app/version'
import { createInitialGameState } from '../engine/game/createInitialGameState'
import type { GameLogCategory } from '../types/content'
import type { DungeonTile, FacilityInstance, GameLogEntry, GameState } from '../types/game'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeFlags(value: unknown): Record<string, boolean> {
  if (Array.isArray(value)) {
    return Object.fromEntries(value.filter((flag): flag is string => typeof flag === 'string').map((flag) => [flag, true]))
  }

  if (!isRecord(value)) return {}

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean'),
  )
}

function normalizeLogCategory(entry: UnknownRecord): GameLogCategory {
  const validCategories: GameLogCategory[] = ['system', 'resource', 'event', 'invasion', 'warning', 'progression']
  if (typeof entry.category === 'string' && validCategories.includes(entry.category as GameLogCategory)) {
    return entry.category as GameLogCategory
  }

  if (entry.tone === 'warning' || entry.tone === 'danger') return 'warning'
  if (entry.tone === 'positive') return 'resource'
  return 'system'
}

function normalizeLogs(value: unknown, fallbackDay: number): GameLogEntry[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item, index) => {
    if (!isRecord(item) || typeof item.message !== 'string') return []

    return [{
      id: typeof item.id === 'string' ? item.id : `migrated-log-${index}`,
      day: typeof item.day === 'number' ? item.day : fallbackDay,
      message: item.message,
      category: normalizeLogCategory(item),
    }]
  })
}

function normalizeNumberRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {}

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, number] => typeof entry[1] === 'number'),
  )
}

function normalizeDungeon(value: UnknownRecord, saveVersion: number): GameState['dungeon'] {
  const rawTiles = isRecord(value.tiles) ? value.tiles : null
  if (!rawTiles) throw new Error('Invalid save: dungeon tiles are malformed.')

  if (saveVersion === 3) {
    if (!isRecord(value.rooms)) throw new Error('Invalid save: dungeon rooms are malformed.')
    return value as unknown as GameState['dungeon']
  }

  if (saveVersion === 2) {
    if (!isRecord(value.rooms)) throw new Error('Invalid save: dungeon rooms are malformed.')
    const rooms = Object.fromEntries(Object.entries(value.rooms).map(([instanceId, rawRoom]) => {
      if (!isRecord(rawRoom)) throw new Error(`Invalid save: dungeon room "${instanceId}" is malformed.`)
      return [instanceId, { ...rawRoom, condition: 'normal' }]
    })) as GameState['dungeon']['rooms']
    return { tiles: value.tiles as GameState['dungeon']['tiles'], rooms }
  }

  const tiles: Record<string, DungeonTile> = {}
  const rooms: Record<string, FacilityInstance> = {}
  Object.entries(rawTiles).forEach(([id, rawTile]) => {
    if (!isRecord(rawTile) || !isRecord(rawTile.coordinate) || typeof rawTile.status !== 'string') {
      throw new Error(`Invalid save: dungeon tile "${id}" is malformed.`)
    }

    const rawFacility = isRecord(rawTile.facility) ? rawTile.facility : null
    const facilityInstanceId = rawFacility && typeof rawFacility.instanceId === 'string'
      ? rawFacility.instanceId
      : undefined
    tiles[id] = {
      id: typeof rawTile.id === 'string' ? rawTile.id : id,
      coordinate: rawTile.coordinate as unknown as DungeonTile['coordinate'],
      status: rawTile.status as DungeonTile['status'],
      facilityInstanceId,
    }

    if (rawFacility && facilityInstanceId && typeof rawFacility.definitionId === 'string') {
      rooms[facilityInstanceId] = {
        instanceId: facilityInstanceId,
        definitionId: rawFacility.definitionId,
        level: typeof rawFacility.level === 'number' ? rawFacility.level : 1,
        assignedWorkers: isRecord(rawFacility.assignedWorkers)
          ? rawFacility.assignedWorkers as FacilityInstance['assignedWorkers']
          : {},
        durability: typeof rawFacility.durability === 'number' ? rawFacility.durability : 100,
        condition: 'normal',
        tileId: id,
      }
    }
  })

  return { tiles, rooms }
}

export function migrateSaveData(value: unknown): GameState {
  if (!isRecord(value) || typeof value.saveVersion !== 'number') {
    throw new Error('Invalid save: missing numeric saveVersion.')
  }

  if (value.saveVersion !== 1 && value.saveVersion !== 2 && value.saveVersion !== SAVE_VERSION) {
    throw new Error(`Unsupported saveVersion ${value.saveVersion}; expected 1, 2, or ${SAVE_VERSION}.`)
  }

  if (typeof value.day !== 'number' || !Array.isArray(value.population) || !isRecord(value.dungeon)) {
    throw new Error('Invalid save: day, population, or dungeon state is malformed.')
  }

  const fallback = createInitialGameState()
  const core = isRecord(value.core) ? value.core : fallback.core
  const metadata = isRecord(value.metadata) ? value.metadata : fallback.metadata
  const events = isRecord(value.events) ? value.events : fallback.events
  const invasion = isRecord(value.invasion) ? value.invasion : fallback.invasion
  const statistics = isRecord(value.statistics) ? value.statistics : fallback.statistics

  return {
    ...fallback,
    saveVersion: SAVE_VERSION,
    day: value.day,
    resources: { ...fallback.resources, ...normalizeNumberRecord(value.resources) },
    population: value.population as GameState['population'],
    currentTierId: typeof value.currentTierId === 'string' ? value.currentTierId : fallback.currentTierId,
    core: {
      hp: typeof core.hp === 'number' ? core.hp : fallback.core.hp,
      maxHp: typeof core.maxHp === 'number' ? core.maxHp : fallback.core.maxHp,
    },
    dungeon: normalizeDungeon(value.dungeon, value.saveVersion),
    flags: normalizeFlags(value.flags),
    logs: normalizeLogs(value.logs, value.day),
    events: {
      currentEventId: typeof events.currentEventId === 'string' ? events.currentEventId : null,
      completedEventIds: Array.isArray(events.completedEventIds)
        ? events.completedEventIds.filter((id): id is string => typeof id === 'string')
        : [],
      daysSinceLastEvent: typeof events.daysSinceLastEvent === 'number' ? events.daysSinceLastEvent : 0,
    },
    invasion: {
      daysSinceLastInvasion: typeof invasion.daysSinceLastInvasion === 'number' ? invasion.daysSinceLastInvasion : 0,
      totalDefenses: typeof invasion.totalDefenses === 'number' ? invasion.totalDefenses : 0,
      totalWins: typeof invasion.totalWins === 'number' ? invasion.totalWins : 0,
      totalLosses: typeof invasion.totalLosses === 'number' ? invasion.totalLosses : 0,
    },
    statistics: {
      successfulDefenses: typeof statistics.successfulDefenses === 'number' ? statistics.successfulDefenses : 0,
      totalDaysPlayed: typeof statistics.totalDaysPlayed === 'number' ? statistics.totalDaysPlayed : 0,
    },
    status: value.status === 'gameOver' || value.status === 'clear' ? value.status : 'playing',
    metadata: {
      createdAt: typeof metadata.createdAt === 'string' ? metadata.createdAt : fallback.metadata.createdAt,
      updatedAt: typeof metadata.updatedAt === 'string' ? metadata.updatedAt : fallback.metadata.updatedAt,
    },
  }
}
