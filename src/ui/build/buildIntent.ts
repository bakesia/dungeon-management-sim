export interface BuildIntent {
  facilityId: string | null
  targetTileId: string | null
}

export const emptyBuildIntent: BuildIntent = { facilityId: null, targetTileId: null }

export function selectBuildFacility(intent: BuildIntent, facilityId: string): BuildIntent {
  return { ...intent, facilityId }
}

export function selectBuildTarget(intent: BuildIntent, targetTileId: string): BuildIntent {
  return { ...intent, targetTileId }
}

export function getReadyBuild(intent: BuildIntent): { facilityId: string; targetTileId: string } | null {
  return intent.facilityId && intent.targetTileId
    ? { facilityId: intent.facilityId, targetTileId: intent.targetTileId }
    : null
}
