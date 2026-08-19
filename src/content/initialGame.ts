import type { FacilityId, RaceId } from '../types/content'

export interface InitialPopulationGroupDefinition {
  id: string
  raceId: RaceId
  count: number
}

export interface InitialFacilityPlacement {
  instanceId: string
  definitionId: FacilityId
  x: number
  y: number
}

export const initialPopulationGroups: InitialPopulationGroupDefinition[] = [
  { id: 'population-goblin', raceId: 'goblin', count: 5 },
]

export const initialFacilityPlacements: InitialFacilityPlacement[] = [
  { instanceId: 'facility-core-1', definitionId: 'dungeon_core', x: 0, y: 0 },
  { instanceId: 'facility-mine-1', definitionId: 'mine', x: -1, y: 0 },
  { instanceId: 'facility-quarters-1', definitionId: 'quarters', x: 1, y: 0 },
]

export const initialEmptyTileCoordinates = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
]
