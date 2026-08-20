import { facilityDefinitionById, facilityDefinitions } from '../../content/facilities/facilities'
import type { FacilityInstance, GameState } from '../../types/game'

function getInstanceSequence(instanceId: string): number | null {
  const match = /-(\d+)$/.exec(instanceId)
  return match ? Number(match[1]) : null
}

function compareSameTypeRooms(first: FacilityInstance, second: FacilityInstance): number {
  const firstSequence = getInstanceSequence(first.instanceId)
  const secondSequence = getInstanceSequence(second.instanceId)
  if (firstSequence !== null && secondSequence !== null && firstSequence !== secondSequence) {
    return firstSequence - secondSequence
  }
  if (firstSequence !== null && secondSequence === null) return -1
  if (firstSequence === null && secondSequence !== null) return 1
  return first.instanceId.localeCompare(second.instanceId)
}

export function compareRoomsForDisplay(first: FacilityInstance, second: FacilityInstance): number {
  const firstDefinitionIndex = facilityDefinitions.findIndex((definition) => definition.id === first.definitionId)
  const secondDefinitionIndex = facilityDefinitions.findIndex((definition) => definition.id === second.definitionId)
  if (firstDefinitionIndex !== secondDefinitionIndex) return firstDefinitionIndex - secondDefinitionIndex
  return compareSameTypeRooms(first, second)
}

export function getRoomDisplayIndex(state: GameState, room: FacilityInstance): number {
  return Object.values(state.dungeon.rooms)
    .filter((candidate) => candidate.definitionId === room.definitionId)
    .sort(compareSameTypeRooms)
    .findIndex((candidate) => candidate.instanceId === room.instanceId) + 1
}

export function getRoomDisplayName(state: GameState, room: FacilityInstance): string {
  const definition = facilityDefinitionById[room.definitionId]
  if (!definition) return room.definitionId
  if (!definition.buildable) return definition.name
  return `${definition.name} ${getRoomDisplayIndex(state, room)}`
}
