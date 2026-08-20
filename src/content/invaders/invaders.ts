import type { InvaderDefinition } from '../../types/content'

export const invaderDefinitions: InvaderDefinition[] = [
  {
    id: 'invader_wandering_adventurer',
    name: '떠돌이 모험가',
    powerRange: { min: 7, max: 11 },
    raidPower: 8,
    allowedTierMin: 1,
    allowedTierMax: 2,
    minimumFame: 0,
    weight: 12,
    rewards: [
      { type: 'addResource', resourceId: 'gold', amount: 18 },
      { type: 'addResource', resourceId: 'mana', amount: 3 },
    ],
    tags: ['human', 'solo', 'beginner'],
  },
  {
    id: 'invader_beginner_party',
    name: '초급 모험가 파티',
    powerRange: { min: 18, max: 26 },
    raidPower: 18,
    allowedTierMin: 1,
    allowedTierMax: 5,
    minimumFame: 5,
    weight: 10,
    rewards: [
      { type: 'addResource', resourceId: 'gold', amount: 35 },
      { type: 'addResource', resourceId: 'mana', amount: 6 },
      { type: 'addResource', resourceId: 'material', amount: 5 },
    ],
    tags: ['human', 'party'],
  },
  {
    id: 'invader_veteran_party',
    name: '숙련 모험가 파티',
    powerRange: { min: 42, max: 58 },
    raidPower: 32,
    allowedTierMin: 2,
    allowedTierMax: 5,
    minimumFame: 28,
    weight: 7,
    rewards: [
      { type: 'addResource', resourceId: 'gold', amount: 65 },
      { type: 'addResource', resourceId: 'mana', amount: 12 },
      { type: 'addResource', resourceId: 'material', amount: 9 },
    ],
    tags: ['human', 'party', 'veteran'],
  },
  {
    id: 'invader_elite_subjugation',
    name: '정예 토벌대',
    powerRange: { min: 82, max: 104 },
    raidPower: 50,
    allowedTierMin: 3,
    allowedTierMax: 5,
    minimumFame: 65,
    weight: 5,
    rewards: [
      { type: 'addResource', resourceId: 'gold', amount: 105 },
      { type: 'addResource', resourceId: 'mana', amount: 20 },
      { type: 'addResource', resourceId: 'material', amount: 14 },
    ],
    tags: ['human', 'elite', 'subjugation'],
  },
]

export const invaderDefinitionById = Object.fromEntries(
  invaderDefinitions.map((invader) => [invader.id, invader]),
) as Record<string, InvaderDefinition>
