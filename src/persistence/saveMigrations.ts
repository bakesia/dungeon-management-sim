import { SAVE_VERSION } from '../app/version'
import { createInitialGameState } from '../engine/game/createInitialGameState'
import type { EffectDefinition, GameLogCategory, LogPresentation, RaceId } from '../types/content'
import type { DungeonTile, FacilityInstance, GameLogEntry, GameState, InvasionResolution, PopulationAssignment, PopulationGroup } from '../types/game'
import { REMOVED_FACILITY_IDS } from '../content/facilities/facilities'
import { tierDefinitionById } from '../content/tiers/tiers'
import { invaderDefinitionById } from '../content/invaders/invaders'
import { gameRules } from '../content/gameRules'

type UnknownRecord = Record<string, unknown>
const isRecord = (value: unknown): value is UnknownRecord => typeof value === 'object' && value !== null && !Array.isArray(value)

function normalizeFlags(value: unknown): Record<string, boolean> {
  if (Array.isArray(value)) return Object.fromEntries(value.filter((flag): flag is string => typeof flag === 'string').map((flag) => [flag, true]))
  if (!isRecord(value)) return {}
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean'))
}

function normalizeNumberRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {}
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, number] => typeof entry[1] === 'number'))
}

function normalizeLogCategory(entry: UnknownRecord): GameLogCategory {
  const valid: GameLogCategory[] = ['system', 'resource', 'event', 'invasion', 'warning', 'progression']
  if (typeof entry.category === 'string' && valid.includes(entry.category as GameLogCategory)) return entry.category as GameLogCategory
  if (entry.tone === 'warning' || entry.tone === 'danger') return 'warning'
  if (entry.tone === 'positive') return 'resource'
  return 'system'
}

function normalizeLogs(value: unknown, day: number): GameLogEntry[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item, index) => !isRecord(item) || typeof item.message !== 'string' ? [] : [{
    id: typeof item.id === 'string' ? item.id : `migrated-log-${index}`,
    day: typeof item.day === 'number' ? item.day : day,
    message: item.message,
    category: normalizeLogCategory(item),
    presentation: item.presentation === 'typewriter' ? 'typewriter' as LogPresentation : 'instant' as LogPresentation,
    sound: typeof item.sound === 'string' ? item.sound as GameLogEntry['sound'] : undefined,
    presentationGroupId: typeof item.presentationGroupId === 'string' ? item.presentationGroupId : undefined,
    presentationSequence: typeof item.presentationSequence === 'number' ? item.presentationSequence : undefined,
    presentationPriority: typeof item.presentationPriority === 'number' ? item.presentationPriority : undefined,
  }])
}

function normalizePopulation(value: unknown): PopulationGroup[] {
  if (!Array.isArray(value)) return []
  const totals = new Map<RaceId, number>()
  value.forEach((item) => {
    if (!isRecord(item) || typeof item.raceId !== 'string' || typeof item.count !== 'number') return
    totals.set(item.raceId, (totals.get(item.raceId) ?? 0) + Math.max(0, Math.floor(item.count)))
  })
  return [...totals].filter(([, count]) => count > 0).map(([raceId, count]) => ({ id: `population-${raceId}`, raceId, count }))
}

function createAssignmentNormalizer(rawPopulation: unknown, population: PopulationGroup[]) {
  const legacyGroups = Array.isArray(rawPopulation) ? rawPopulation.filter(isRecord) : []
  const assignedTotals = new Map<RaceId, number>()
  const capacity = new Map(population.map((group) => [group.raceId, group.count]))
  const clamp = (assignments: PopulationAssignment[]) => assignments.flatMap((assignment) => {
    const remaining = Math.max(0, (capacity.get(assignment.raceId) ?? 0) - (assignedTotals.get(assignment.raceId) ?? 0))
    const count = Math.min(remaining, Math.max(0, Math.floor(assignment.count)))
    if (count <= 0) return []
    assignedTotals.set(assignment.raceId, (assignedTotals.get(assignment.raceId) ?? 0) + count)
    return [{ raceId: assignment.raceId, count }]
  })
  return (room: UnknownRecord): PopulationAssignment[] => {
    const array = Array.isArray(room.residentAssignments) ? room.residentAssignments : Array.isArray(room.workerAssignments) ? room.workerAssignments : null
    if (array) {
      const merged = new Map<RaceId, number>()
      array.forEach((item) => { if (isRecord(item) && typeof item.raceId === 'string' && typeof item.count === 'number') merged.set(item.raceId, (merged.get(item.raceId) ?? 0) + item.count) })
      return clamp([...merged].map(([raceId, count]) => ({ raceId, count })))
    }
    if (!isRecord(room.assignedWorkers)) return []
    const requestedByJob = new Map(Object.entries(room.assignedWorkers).flatMap(([jobId, count]) => typeof count === 'number' ? [[jobId, count] as const] : []))
    const proposed: PopulationAssignment[] = []
    requestedByJob.forEach((requested, jobId) => {
      let remaining = requested
      legacyGroups.filter((group) => group.jobId === jobId && typeof group.raceId === 'string').forEach((group) => {
        if (remaining <= 0 || typeof group.count !== 'number') return
        const count = Math.min(remaining, group.count)
        proposed.push({ raceId: group.raceId as RaceId, count })
        remaining -= count
      })
    })
    const merged = new Map<RaceId, number>()
    proposed.forEach((item) => merged.set(item.raceId, (merged.get(item.raceId) ?? 0) + item.count))
    return clamp([...merged].map(([raceId, count]) => ({ raceId, count })))
  }
}

function normalizeRoom(instanceId: string, raw: UnknownRecord, normalizeAssignments: (room: UnknownRecord) => PopulationAssignment[], fallbackTileId = ''): FacilityInstance {
  return {
    instanceId: typeof raw.instanceId === 'string' ? raw.instanceId : instanceId,
    definitionId: typeof raw.definitionId === 'string' ? raw.definitionId : '',
    level: typeof raw.level === 'number' ? raw.level : 1,
    residentAssignments: normalizeAssignments(raw),
    durability: typeof raw.durability === 'number' ? raw.durability : 100,
    condition: raw.condition === 'damaged' ? 'damaged' : 'normal',
    tileId: typeof raw.tileId === 'string' ? raw.tileId : fallbackTileId,
  }
}

function normalizeDungeon(value: UnknownRecord, saveVersion: number, rawPopulation: unknown, population: PopulationGroup[]): GameState['dungeon'] {
  if (!isRecord(value.tiles)) throw new Error('Invalid save: dungeon tiles are malformed.')
  const normalizeAssignments = createAssignmentNormalizer(rawPopulation, population)
  if (saveVersion >= 2) {
    if (!isRecord(value.rooms)) throw new Error('Invalid save: dungeon rooms are malformed.')
    const rooms = Object.fromEntries(Object.entries(value.rooms).map(([id, raw]) => {
      if (!isRecord(raw)) throw new Error(`Invalid save: dungeon room "${id}" is malformed.`)
      return [id, normalizeRoom(id, raw, normalizeAssignments)]
    }))
    return { tiles: value.tiles as unknown as GameState['dungeon']['tiles'], rooms }
  }
  const tiles: Record<string, DungeonTile> = {}
  const rooms: Record<string, FacilityInstance> = {}
  Object.entries(value.tiles).forEach(([id, raw]) => {
    if (!isRecord(raw) || !isRecord(raw.coordinate) || typeof raw.status !== 'string') throw new Error(`Invalid save: dungeon tile "${id}" is malformed.`)
    const facility = isRecord(raw.facility) ? raw.facility : null
    const instanceId = facility && typeof facility.instanceId === 'string' ? facility.instanceId : undefined
    tiles[id] = { id, coordinate: raw.coordinate as unknown as DungeonTile['coordinate'], status: raw.status as DungeonTile['status'], facilityInstanceId: instanceId }
    if (facility && instanceId) rooms[instanceId] = normalizeRoom(instanceId, facility, normalizeAssignments, id)
  })
  return { tiles, rooms }
}

function removeDeprecatedFacilities(dungeon: GameState['dungeon']): GameState['dungeon'] {
  const removedIds = new Set<string>(REMOVED_FACILITY_IDS)
  const removedInstanceIds = new Set(Object.values(dungeon.rooms)
    .filter((room) => removedIds.has(room.definitionId))
    .map((room) => room.instanceId))
  if (removedInstanceIds.size === 0) return dungeon

  const rooms = Object.fromEntries(Object.entries(dungeon.rooms).filter(([, room]) => !removedInstanceIds.has(room.instanceId)))
  const tiles = Object.fromEntries(Object.entries(dungeon.tiles).map(([id, tile]) => [id,
    tile.facilityInstanceId && removedInstanceIds.has(tile.facilityInstanceId)
      ? { ...tile, status: 'empty' as const, facilityInstanceId: undefined }
      : tile,
  ]))
  return { rooms, tiles }
}

export function migrateSaveData(value: unknown): GameState {
  if (!isRecord(value) || typeof value.saveVersion !== 'number') throw new Error('Invalid save: missing numeric saveVersion.')
  if (![1, 2, 3, 4, 5, 6, 7, SAVE_VERSION].includes(value.saveVersion)) throw new Error(`Unsupported saveVersion ${value.saveVersion}; expected 1 through ${SAVE_VERSION}.`)
  if (typeof value.day !== 'number' || !Array.isArray(value.population) || !isRecord(value.dungeon)) throw new Error('Invalid save: day, population, or dungeon state is malformed.')
  const fallback = createInitialGameState()
  const population = normalizePopulation(value.population)
  const core = isRecord(value.core) ? value.core : {}
  const events = isRecord(value.events) ? value.events : {}
  const invasion = isRecord(value.invasion) ? value.invasion : {}
  const statistics = isRecord(value.statistics) ? value.statistics : {}
  const populationJoin = isRecord(value.populationJoin) ? value.populationJoin : {}
  const pendingPopulationJoin = isRecord(populationJoin.pending) ? populationJoin.pending : null
  const maintenance = isRecord(value.maintenance) ? value.maintenance : {}
  const metadata = isRecord(value.metadata) ? value.metadata : {}
  const intel = isRecord(invasion.intel) ? invasion.intel : {}
  const dungeon = removeDeprecatedFacilities(normalizeDungeon(value.dungeon, value.saveVersion, value.population, population))
  const currentTierId = typeof value.currentTierId === 'string' ? value.currentTierId : fallback.currentTierId
  const totalWins = typeof invasion.totalWins === 'number' ? invasion.totalWins : 0
  const totalLosses = typeof invasion.totalLosses === 'number' ? invasion.totalLosses : 0
  const tierLevel = tierDefinitionById[currentTierId]?.level ?? 1
  const migratedFame = Math.max(0, (tierLevel - 1) * 14 + totalWins * 3 - totalLosses * 2 + Math.floor(Math.min(value.day, 40) / 8))
  const rawPendingResolution = isRecord(invasion.pendingResolution) ? invasion.pendingResolution : null
  const pendingInvader = rawPendingResolution && typeof rawPendingResolution.invaderId === 'string' ? invaderDefinitionById[rawPendingResolution.invaderId] : undefined
  return {
    ...fallback,
    saveVersion: SAVE_VERSION,
    day: value.day,
    resources: { ...fallback.resources, ...normalizeNumberRecord(value.resources) },
    population,
    currentTierId,
    core: { hp: typeof core.hp === 'number' ? core.hp : fallback.core.hp, maxHp: typeof core.maxHp === 'number' ? core.maxHp : fallback.core.maxHp },
    dungeon,
    flags: normalizeFlags(value.flags),
    logs: normalizeLogs(value.logs, value.day),
    events: {
      currentEventId: typeof events.currentEventId === 'string' ? events.currentEventId : null,
      pendingEventIds: Array.isArray(events.pendingEventIds) ? events.pendingEventIds.filter((id): id is string => typeof id === 'string') : [],
      completedEventIds: Array.isArray(events.completedEventIds) ? events.completedEventIds.filter((id): id is string => typeof id === 'string') : [],
      daysSinceLastEvent: typeof events.daysSinceLastEvent === 'number' ? events.daysSinceLastEvent : 0,
      daysSinceDailyEvent: typeof events.daysSinceDailyEvent === 'number' ? events.daysSinceDailyEvent : (typeof events.daysSinceLastEvent === 'number' ? events.daysSinceLastEvent : 0),
      history: Array.isArray(events.history) ? events.history.flatMap((entry) => isRecord(entry) && typeof entry.eventId === 'string' && typeof entry.day === 'number' ? [{ eventId: entry.eventId, day: entry.day }] : []) : [],
    },
    invasion: {
      ...fallback.invasion,
      daysSinceLastInvasion: typeof invasion.daysSinceLastInvasion === 'number' ? invasion.daysSinceLastInvasion : 0,
      totalDefenses: typeof invasion.totalDefenses === 'number' ? invasion.totalDefenses : 0,
      totalWins,
      totalLosses,
      lastEncounter: isRecord(invasion.lastEncounter) && typeof invasion.lastEncounter.sequence === 'number' && typeof invasion.lastEncounter.invaderId === 'string' && (invasion.lastEncounter.result === 'win' || invasion.lastEncounter.result === 'loss') ? invasion.lastEncounter as unknown as GameState['invasion']['lastEncounter'] : null,
      fame: typeof invasion.fame === 'number' ? Math.max(0, invasion.fame) : migratedFame,
      raidPressure: typeof invasion.raidPressure === 'number'
        ? Math.max(0, invasion.raidPressure)
        : Math.min(gameRules.invasion.pity.maximumPressureBonus, (typeof invasion.daysSinceLastInvasion === 'number' ? invasion.daysSinceLastInvasion : 0) * gameRules.invasion.pity.pressurePerEligibleDay),
      intel: { powerRange: intel.powerRange === true, invaderCategory: intel.invaderCategory === true, arrivalEstimate: intel.arrivalEstimate === true },
      pendingResolution: rawPendingResolution
        && typeof rawPendingResolution.id === 'string'
        && typeof rawPendingResolution.invaderId === 'string'
        && typeof rawPendingResolution.success === 'boolean'
        && typeof rawPendingResolution.raidPower === 'number'
        && typeof rawPendingResolution.defensePower === 'number'
        && Array.isArray(rawPendingResolution.effects)
          ? {
              id: rawPendingResolution.id,
              invaderId: rawPendingResolution.invaderId,
              raidPower: rawPendingResolution.raidPower,
              actualCombatPower: typeof rawPendingResolution.actualCombatPower === 'number'
                ? rawPendingResolution.actualCombatPower
                : Math.round(((pendingInvader?.powerRange.min ?? rawPendingResolution.raidPower) + (pendingInvader?.powerRange.max ?? rawPendingResolution.raidPower)) / 2),
              startedOnDay: typeof rawPendingResolution.startedOnDay === 'number' ? rawPendingResolution.startedOnDay : Math.max(1, value.day - 1),
              defensePower: rawPendingResolution.defensePower,
              success: rawPendingResolution.success,
              contributions: Array.isArray(rawPendingResolution.contributions) ? rawPendingResolution.contributions as InvasionResolution['contributions'] : [],
              effects: rawPendingResolution.effects as EffectDefinition[],
            }
          : null,
    },
    populationJoin: {
      pending: pendingPopulationJoin && typeof pendingPopulationJoin.raceId === 'string' && typeof pendingPopulationJoin.amount === 'number'
        ? { raceId: pendingPopulationJoin.raceId, amount: pendingPopulationJoin.amount }
        : null,
    },
    maintenance: {
      requiredGold: typeof maintenance.requiredGold === 'number' ? maintenance.requiredGold : 0,
      paidGold: typeof maintenance.paidGold === 'number' ? maintenance.paidGold : 0,
      shortfall: typeof maintenance.shortfall === 'number' ? maintenance.shortfall : 0,
      efficiencyMultiplier: typeof maintenance.efficiencyMultiplier === 'number' ? maintenance.efficiencyMultiplier : 1,
    },
    npcs: isRecord(value.npcs) ? value.npcs as unknown as GameState['npcs'] : {},
    shop: isRecord(value.shop) && Array.isArray(value.shop.offerings) ? value.shop as unknown as GameState['shop'] : fallback.shop,
    tavern: isRecord(value.tavern) && Array.isArray(value.tavern.offers) ? {
      lastRefreshDay: typeof value.tavern.lastRefreshDay === 'number' ? value.tavern.lastRefreshDay : value.day,
      lastRecruitmentRefreshDay: typeof value.tavern.lastRecruitmentRefreshDay === 'number' ? value.tavern.lastRecruitmentRefreshDay : value.day,
      offers: value.tavern.offers.filter((id): id is string => typeof id === 'string'),
      recruitmentOffers: Array.isArray(value.tavern.recruitmentOffers)
        ? value.tavern.recruitmentOffers.flatMap((entry) => isRecord(entry) && typeof entry.offerId === 'string' && typeof entry.remaining === 'number' ? [{ offerId: entry.offerId, remaining: Math.max(0, Math.floor(entry.remaining)) }] : [])
        : fallback.tavern.recruitmentOffers,
    } : fallback.tavern,
    activeMercenaries: Array.isArray(value.activeMercenaries) ? value.activeMercenaries as GameState['activeMercenaries'] : [],
    timedModifiers: Array.isArray(value.timedModifiers) ? value.timedModifiers as GameState['timedModifiers'] : [],
    statistics: { successfulDefenses: typeof statistics.successfulDefenses === 'number' ? statistics.successfulDefenses : 0, totalDaysPlayed: typeof statistics.totalDaysPlayed === 'number' ? statistics.totalDaysPlayed : 0 },
    status: value.status === 'gameOver' || value.status === 'clear' ? value.status : 'playing',
    metadata: { createdAt: typeof metadata.createdAt === 'string' ? metadata.createdAt : fallback.metadata.createdAt, updatedAt: typeof metadata.updatedAt === 'string' ? metadata.updatedAt : fallback.metadata.updatedAt },
  }
}
