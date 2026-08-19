export type ResourceId = string
export type FacilityId = string
export type RaceId = string
export type JobId = string
export type TierId = string

export type ResourceCost = Record<ResourceId, number>

export type LogTone = 'default' | 'positive' | 'warning' | 'danger' | 'system'

export type EffectDefinition =
  | { type: 'resource'; resourceId: ResourceId; amount: number }
  | { type: 'coreHp'; amount: number }
  | { type: 'flag'; flag: string; operation: 'add' | 'remove' }
  | { type: 'log'; message: string; tone?: LogTone }

export type ConditionDefinition =
  | { type: 'resource'; resourceId: ResourceId; comparison: 'atLeast' | 'atMost'; value: number }
  | { type: 'population'; comparison: 'atLeast' | 'atMost'; value: number }
  | { type: 'flag'; flag: string; exists: boolean }
  | { type: 'tier'; tierId: TierId }

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
  populationCapacity?: number
  storageCapacity?: Partial<Record<ResourceId, number>>
  defense?: number
  requiredWorkers?: Partial<Record<JobId, number>>
}

export interface FacilityDefinition {
  id: FacilityId
  name: string
  shortName: string
  description: string
  category: 'core' | 'housing' | 'production' | 'storage' | 'defense'
  buildable: boolean
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
  tags: string[]
}

export interface TierDefinition {
  id: TierId
  level: number
  name: string
  invasionChance: number
  requirements: ConditionDefinition[]
}
