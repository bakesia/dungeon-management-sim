import type { TierDefinition } from '../../types/content'

export const tierDefinitions: TierDefinition[] = [
  { id: 'tier_1', level: 1, name: '폐던전', invasionChance: 0.1, requirements: [], promotionRewards: [] },
  {
    id: 'tier_2', level: 2, name: '소형 던전', invasionChance: 0.15,
    requirements: [
      { type: 'roomCountAtLeast', amount: 6 },
      { type: 'populationAtLeast', amount: 8 },
      { type: 'defenseWinsAtLeast', amount: 1 },
    ],
    promotionRewards: [
      { type: 'addResource', resourceId: 'gold', amount: 30 },
      { type: 'addResource', resourceId: 'material', amount: 20 },
    ],
  },
  {
    id: 'tier_3', level: 3, name: '중형 던전', invasionChance: 0.2,
    requirements: [
      { type: 'roomCountAtLeast', amount: 12 },
      { type: 'populationAtLeast', amount: 15 },
      { type: 'roomLevelCountAtLeast', minLevel: 2, amount: 3 },
      { type: 'defenseWinsAtLeast', amount: 3 },
    ],
    promotionRewards: [
      { type: 'addResource', resourceId: 'gold', amount: 50 },
      { type: 'addResource', resourceId: 'material', amount: 30 },
      { type: 'addResource', resourceId: 'mana', amount: 15 },
    ],
  },
  {
    id: 'tier_4', level: 4, name: '대형 던전', invasionChance: 0.25,
    requirements: [
      { type: 'roomCountAtLeast', amount: 20 },
      { type: 'populationAtLeast', amount: 30 },
      { type: 'roomLevelCountAtLeast', minLevel: 3, amount: 4 },
      { type: 'defenseWinsAtLeast', amount: 7 },
      { type: 'resourceAtLeast', resourceId: 'gold', amount: 250 },
    ],
    promotionRewards: [
      { type: 'addResource', resourceId: 'gold', amount: 80 },
      { type: 'addResource', resourceId: 'material', amount: 40 },
      { type: 'addResource', resourceId: 'mana', amount: 30 },
    ],
  },
  {
    id: 'tier_5', level: 5, name: '거대 던전', invasionChance: 0.3,
    requirements: [
      { type: 'roomCountAtLeast', amount: 30 },
      { type: 'populationAtLeast', amount: 50 },
      { type: 'roomLevelCountAtLeast', minLevel: 3, amount: 8 },
      { type: 'defenseWinsAtLeast', amount: 12 },
      { type: 'resourceAtLeast', resourceId: 'gold', amount: 500 },
      { type: 'resourceAtLeast', resourceId: 'mana', amount: 300 },
    ],
    promotionRewards: [
      { type: 'addResource', resourceId: 'gold', amount: 120 },
      { type: 'addResource', resourceId: 'material', amount: 60 },
      { type: 'addResource', resourceId: 'mana', amount: 50 },
    ],
  },
]

export const tierDefinitionById = Object.fromEntries(
  tierDefinitions.map((tier) => [tier.id, tier]),
) as Record<string, TierDefinition>
