export const gameRules = {
  core: {
    passiveRegenPerDay: 1,
  },
  excavation: {
    materialCostByDistance: [
      { maxDistance: 3, amount: 10 },
      { maxDistance: 6, amount: 15 },
      { maxDistance: 9, amount: 20 },
      { maxDistance: Number.POSITIVE_INFINITY, amount: 25 },
    ],
    baseActionsPerDay: 2,
    safeExcavations: 3,
  },
  world: {
    generationVersion: 2,
  },
  maintenance: {
    unpaidEfficiencyMultiplier: 0.75,
  },
  invasion: {
    safeDaysAfterInvasion: 1,
    fame: {
      chanceScale: 70,
      maximumChanceBonus: 0.24,
      victoryGain: 5,
      defeatLoss: 4,
    },
    pity: {
      pressurePerEligibleDay: 0.05,
      maximumPressureBonus: 0.25,
      forceAfterDays: 6,
    },
    damage: {
      goldRatio: 0.4,
      materialRatio: 0.28,
      foodRatio: 0.2,
      coreHpRatio: 0.45,
      populationLossChancePerRaidPower: 0.007,
      maximumPopulationLossChance: 0.4,
      secondaryDamageChance: 0.4,
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
    precursorVisitChanceBonus: 0.2,
    shopRefreshDays: 4,
    tavernRefreshDays: 5,
    recruitmentRefreshDays: 4,
    blacksmithRepairDiscount: 0.85,
  },
} as const
