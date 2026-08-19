import type { ResourceCost } from '../types/content'
import { RESOURCE_IDS } from './resources/resources'

export const gameRules = {
  excavation: {
    cost: { [RESOURCE_IDS.material]: 10 } satisfies ResourceCost,
  },
  invasion: {
    safeDaysAfterInvasion: 2,
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
    forcedAfterDays: 3,
  },
} as const
