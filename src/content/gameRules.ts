import type { ResourceCost } from '../types/content'

export const gameRules = {
  excavation: {
    cost: { material: 10 } satisfies ResourceCost,
  },
  population: {
    baseFoodConsumptionPerPerson: 1,
  },
  invasion: {
    safeDaysAfterInvasion: 2,
  },
} as const
