import type { InvaderDefinition } from '../../types/content'

export const invaderDefinitions: InvaderDefinition[] = [
  {
    id: 'invader_wandering_adventurer',
    name: '떠돌이 모험가',
    combatPower: 8,
    raidPower: 8,
    allowedTierMin: 1,
    allowedTierMax: 2,
    rewards: [
      { type: 'addResource', resourceId: 'gold', amount: 18 },
      { type: 'addResource', resourceId: 'mana', amount: 4 },
    ],
    tags: ['human', 'solo', 'beginner'],
  },
  {
    id: 'invader_beginner_party',
    name: '초급 모험가 파티',
    combatPower: 22,
    raidPower: 18,
    allowedTierMin: 1,
    allowedTierMax: 3,
    rewards: [
      { type: 'addResource', resourceId: 'gold', amount: 35 },
      { type: 'addResource', resourceId: 'mana', amount: 8 },
    ],
    tags: ['human', 'party'],
  },
  {
    id: 'invader_veteran_party',
    name: '숙련 모험가 파티',
    combatPower: 50,
    raidPower: 32,
    allowedTierMin: 2,
    allowedTierMax: 4,
    rewards: [
      { type: 'addResource', resourceId: 'gold', amount: 55 },
      { type: 'addResource', resourceId: 'mana', amount: 14 },
    ],
    tags: ['human', 'party', 'veteran'],
  },
  {
    id: 'invader_elite_subjugation',
    name: '정예 토벌대',
    combatPower: 95,
    raidPower: 50,
    allowedTierMin: 3,
    allowedTierMax: 5,
    rewards: [
      { type: 'addResource', resourceId: 'gold', amount: 80 },
      { type: 'addResource', resourceId: 'mana', amount: 24 },
    ],
    tags: ['human', 'elite', 'subjugation'],
  },
]

export const invaderDefinitionById = Object.fromEntries(
  invaderDefinitions.map((invader) => [invader.id, invader]),
) as Record<string, InvaderDefinition>
