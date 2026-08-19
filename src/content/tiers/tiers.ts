import type { TierDefinition } from '../../types/content'

export const tierDefinitions: TierDefinition[] = [
  { id: 'tier_1', level: 1, name: '폐던전', invasionChance: 0.1, requirements: [] },
  { id: 'tier_2', level: 2, name: '소형 던전', invasionChance: 0.15, requirements: [{ type: 'populationAtLeast', amount: 8 }] },
  { id: 'tier_3', level: 3, name: '중형 던전', invasionChance: 0.2, requirements: [{ type: 'populationAtLeast', amount: 15 }] },
  { id: 'tier_4', level: 4, name: '대형 던전', invasionChance: 0.25, requirements: [{ type: 'populationAtLeast', amount: 30 }] },
  { id: 'tier_5', level: 5, name: '거대 던전', invasionChance: 0.3, requirements: [{ type: 'populationAtLeast', amount: 50 }] },
]

export const tierDefinitionById = Object.fromEntries(
  tierDefinitions.map((tier) => [tier.id, tier]),
) as Record<string, TierDefinition>
