export type ResourceId = string
export type FacilityId = string
export type RaceId = string
export type JobId = string
export type TierId = string
export type EventId = string
export type InvaderId = string

export type ResourceCost = Record<ResourceId, number>

export type GameLogCategory =
  | 'system'
  | 'resource'
  | 'event'
  | 'invasion'
  | 'warning'
  | 'progression'

export type EffectDefinition =
  | { type: 'addResource'; resourceId: ResourceId; amount: number }
  | { type: 'addPopulation'; raceId: RaceId; jobId: JobId; amount: number }
  | { type: 'removePopulation'; raceId: RaceId; jobId?: JobId; amount: number }
  | { type: 'setFlag'; flag: string; value: boolean }
  | { type: 'changeCoreHp'; amount: number }
  | { type: 'damageRoom'; instanceId: string }
  | { type: 'damageRandomRoom' }
  | { type: 'repairRoom'; instanceId: string }
  | { type: 'repairRandomRoom' }
  | { type: 'addLog'; message: string; category?: GameLogCategory }

export type RoomModifierDefinition =
  | { type: 'guardContributionMultiplier'; value: number }
  | { type: 'residentLossChanceMultiplier'; value: number }

export type ConditionDefinition =
  | { type: 'resourceAtLeast'; resourceId: ResourceId; amount: number }
  | { type: 'resourceAtMost'; resourceId: ResourceId; amount: number }
  | { type: 'populationAtLeast'; amount: number }
  | { type: 'populationSpaceAtLeast'; amount: number }
  | { type: 'hasRace'; raceId: RaceId }
  | { type: 'hasRoom'; facilityId: FacilityId; minLevel?: number }
  | { type: 'roomCountAtLeast'; amount: number }
  | { type: 'roomLevelCountAtLeast'; minLevel: number; amount: number }
  | { type: 'defenseWinsAtLeast'; amount: number }
  | { type: 'tierAtLeast'; level: number }
  | { type: 'flagEquals'; flag: string; value: boolean }
  | { type: 'dayAtLeast'; day: number }

export interface ResourceDefinition {
  id: ResourceId
  name: string
  shortName: string
  color: string
  initialAmount: number
}

export interface FacilityLevelDefinition {
  level: number
  upgradeCost?: ResourceCost
  dailyEffects: EffectDefinition[]
  maintenanceEffects?: EffectDefinition[]
  populationCapacity?: number
  storageCapacity?: Partial<Record<ResourceId, number>>
  defense?: number
  requiredWorkers?: Partial<Record<JobId, number>>
  modifiers?: RoomModifierDefinition[]
}

export interface FacilityDefinition {
  id: FacilityId
  name: string
  shortName: string
  description: string
  category: 'core' | 'housing' | 'production' | 'storage' | 'defense'
  buildable: boolean
  requiredTier: number
  buildCost: ResourceCost
  levels: FacilityLevelDefinition[]
  tags: string[]
  requirements: ConditionDefinition[]
}

export interface RaceDefinition {
  id: RaceId
  name: string
  description: string
  foodConsumption: number
  productionModifiers: Record<string, number>
  combatModifier: number
  traits: string[]
  tags: string[]
}

export interface JobDefinition {
  id: JobId
  name: string
  description: string
  combatContribution: number
  tags: string[]
}

export interface TierDefinition {
  id: TierId
  level: number
  name: string
  invasionChance: number
  requirements: ConditionDefinition[]
  promotionRewards: EffectDefinition[]
}

export interface EventChoiceDefinition {
  id: string
  text: string
  conditions?: ConditionDefinition[]
  effects: EffectDefinition[]
}

export interface EventDefinition {
  id: EventId
  title: string
  text: string
  conditions: ConditionDefinition[]
  weight: number
  once: boolean
  choices: EventChoiceDefinition[]
  tags: string[]
}

export interface InvaderDefinition {
  id: InvaderId
  name: string
  combatPower: number
  raidPower: number
  allowedTierMin: number
  allowedTierMax: number
  rewards: EffectDefinition[]
  tags: string[]
}
