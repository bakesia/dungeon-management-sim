import type { FacilityInstance } from '../../types/game'

export function getRoomConditionEfficiency(room: FacilityInstance): number {
  return room.condition === 'damaged' ? 0.5 : 1
}
