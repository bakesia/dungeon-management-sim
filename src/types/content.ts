export type ResourceId = string
export type FacilityId = string
export type RaceId = string
export type TierId = string
export type EventId = string
export type InvaderId = string
export type NpcId = string
export type FeatureId = 'shop' | 'blacksmith' | 'tavern' | 'mage' | 'healer' | 'informant'

export type ResourceCost = Record<ResourceId, number>

export type GameLogCategory =
  | 'system'
  | 'resource'
  | 'event'
  | 'invasion'
  | 'warning'
  | 'progression'

export type LogPresentation = 'instant' | 'typewriter'
export type PresentationSoundId =
  | 'event_positive'
  | 'event_negative'
  | 'event_mixed'
  | 'event_neutral'
  | 'defense_win'
  | 'defense_loss'
  | 'tier_up'

export type EffectDefinition =
  | { type: 'addResource'; resourceId: ResourceId; amount: number }
  | { type: 'addPopulation'; raceId: RaceId; amount: number }
  | { type: 'offerPopulationJoin'; raceId: RaceId; amount: number }
  | { type: 'removePopulation'; raceId: RaceId; amount: number }
  | { type: 'setFlag'; flag: string; value: boolean }
  | { type: 'changeCoreHp'; amount: number }
  | { type: 'damageRoom'; instanceId: string }
  | { type: 'damageRandomRoom' }
  | { type: 'repairRoom'; instanceId: string }
  | { type: 'repairRandomRoom' }
  | { type: 'joinNpc'; npcId: NpcId }
  | { type: 'addTimedModifier'; modifierType: TimedModifierType; value: number; durationDays?: number; targetTag?: string; consumeOnInvasion?: boolean }
  | { type: 'revealInvasionIntel'; intelType: InvasionIntelType }
  | { type: 'changeThreat'; amount: number }
  | { type: 'addLog'; message: string; category?: GameLogCategory; presentation?: LogPresentation; sound?: PresentationSoundId }

export type RoomModifierDefinition =
  | { type: 'combatContributionMultiplier'; value: number }
  | { type: 'residentLossChanceMultiplier'; value: number }

export type TimedModifierType =
  | 'flatDefense'
  | 'defenseMultiplier'
  | 'productionTagMultiplier'
  | 'residentLossChanceMultiplier'

export type InvasionIntelType = 'powerRange' | 'invaderCategory' | 'arrivalEstimate'

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
  | { type: 'npcJoined'; npcId: NpcId; value: boolean }

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
  staffSlots?: number
  goldMaintenance?: number
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
  iconId: string
  modifiers: RaceModifierDefinition[]
  traits: string[]
  tags: string[]
}

export type RaceModifierDefinition =
  | { type: 'roomEfficiencyMultiplier'; targetTag: string; value: number }
  | { type: 'combatMultiplier'; value: number }

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
  cooldownDays?: number
  category?: string
  choices: EventChoiceDefinition[]
  tags: string[]
}

export interface NpcDefinition {
  id: NpcId
  role: string
  displayName: string
  description: string
  unlockConditions: ConditionDefinition[]
  joinEventId: EventId
  featureId: FeatureId
  visitorText: string
  iconId?: string
  tags: string[]
}

export interface ShopItemDefinition {
  id: string
  name: string
  description: string
  cost: ResourceCost
  effects: EffectDefinition[]
  weight: number
  stock: number
  minTier: number
}

export interface MercenaryDefinition {
  id: string
  name: string
  description: string
  combatPower: number
  cost: ResourceCost
  durationDays: number
  weight: number
  minTier: number
}

export interface NpcServiceDefinition {
  id: string
  featureId: Exclude<FeatureId, 'shop' | 'tavern' | 'blacksmith' | 'informant'> | 'blacksmith' | 'informant'
  name: string
  description: string
  cost: ResourceCost
  effects: EffectDefinition[]
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
