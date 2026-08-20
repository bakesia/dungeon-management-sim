import { facilityDefinitionById } from '../../content/facilities/facilities'
import { raceDefinitionById } from '../../content/races/races'
import type { RaceId, ResourceCost } from '../../types/content'
import type { GameState, PopulationJoinRuntimeState } from '../../types/game'
import { applyEffect } from '../effects/applyEffects'
import { canAfford, formatResourceCost, payResourceCost } from '../resources/resourceCosts'
import { getAvailableResidentsByRace } from './assignWorkers'
import { getPopulationCapacity, getPopulationTotal } from './populationMetrics'
import { queuePopulationOffer } from './populationOffer'

type PendingOffer = NonNullable<PopulationJoinRuntimeState['pending']>

export function offerPopulationJoin(state: GameState, raceId: RaceId, amount: number, now = new Date()): GameState {
  return amount <= 0 ? state : queuePopulationOffer(state, { incoming: [{ raceId, count: amount }], source: 'event' }, now)
}

export { queuePopulationOffer } from './populationOffer'

export function getAcceptedPopulationTotal(acceptances: Partial<Record<RaceId, number>>): number {
  return Object.values(acceptances).reduce<number>((total, value) => total + (value ?? 0), 0)
}

export function getRequiredReplacement(state: GameState, acceptances?: Partial<Record<RaceId, number>>): number {
  const pending = state.populationJoin.pending
  if (!pending) return 0
  const accepted = acceptances ? getAcceptedPopulationTotal(acceptances) : pending.incoming.reduce((sum, entry) => sum + entry.count, 0)
  return Math.max(0, getPopulationTotal(state) + accepted - getPopulationCapacity(state))
}

export function getProratedOfferCost(pending: PendingOffer, accepted: number): ResourceCost {
  const offered = pending.incoming.reduce((sum, entry) => sum + entry.count, 0)
  if (!pending.cost || accepted <= 0 || offered <= 0) return {}
  return Object.fromEntries(Object.entries(pending.cost).map(([id, amount]) => [id, Math.ceil(amount * accepted / offered)]))
}

export function confirmPopulationReplacement(state: GameState, acceptances: Partial<Record<RaceId, number>>, removals: Partial<Record<RaceId, number>>, now = new Date()): GameState {
  const pending = state.populationJoin.pending
  if (!pending) throw new Error('결정을 기다리는 주민 합류가 없습니다.')
  const offeredByRace = new Map(pending.incoming.map((entry) => [entry.raceId, entry.count]))
  Object.entries(acceptances).forEach(([raceId, count = 0]) => {
    if (!Number.isInteger(count) || count < 0 || count > (offeredByRace.get(raceId) ?? 0)) throw new Error(`${raceDefinitionById[raceId]?.name ?? raceId} 합류 인원이 올바르지 않습니다.`)
  })
  const acceptedTotal = getAcceptedPopulationTotal(acceptances)
  if (acceptedTotal === 0) return declinePopulationJoin(state, now)
  const required = getRequiredReplacement(state, acceptances)
  const selected = Object.values(removals).reduce<number>((total, amount) => total + (amount ?? 0), 0)
  if (selected !== required) throw new Error(`정확히 ${required}명을 내보내야 합니다.`)
  const cost = getProratedOfferCost(pending, acceptedTotal)
  if (!canAfford(state, cost)) throw new Error(`합류 비용이 부족합니다: ${formatResourceCost(cost)}`)
  const populationByRace = new Map(state.population.map((group) => [group.raceId, group.count]))
  Object.entries(removals).forEach(([raceId, amount = 0]) => {
    if (!Number.isInteger(amount) || amount < 0 || amount > (populationByRace.get(raceId) ?? 0)) throw new Error(`${raceDefinitionById[raceId]?.name ?? raceId} 퇴출 인원이 올바르지 않습니다.`)
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
  let nextState: GameState = { ...state, population: state.population.flatMap((group) => {
    const count = group.count - (removals[group.raceId] ?? 0)
    return count > 0 ? [{ ...group, count }] : []
  }), dungeon: { ...state.dungeon, rooms }, populationJoin: { pending: null } }
  if (Object.keys(cost).length > 0) nextState = payResourceCost(nextState, cost, now)
  for (const [raceId, count = 0] of Object.entries(acceptances).sort(([a], [b]) => a.localeCompare(b))) {
    if (count > 0) nextState = applyEffect(nextState, { type: 'addPopulation', raceId, amount: count }, now)
  }
  if (pending.source === 'tavern' && pending.sourceId) nextState = { ...nextState, tavern: { ...nextState.tavern, recruitmentOffers: nextState.tavern.recruitmentOffers.map((entry) => entry.offerId === pending.sourceId ? { ...entry, remaining: Math.max(0, entry.remaining - 1) } : entry) } }
  const departed = Object.entries(removals).filter(([, count]) => (count ?? 0) > 0).map(([id, count]) => `${raceDefinitionById[id]?.name ?? id} ${count}명`).join(', ')
  const joined = Object.entries(acceptances).filter(([, count]) => (count ?? 0) > 0).map(([id, count]) => `${raceDefinitionById[id]?.name ?? id} ${count}명`).join(', ')
  return applyEffect(nextState, { type: 'addLog', category: 'progression', message: `${departed ? `${departed}이 떠났습니다.\n` : ''}${assignmentChanges.join('\n')}${assignmentChanges.length ? '\n' : ''}${joined}이 합류했습니다.${Object.keys(cost).length ? ` [${formatResourceCost(cost)} 소모]` : ''}` }, now)
}

export function declinePopulationJoin(state: GameState, now = new Date()): GameState {
  if (!state.populationJoin.pending) throw new Error('거절할 주민 합류가 없습니다.')
  return applyEffect({ ...state, populationJoin: { pending: null } }, { type: 'addLog', category: 'event', message: '새 주민의 합류를 받지 않았습니다.' }, now)
}
