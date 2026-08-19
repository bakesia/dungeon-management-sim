import type { ResourceDefinition } from '../../types/content'

export const RESOURCE_IDS = {
  gold: 'gold',
  material: 'material',
  food: 'food',
  mana: 'mana',
} as const

export const resourceDefinitions: ResourceDefinition[] = [
  { id: RESOURCE_IDS.gold, name: '골드', shortName: 'GOLD', color: '#d4ad58', initialAmount: 100 },
  { id: RESOURCE_IDS.material, name: '자재', shortName: 'MATERIAL', color: '#b58c68', initialAmount: 80 },
  { id: RESOURCE_IDS.food, name: '식량', shortName: 'FOOD', color: '#83a55b', initialAmount: 40 },
  { id: RESOURCE_IDS.mana, name: '마력', shortName: 'MANA', color: '#8d79c6', initialAmount: 30 },
]

export const resourceDefinitionById = Object.fromEntries(
  resourceDefinitions.map((resource) => [resource.id, resource]),
) as Record<string, ResourceDefinition>
