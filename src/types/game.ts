import type {
  FacilityId,
  GameLogCategory,
  LogPresentation,
  PresentationSoundId,
  RaceId,
  ResourceId,
  TierId,
  EffectDefinition,
  ItemId,
  ResourceCost,
  DiscoveryId,
  PersistentNodeType,
} from './content'

export interface Coordinate {
  x: number
  y: number
  floor?: number
}

export type TileTerrain = 'rock' | 'floor'
export type RoomCondition = 'normal' | 'damaged'

export interface PopulationAssignment {
  raceId: RaceId
  count: number
}

export interface FacilityInstance {
  instanceId: string
  definitionId: FacilityId
  level: number
  residentAssignments: PopulationAssignment[]
  durability: number
  condition: RoomCondition
  tileId: string
}

export interface DungeonTile {
  id: string
  coordinate: Coordinate
  terrain: TileTerrain
  revealed: boolean
  discovery?: {
    discoveryId: DiscoveryId
    variant: number
    resolved: boolean
  }
  persistentNode?: {
    type: PersistentNodeType
  }
  facilityInstanceId?: string
}

export interface PopulationGroup {
  id: string
  raceId: RaceId
  count: number
}

export interface GameLogEntry {
  id: string
  day: number
  message: string
  category: GameLogCategory
  presentation: LogPresentation
  sound?: PresentationSoundId
  presentationGroupId?: string
  presentationSequence?: number
  presentationPriority?: number
}

export interface EventRuntimeState {
  currentEventId: string | null
  pendingEventIds: string[]
  completedEventIds: string[]
  daysSinceLastEvent: number
  daysSinceDailyEvent: number
  history: Array<{ eventId: string; day: number }>
}

export interface InvasionResolution {
  id: string
  invaderId: string
  raidPower: number
  actualCombatPower: number
  startedOnDay: number
  defensePower: number
  success: boolean
  contributions: Array<{ label: string; amount: number }>
  effects: EffectDefinition[]
}

export interface InvasionRuntimeState {
  daysSinceLastInvasion: number
  totalDefenses: number
  totalWins: number
  totalLosses: number
  lastEncounter: {
    sequence: number
    invaderId: string
    result: 'win' | 'loss'
  } | null
  fame: number
  raidPressure: number
  intel: {
    powerRange: boolean
    invaderCategory: boolean
    arrivalEstimate: boolean
  }
  pendingResolution: InvasionResolution | null
}

export interface PopulationJoinRuntimeState {
  pending: {
    incoming: Array<{ raceId: RaceId; count: number }>
    source: 'event' | 'tavern'
    sourceId?: string
    cost?: ResourceCost
  } | null
}

export interface InventoryEntry { itemId: ItemId; quantity: number }

export interface MaintenanceRuntimeState {
  requiredGold: number
  paidGold: number
  shortfall: number
  efficiencyMultiplier: number
}

export interface NpcRuntimeState {
  npcId: string
  eligible: boolean
  discovered: boolean
  joined: boolean
  eligibleSinceDay?: number
  joinedAtDay?: number
  lastVisitDay?: number
  retryAfterDay?: number
}

export interface ActiveMercenary {
  contractId: string
  hiredAtDay: number
  expiresOnDay: number
  combatPower: number
}

export interface TimedModifierState {
  id: string
  type: import('./content').TimedModifierType
  value: number
  targetTag?: string
  expiresOnDay?: number
  consumeOnInvasion: boolean
}

export type GameStatus = 'playing' | 'gameOver' | 'clear'

export interface GameState {
  saveVersion: number
  world: {
    seed: string
    generationVersion: number
  }
  excavation: {
    actionsRemaining: number
  }
  day: number
  resources: Record<ResourceId, number>
  population: PopulationGroup[]
  inventory: InventoryEntry[]
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
  populationJoin: PopulationJoinRuntimeState
  maintenance: MaintenanceRuntimeState
  npcs: Record<string, NpcRuntimeState>
  shop: {
    lastRefreshDay: number
    offerings: Array<{ itemId: string; stock: number }>
  }
  tavern: {
    lastRefreshDay: number
    lastRecruitmentRefreshDay: number
    offers: string[]
    recruitmentOffers: Array<{ offerId: string; remaining: number }>
  }
  activeMercenaries: ActiveMercenary[]
  timedModifiers: TimedModifierState[]
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
