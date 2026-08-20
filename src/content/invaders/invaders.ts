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
      { type: 'addResource', resourceId: 'gold', amount: 14 },
      { type: 'addResource', resourceId: 'mana', amount: 3 },
    ],
    lootTable: [{ itemId: 'loot_broken_blade', chance: 0.45, quantity: { min: 1, max: 1 } }],
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
      { type: 'addResource', resourceId: 'gold', amount: 28 },
      { type: 'addResource', resourceId: 'mana', amount: 6 },
      { type: 'addResource', resourceId: 'material', amount: 5 },
    ],
    lootTable: [{ itemId: 'loot_adventurer_pack', chance: 0.55, quantity: { min: 1, max: 1 } }, { itemId: 'loot_armor_scrap', chance: 0.25, quantity: { min: 1, max: 2 } }],
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
      { type: 'addResource', resourceId: 'gold', amount: 52 },
      { type: 'addResource', resourceId: 'mana', amount: 12 },
      { type: 'addResource', resourceId: 'material', amount: 9 },
    ],
    lootTable: [{ itemId: 'loot_silver_trinket', chance: 0.65, quantity: { min: 1, max: 1 } }, { itemId: 'loot_arcane_fragment', chance: 0.35, quantity: { min: 1, max: 1 } }, { itemId: 'artifact_mana_lens', chance: 0.04, quantity: { min: 1, max: 1 } }],
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
      { type: 'addResource', resourceId: 'gold', amount: 82 },
      { type: 'addResource', resourceId: 'mana', amount: 20 },
      { type: 'addResource', resourceId: 'material', amount: 14 },
    ],
    lootTable: [{ itemId: 'loot_quality_supplies', chance: 0.8, quantity: { min: 1, max: 1 } }, { itemId: 'loot_arcane_fragment', chance: 0.45, quantity: { min: 1, max: 1 } }, { itemId: 'artifact_command_banner', chance: 0.05, quantity: { min: 1, max: 1 } }],
    tags: ['human', 'elite', 'subjugation'],
  },
]

export const invaderDefinitionById = Object.fromEntries(
  invaderDefinitions.map((invader) => [invader.id, invader]),
) as Record<string, InvaderDefinition>
