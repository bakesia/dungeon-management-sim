import type { RaceDefinition } from '../../types/content'

export const raceDefinitions: RaceDefinition[] = [
  {
    id: 'goblin',
    name: '고블린',
    description: '손이 빠르고 다양한 일에 적응하는 소형 마족입니다.',
    foodConsumption: 1,
    iconId: 'race_goblin',
    modifiers: [
      { type: 'roomEfficiencyMultiplier', targetTag: 'labor', value: 1.1 },
      { type: 'combatMultiplier', value: 0.95 },
    ],
    traits: ['adaptable'],
    tags: ['demon', 'small'],
  },
  {
    id: 'orc',
    name: '오크',
    description: '생산에는 서툴지만 전투에서 강인한 마족입니다.',
    foodConsumption: 2,
    iconId: 'race_orc',
    modifiers: [
      { type: 'roomEfficiencyMultiplier', targetTag: 'labor', value: 0.9 },
      { type: 'combatMultiplier', value: 1.25 },
    ],
    traits: ['strong'],
    tags: ['demon', 'large'],
  },
  {
    id: 'imp',
    name: '임프',
    description: '마력의 흐름을 다루는 데 능숙한 소형 마족입니다.',
    foodConsumption: 1,
    iconId: 'race_imp',
    modifiers: [
      { type: 'roomEfficiencyMultiplier', targetTag: 'mana', value: 1.3 },
      { type: 'combatMultiplier', value: 0.85 },
    ],
    traits: ['mana_attuned'],
    tags: ['demon', 'small', 'magical'],
  },
]

export const raceDefinitionById = Object.fromEntries(
  raceDefinitions.map((race) => [race.id, race]),
) as Record<string, RaceDefinition>
