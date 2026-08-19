import { facilityDefinitionById } from '../../content/facilities/facilities'
import { raceDefinitionById } from '../../content/races/races'
import type { RaceId } from '../../types/content'
import type { FacilityInstance, GameState, PopulationAssignment } from '../../types/game'
import type { ActionCheck } from '../../types/engine'
import { applyEffect } from '../effects/applyEffects'

export function getPopulationByRace(state: GameState, raceId: RaceId): number {
  return state.population.filter((group) => group.raceId === raceId).reduce((total, group) => total + group.count, 0)
}
export function getRoomAssignmentCount(room: FacilityInstance, raceId?: RaceId): number {
  return room.residentAssignments
    .filter((assignment) => !raceId || assignment.raceId === raceId)
    .reduce((total, assignment) => total + assignment.count, 0)
}

export function getAssignedResidentsByRace(state: GameState, raceId: RaceId): number {
  return Object.values(state.dungeon.rooms).reduce((total, room) => total + getRoomAssignmentCount(room, raceId), 0)
}

export function getAssignedResidents(state: GameState): number {
  return Object.values(state.dungeon.rooms).reduce((total, room) => total + getRoomAssignmentCount(room), 0)
}

export function getAvailableResidentsByRace(state: GameState, raceId: RaceId): number {
  return Math.max(0, getPopulationByRace(state, raceId) - getAssignedResidentsByRace(state, raceId))
}

export function getFacilityLevel(room: FacilityInstance) {
  return facilityDefinitionById[room.definitionId]?.levels.find((level) => level.level === room.level)
}

export function getRaceRoomEfficiencyMultiplier(raceId: RaceId, facilityTags: string[]): number {
  return (raceDefinitionById[raceId]?.modifiers ?? []).reduce((multiplier, modifier) => {
    if (modifier.type !== 'roomEfficiencyMultiplier' || !facilityTags.includes(modifier.targetTag)) return multiplier
    return multiplier * modifier.value
  }, 1)
}

export function getRaceCombatMultiplier(raceId: RaceId): number {
  return (raceDefinitionById[raceId]?.modifiers ?? []).reduce(
    (multiplier, modifier) => modifier.type === 'combatMultiplier' ? multiplier * modifier.value : multiplier,
    1,
  )
}

export function calculateFacilityEfficiency(room: FacilityInstance): number {
  const staffSlots = getFacilityLevel(room)?.staffSlots ?? 0
  if (staffSlots <= 0) return 1
  return Math.min(1, getRoomAssignmentCount(room) / staffSlots)
}

function getTimedProductionMultiplier(state: GameState, facilityTags: string[]): number {
  return state.timedModifiers.reduce((multiplier, modifier) => {
    const active = modifier.type === 'productionTagMultiplier'
      && (!modifier.expiresOnDay || state.day < modifier.expiresOnDay)
      && Boolean(modifier.targetTag && facilityTags.includes(modifier.targetTag))
    return active ? multiplier * modifier.value : multiplier
  }, 1)
}

export function calculateFacilityProductionMultiplier(state: GameState, room: FacilityInstance): number {
  const definition = facilityDefinitionById[room.definitionId]
  const staffSlots = getFacilityLevel(room)?.staffSlots ?? 0
  if (!definition || staffSlots <= 0) return 1
  const contribution = room.residentAssignments.reduce(
    (total, assignment) => total + assignment.count * getRaceRoomEfficiencyMultiplier(assignment.raceId, definition.tags), 0,
  )
  return (contribution / staffSlots) * getTimedProductionMultiplier(state, definition.tags)
}

export interface AssignmentProductionContribution extends PopulationAssignment {
  raceName: string
  multiplier: number
  amount: number
}

export function getAssignmentProductionBreakdown(
  state: GameState,
  room: FacilityInstance,
  baseAmount: number,
): AssignmentProductionContribution[] {
  const definition = facilityDefinitionById[room.definitionId]
  const staffSlots = getFacilityLevel(room)?.staffSlots ?? 0
  if (!definition || staffSlots <= 0) return []
  const timedMultiplier = getTimedProductionMultiplier(state, definition.tags)
  return room.residentAssignments.map((assignment) => {
    const multiplier = getRaceRoomEfficiencyMultiplier(assignment.raceId, definition.tags) * timedMultiplier
    return {
      ...assignment,
      raceName: raceDefinitionById[assignment.raceId]?.name ?? assignment.raceId,
      multiplier,
      amount: baseAmount * (assignment.count / staffSlots) * multiplier,
    }
  })
}

export function canAdjustResidentAssignment(
  state: GameState,
  instanceId: string,
  raceId: RaceId,
  delta: 1 | -1,
): ActionCheck {
  const room = state.dungeon.rooms[instanceId]
  if (!room) return { allowed: false, reason: `시설 인스턴스 "${instanceId}"을 찾을 수 없습니다.` }
  const staffSlots = getFacilityLevel(room)?.staffSlots ?? 0
  if (staffSlots <= 0) return { allowed: false, reason: '이 시설에는 주민 배치가 필요하지 않습니다.' }
  if (delta > 0 && getRoomAssignmentCount(room) >= staffSlots) return { allowed: false, reason: '필요 인원을 모두 배치했습니다.' }
  if (delta > 0 && getAvailableResidentsByRace(state, raceId) <= 0) return { allowed: false, reason: '해당 종족에서 배치 가능한 주민이 없습니다.' }
  if (delta < 0 && getRoomAssignmentCount(room, raceId) <= 0) return { allowed: false, reason: '해제할 주민이 없습니다.' }
  return { allowed: true }
}

export function adjustResidentAssignment(
  state: GameState,
  instanceId: string,
  raceId: RaceId,
  delta: 1 | -1,
  now = new Date(),
): GameState {
  const check = canAdjustResidentAssignment(state, instanceId, raceId, delta)
  if (!check.allowed) throw new Error(check.reason)
  const room = state.dungeon.rooms[instanceId]
  if (!room) throw new Error(`시설 인스턴스 "${instanceId}"이 사라졌습니다.`)
  const current = getRoomAssignmentCount(room, raceId)
  const nextCount = current + delta
  const residentAssignments = room.residentAssignments
    .filter((assignment) => assignment.raceId !== raceId)
    .concat(nextCount > 0 ? [{ raceId, count: nextCount }] : [])
  const definition = facilityDefinitionById[room.definitionId]
  const nextState: GameState = {
    ...state,
    dungeon: { ...state.dungeon, rooms: { ...state.dungeon.rooms, [instanceId]: { ...room, residentAssignments } } },
  }
  return applyEffect(nextState, {
    type: 'addLog', category: 'system',
    message: `${definition?.name ?? room.definitionId} ${raceDefinitionById[raceId]?.name ?? raceId} 배치 ${delta > 0 ? '+' : '-'}1 (${nextCount}명)`,
  }, now)
}
