import type { ResourceCost } from '../types/content'
import { RESOURCE_IDS } from './resources/resources'

export const gameRules = {
  core: {
    passiveRegenPerDay: 1,
  },
  excavation: {
    cost: { [RESOURCE_IDS.material]: 10 } satisfies ResourceCost,
  },
  maintenance: {
    goldByLevel: [0, 1, 2, 3],
    unpaidEfficiencyMultiplier: 0.75,
  },
  invasion: {
    safeDaysAfterInvasion: 2,
    threat: {
      maximum: 100,
      resetAfterInvasion: 15,
      baseDailyGain: 12,
      tierGain: 2,
      populationStep: 10,
      randomChanceAtMaximum: 0.35,
    },
    damage: {
      goldRatio: 0.5,
      materialRatio: 0.35,
      foodRatio: 0.25,
      coreHpRatio: 0.75,
      populationLossChancePerRaidPower: 0.01,
      maximumPopulationLossChance: 0.6,
      facilityDamageChance: 0.35,
    },
  },
  events: {
    dailyChance: 0.4,
    maximumBlankDays: 1,
    defaultCooldownDays: 8,
    recentHistorySize: 5,
    historyLimit: 30,
    categoryRepeatMultiplier: 0.35,
    chainWeightMultiplier: 2,
    npcJoinWeightMultiplier: 2.5,
  },
  npcs: {
    visitorChance: 0.35,
    shopRefreshDays: 4,
    tavernRefreshDays: 5,
    blacksmithRepairDiscount: 0.85,
  },
} as const
