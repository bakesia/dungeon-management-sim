export type ResourceId = string
export type FacilityId = string
export type RaceId = string
export type TierId = string
export type EventId = string
export type InvaderId = string
export type NpcId = string
export type ItemId = string
export type DiscoveryId =
  | 'empty'
  | 'material_cache'
  | 'cavern'
  | 'loot'
  | 'hazard'
  | 'gold_vein'
  | 'artifact'
  | 'special_event'
export type PersistentNodeType = 'gold_vein'
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
  | { type: 'scheduleNpcRetry'; npcId: NpcId; days: number }
  | { type: 'addTimedModifier'; modifierType: TimedModifierType; value: number; durationDays?: number; targetTag?: string; consumeOnInvasion?: boolean }
  | { type: 'revealInvasionIntel'; intelType: InvasionIntelType }
  | { type: 'changeFame'; amount: number }
  | { type: 'addItem'; itemId: ItemId; quantity: number }
  | { type: 'removeItem'; itemId: ItemId; quantity: number }
  | { type: 'addLog'; message: string; category?: GameLogCategory; presentation?: LogPresentation; sound?: PresentationSoundId; logDay?: number; presentationGroupId?: string; presentationSequence?: number; presentationPriority?: number }

export type RoomModifierDefinition =
  | { type: 'combatContributionMultiplier'; value: number }
  | { type: 'residentLossChanceMultiplier'; value: number }

export type TimedModifierType =
  | 'flatDefense'
  | 'defenseMultiplier'
  | 'productionTagMultiplier'
  | 'residentLossChanceMultiplier'
  | 'raidChanceOffset'

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
  | { type: 'fameAtLeast'; amount: number }
  | { type: 'tierAtLeast'; level: number }
  | { type: 'flagEquals'; flag: string; value: boolean }
  | { type: 'dayAtLeast'; day: number }
  | { type: 'npcJoined'; npcId: NpcId; value: boolean }
  | { type: 'npcEligible'; npcId: NpcId; value: boolean }
  | { type: 'hasItem'; itemId: ItemId; quantity?: number }

export type ItemCategory = 'loot' | 'artifact' | 'consumable' | 'special'
export type ItemModifierDefinition =
  | { type: 'resourceCapacityBonus'; resourceId: ResourceId; amount: number }
  | { type: 'flatDefense'; amount: number }
  | { type: 'defenseMultiplier'; value: number }
  | { type: 'productionFlatBonus'; targetTag: string; resourceId: ResourceId; amount: number }

export interface ItemDefinition {
  id: ItemId
  name: string
  description: string
  category: ItemCategory
  sellValue: number
  tags: string[]
  iconId: string
  modifiers?: ItemModifierDefinition[]
}

export interface DiscoveryDefinition {
  id: DiscoveryId
  name: string
  description: string
  resolution: 'none' | 'one_shot' | 'persistent'
  persistentNodeType?: PersistentNodeType
  generationWeight: number
}

export interface LootDropDefinition {
  itemId: ItemId
  chance: number
  quantity: { min: number; max: number }
}

export interface ResourceDefinition {
  id: ResourceId
  name: string
  shortName: string
  color: string
  initialAmount: number
  baseCapacity: number
  iconId: string
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
  role: string
  iconId: string
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

export interface RecruitmentOfferDefinition {
  id: string
  name: string
  description: string
  raceId: RaceId
  count: number
  cost: ResourceCost
  stock: number
  weight: number
  minTier: number
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
  precursorFlags: string[]
  visitPityDays: number
  retryCooldownDays: number
  unlockHint: string
  joinEventId: EventId
  featureId: FeatureId
  visitorText: string
  joinLine: string
  serviceSummary: string
  visitorSymbol: string
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
  powerRange: { min: number; max: number }
  raidPower: number
  allowedTierMin: number
  allowedTierMax: number
  minimumFame: number
  weight: number
  rewards: EffectDefinition[]
  lootTable?: LootDropDefinition[]
  tags: string[]
}
