import type {
  FacilityId,
  JobId,
  LogTone,
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
}

export interface DungeonTile {
  id: string
  coordinate: Coordinate
  status: TileStatus
  facility?: FacilityInstance
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
  tone: LogTone
}

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
  }
  flags: string[]
  logs: GameLogEntry[]
  statistics: {
    successfulDefenses: number
    lastInvasionDay: number | null
  }
  metadata: {
    createdAt: string
    updatedAt: string
  }
}
