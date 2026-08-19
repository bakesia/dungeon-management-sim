import type { ResourceDefinition } from '../../types/content'

export const resourceDefinitions: ResourceDefinition[] = [
  { id: 'gold', name: '골드', shortName: 'GOLD', color: '#d4ad58', initialAmount: 100 },
  { id: 'material', name: '자재', shortName: 'MATERIAL', color: '#b58c68', initialAmount: 80 },
  { id: 'food', name: '식량', shortName: 'FOOD', color: '#83a55b', initialAmount: 40 },
  { id: 'mana', name: '마력', shortName: 'MANA', color: '#8d79c6', initialAmount: 30 },
]

export const resourceDefinitionById = Object.fromEntries(
  resourceDefinitions.map((resource) => [resource.id, resource]),
) as Record<string, ResourceDefinition>
