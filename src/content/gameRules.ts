import type { ResourceCost } from '../types/content'
import { RESOURCE_IDS } from './resources/resources'

export const gameRules = {
  excavation: {
    cost: { [RESOURCE_IDS.material]: 10 } satisfies ResourceCost,
  },
  invasion: {
    safeDaysAfterInvasion: 2,
  },
  events: {
    dailyChance: 0.4,
    forcedAfterDays: 3,
  },
} as const
