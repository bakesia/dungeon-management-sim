import type { RaceDefinition } from '../../types/content'

export const raceDefinitions: RaceDefinition[] = [
  {
    id: 'goblin',
    name: '고블린',
    description: '손이 빠르고 다양한 일에 적응하는 소형 마족입니다.',
    foodConsumption: 1,
    productionModifiers: { general: 1 },
    combatModifier: 1,
    traits: ['adaptable'],
    tags: ['demon', 'small'],
  },
  {
    id: 'orc',
    name: '오크',
    description: '생산에는 서툴지만 전투에서 강인한 마족입니다.',
    foodConsumption: 2,
    productionModifiers: { general: 0.8 },
    combatModifier: 1.5,
    traits: ['strong'],
    tags: ['demon', 'large'],
  },
  {
    id: 'imp',
    name: '임프',
    description: '마력의 흐름을 다루는 데 능숙한 소형 마족입니다.',
    foodConsumption: 1,
    productionModifiers: { general: 0.8, mana: 1.5 },
    combatModifier: 0.7,
    traits: ['mana_attuned'],
    tags: ['demon', 'small', 'magical'],
  },
]
