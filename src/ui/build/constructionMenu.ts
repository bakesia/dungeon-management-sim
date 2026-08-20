import { facilityDefinitions } from '../../content/facilities/facilities'
import type { FacilityDefinition } from '../../types/content'

export interface ConstructionMenuGroups {
  available: FacilityDefinition[]
  locked: FacilityDefinition[]
}

export function getConstructionMenuGroups(currentTierLevel: number): ConstructionMenuGroups {
  const buildable = facilityDefinitions.filter((facility) => facility.buildable)
  return {
    available: buildable.filter((facility) => facility.requiredTier <= currentTierLevel),
    locked: buildable.filter((facility) => facility.requiredTier > currentTierLevel)
      .sort((a, b) => a.requiredTier - b.requiredTier || buildable.indexOf(a) - buildable.indexOf(b)),
  }
}
