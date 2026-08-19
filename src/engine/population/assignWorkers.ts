import { facilityDefinitionById } from '../../content/facilities/facilities'
import { jobDefinitionById } from '../../content/jobs/jobs'
import type { JobId } from '../../types/content'
import type { FacilityInstance, GameState } from '../../types/game'
import type { ActionCheck } from '../../types/engine'
import { applyEffect } from '../effects/applyEffects'

export function getPopulationByJob(state: GameState, jobId: JobId): number {
  return state.population
    .filter((group) => group.jobId === jobId)
    .reduce((total, group) => total + group.count, 0)
}

export function getAssignedWorkersByJob(state: GameState, jobId: JobId): number {
  return Object.values(state.dungeon.rooms).reduce(
    (total, room) => total + (room.assignedWorkers[jobId] ?? 0),
    0,
  )
}

export function getAvailableWorkersByJob(state: GameState, jobId: JobId): number {
  return Math.max(0, getPopulationByJob(state, jobId) - getAssignedWorkersByJob(state, jobId))
}

export function getFacilityLevel(room: FacilityInstance) {
  const definition = facilityDefinitionById[room.definitionId]
  return definition?.levels.find((level) => level.level === room.level)
}

export function calculateFacilityEfficiency(room: FacilityInstance): number {
  const requirements = getFacilityLevel(room)?.requiredWorkers
  if (!requirements || Object.keys(requirements).length === 0) return 1

  const ratios = Object.entries(requirements).map(([jobId, required]) => {
    if (!required || required <= 0) return 1
    return Math.min(1, (room.assignedWorkers[jobId] ?? 0) / required)
  })
  return Math.min(...ratios)
}

export function canAdjustWorkerAssignment(
  state: GameState,
  instanceId: string,
  jobId: JobId,
  delta: 1 | -1,
): ActionCheck {
  const room = state.dungeon.rooms[instanceId]
  if (!room) return { allowed: false, reason: `시설 인스턴스 "${instanceId}"을 찾을 수 없습니다.` }
  const required = getFacilityLevel(room)?.requiredWorkers?.[jobId]
  if (!required) return { allowed: false, reason: '이 시설에는 해당 직업이 필요하지 않습니다.' }
  const assigned = room.assignedWorkers[jobId] ?? 0
  if (delta > 0 && assigned >= required) return { allowed: false, reason: '필요 인원을 모두 배치했습니다.' }
  if (delta > 0 && getAvailableWorkersByJob(state, jobId) <= 0) return { allowed: false, reason: '배치 가능한 주민이 없습니다.' }
  if (delta < 0 && assigned <= 0) return { allowed: false, reason: '해제할 주민이 없습니다.' }
  return { allowed: true }
}

export function adjustWorkerAssignment(
  state: GameState,
  instanceId: string,
  jobId: JobId,
  delta: 1 | -1,
  now = new Date(),
): GameState {
  const check = canAdjustWorkerAssignment(state, instanceId, jobId, delta)
  if (!check.allowed) throw new Error(check.reason)
  const room = state.dungeon.rooms[instanceId]
  if (!room) throw new Error(`시설 인스턴스 "${instanceId}"이 사라졌습니다.`)
  const assigned = (room.assignedWorkers[jobId] ?? 0) + delta
  const definition = facilityDefinitionById[room.definitionId]
  const job = jobDefinitionById[jobId]

  const nextState: GameState = {
    ...state,
    dungeon: {
      ...state.dungeon,
      rooms: {
        ...state.dungeon.rooms,
        [instanceId]: {
          ...room,
          assignedWorkers: { ...room.assignedWorkers, [jobId]: assigned },
        },
      },
    },
  }
  return applyEffect(nextState, {
    type: 'addLog',
    category: 'system',
    message: `${definition?.name ?? room.definitionId} ${job?.name ?? jobId} 배치 ${delta > 0 ? '+' : '-'}1 (${assigned}명)`,
  }, now)
}
