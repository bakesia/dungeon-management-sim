import { facilityDefinitionById } from '../../content/facilities/facilities'
import { resourceDefinitionById, resourceDefinitions } from '../../content/resources/resources'
import type { EffectDefinition, ResourceId } from '../../types/content'
import type { GameState } from '../../types/game'

export interface ResourceChangePreview {
  resourceId: ResourceId
  current: number
  capacity: number
  requested: number
  applied: number
  overflow: number
  next: number
}

export function getResourceCapacity(state: GameState, resourceId: ResourceId): number {
  const definition = resourceDefinitionById[resourceId]
  if (!definition) throw new Error(`Unknown resourceId "${resourceId}" requested from resource capacity.`)

  return Object.values(state.dungeon.rooms).reduce((capacity, room) => {
    const level = facilityDefinitionById[room.definitionId]?.levels.find((item) => item.level === room.level)
    return capacity + (level?.storageCapacity?.[resourceId] ?? 0)
  }, definition.baseCapacity)
}

export function getResourceCapacities(state: GameState): Record<ResourceId, number> {
  return Object.fromEntries(
    resourceDefinitions.map((resource) => [resource.id, getResourceCapacity(state, resource.id)]),
  )
}

export function previewResourceChange(state: GameState, resourceId: ResourceId, requested: number): ResourceChangePreview {
  const current = state.resources[resourceId]
  if (current === undefined) throw new Error(`Unknown resourceId "${resourceId}" referenced by resource change.`)
  const capacity = getResourceCapacity(state, resourceId)
  if (requested <= 0) {
    const applied = -Math.min(current, Math.abs(requested))
    return { resourceId, current, capacity, requested, applied, overflow: 0, next: current + applied }
  }

  const applied = Math.min(requested, Math.max(0, capacity - current))
  return { resourceId, current, capacity, requested, applied, overflow: requested - applied, next: current + applied }
}

export function isResourceOverCapacity(state: GameState, resourceId: ResourceId): boolean {
  return (state.resources[resourceId] ?? 0) > getResourceCapacity(state, resourceId)
}

export function getPositiveResourceEffectPreviews(state: GameState, effects: EffectDefinition[]): ResourceChangePreview[] {
  return effects.flatMap((effect) => effect.type === 'addResource' && effect.amount > 0
    ? [previewResourceChange(state, effect.resourceId, effect.amount)]
    : [])
}

export function canStoreAnyPositiveResourceEffect(state: GameState, effects: EffectDefinition[]): boolean {
  const previews = getPositiveResourceEffectPreviews(state, effects)
  return previews.length === 0 || previews.some((preview) => preview.applied > 0)
}
