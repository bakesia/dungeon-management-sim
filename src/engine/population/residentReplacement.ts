import { facilityDefinitionById } from '../../content/facilities/facilities'
import { raceDefinitionById } from '../../content/races/races'
import type { RaceId } from '../../types/content'
import type { GameState } from '../../types/game'
import { applyEffect } from '../effects/applyEffects'
import { getAvailableResidentsByRace } from './assignWorkers'
import { getPopulationCapacity, getPopulationTotal } from './populationMetrics'

export function getRequiredReplacement(state: GameState): number {
  const pending = state.populationJoin.pending
  if (!pending) return 0
  return Math.max(0, getPopulationTotal(state) + pending.amount - getPopulationCapacity(state))
}

export function offerPopulationJoin(state: GameState, raceId: RaceId, amount: number, now = new Date()): GameState {
  if (amount <= 0) return state
  if (state.populationJoin.pending) throw new Error('다른 주민 합류 결정이 진행 중입니다.')
  const required = Math.max(0, getPopulationTotal(state) + amount - getPopulationCapacity(state))
  if (required === 0) return applyEffect(state, { type: 'addPopulation', raceId, amount }, now)
  return {
    ...state,
    populationJoin: { pending: { raceId, amount } },
    metadata: { ...state.metadata, updatedAt: now.toISOString() },
  }
}

export function confirmPopulationReplacement(
  state: GameState,
  removals: Partial<Record<RaceId, number>>,
  now = new Date(),
): GameState {
  const pending = state.populationJoin.pending
  if (!pending) throw new Error('교체를 기다리는 주민 합류가 없습니다.')
  const required = getRequiredReplacement(state)
  const selected = Object.values(removals).reduce<number>((total, amount) => total + (amount ?? 0), 0)
  if (selected !== required) throw new Error(`정확히 ${required}명을 내보내야 합니다.`)

  const populationByRace = new Map(state.population.map((group) => [group.raceId, group.count]))
  Object.entries(removals).forEach(([raceId, amount = 0]) => {
    if (!Number.isInteger(amount) || amount < 0 || amount > (populationByRace.get(raceId) ?? 0)) {
      throw new Error(`${raceDefinitionById[raceId]?.name ?? raceId} 퇴출 인원이 올바르지 않습니다.`)
    }
  })

  const rooms = Object.fromEntries(Object.entries(state.dungeon.rooms).map(([id, room]) => [id, { ...room, residentAssignments: room.residentAssignments.map((item) => ({ ...item })) }]))
  const assignmentChanges: string[] = []
  Object.entries(removals).sort(([a], [b]) => a.localeCompare(b)).forEach(([raceId, rawAmount = 0]) => {
    let assignedToRelease = Math.max(0, rawAmount - getAvailableResidentsByRace(state, raceId))
    Object.values(rooms).sort((a, b) => b.instanceId.localeCompare(a.instanceId)).forEach((room) => {
      if (assignedToRelease <= 0) return
      const assignment = room.residentAssignments.find((item) => item.raceId === raceId)
      if (!assignment) return
      const released = Math.min(assignment.count, assignedToRelease)
      assignment.count -= released
      assignedToRelease -= released
      room.residentAssignments = room.residentAssignments.filter((item) => item.count > 0)
      assignmentChanges.push(`${facilityDefinitionById[room.definitionId]?.name ?? room.definitionId} 배치 인원 -${released}`)
    })
  })

  const population = state.population.flatMap((group) => {
    const count = group.count - (removals[group.raceId] ?? 0)
    return count > 0 ? [{ ...group, count }] : []
  })
  let nextState: GameState = {
    ...state,
    population,
    dungeon: { ...state.dungeon, rooms },
    populationJoin: { pending: null },
  }
  const departure = Object.entries(removals).filter(([, amount]) => (amount ?? 0) > 0).map(([raceId, amount]) => `${raceDefinitionById[raceId]?.name ?? raceId} ${amount}명`).join(', ')
  nextState = applyEffect(nextState, { type: 'addLog', category: 'warning', message: `${departure}이 던전을 떠났습니다.${assignmentChanges.length ? `\n${assignmentChanges.join('\n')}` : ''}` }, now)
  nextState = applyEffect(nextState, { type: 'addPopulation', raceId: pending.raceId, amount: pending.amount }, now)
  return applyEffect(nextState, { type: 'addLog', category: 'event', message: `${raceDefinitionById[pending.raceId]?.name ?? pending.raceId} 주민 ${pending.amount}명이 합류했습니다.` }, now)
}

export function declinePopulationJoin(state: GameState, now = new Date()): GameState {
  if (!state.populationJoin.pending) throw new Error('거절할 주민 합류가 없습니다.')
  const nextState = { ...state, populationJoin: { pending: null } }
  return applyEffect(nextState, { type: 'addLog', category: 'event', message: '새 주민의 합류를 거절했습니다.' }, now)
}
