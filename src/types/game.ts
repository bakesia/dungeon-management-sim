import type {
  FacilityId,
  GameLogCategory,
  JobId,
  RaceId,
  ResourceId,
  TierId,
} from './content'

export interface Coordinate {
  x: number
  y: number
  floor?: number
}

export type TileStatus = 'undiscovered' | 'diggable' | 'empty' | 'occupied'

export interface FacilityInstance {
  instanceId: string
  definitionId: FacilityId
  level: number
  assignedWorkers: Partial<Record<JobId, number>>
  durability: number
  tileId: string
}

export interface DungeonTile {
  id: string
  coordinate: Coordinate
  status: TileStatus
  facilityInstanceId?: string
}

export interface PopulationGroup {
  id: string
  raceId: RaceId
  jobId: JobId
  count: number
}

export interface GameLogEntry {
  id: string
  day: number
  message: string
  category: GameLogCategory
}

export interface EventRuntimeState {
  currentEventId: string | null
  completedEventIds: string[]
  daysSinceLastEvent: number
}

export interface InvasionRuntimeState {
  daysSinceLastInvasion: number
  totalDefenses: number
  totalWins: number
  totalLosses: number
}

export type GameStatus = 'playing' | 'gameOver' | 'clear'

export interface GameState {
  saveVersion: number
  day: number
  resources: Record<ResourceId, number>
  population: PopulationGroup[]
  currentTierId: TierId
  core: {
    hp: number
    maxHp: number
  }
  dungeon: {
    tiles: Record<string, DungeonTile>
    rooms: Record<string, FacilityInstance>
  }
  flags: Record<string, boolean>
  logs: GameLogEntry[]
  events: EventRuntimeState
  invasion: InvasionRuntimeState
  statistics: {
    successfulDefenses: number
    totalDaysPlayed: number
  }
  status: GameStatus
  metadata: {
    createdAt: string
    updatedAt: string
  }
}
