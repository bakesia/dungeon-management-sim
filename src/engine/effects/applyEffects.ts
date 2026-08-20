import type { EffectDefinition } from '../../types/content'
import type { GameLogEntry, GameState, PopulationGroup } from '../../types/game'
import { getPopulationSpace } from '../population/populationMetrics'
import { facilityDefinitionById } from '../../content/facilities/facilities'
import { defaultRandomSource } from '../random'
import { previewResourceChange } from '../resources/resourceCapacity'
import { resourceDefinitionById } from '../../content/resources/resources'
import { updateNpcEligibility } from '../npcs/npcEligibility'
import { addItem, removeItem } from '../inventory/inventory'
import { itemDefinitionById } from '../../content/items/items'
import { queuePopulationOffer } from '../population/populationOffer'
import { npcDefinitionById } from '../../content/npcs/npcs'

function reconcileResidentAssignments(state: GameState, population: PopulationGroup[]): GameState['dungeon'] {
  const remaining = new Map(population.map((group) => [group.raceId, group.count]))

  const rooms = Object.fromEntries(Object.entries(state.dungeon.rooms).map(([instanceId, room]) => {
    const residentAssignments = room.residentAssignments.flatMap((assignment) => {
      const available = remaining.get(assignment.raceId) ?? 0
      const count = Math.min(assignment.count, available)
      remaining.set(assignment.raceId, Math.max(0, available - count))
      return count > 0 ? [{ ...assignment, count }] : []
    })
    return [instanceId, { ...room, residentAssignments }]
  }))

  return { ...state.dungeon, rooms }
}

function createLogEntry(state: GameState, effect: Extract<EffectDefinition, { type: 'addLog' }>): GameLogEntry {
  return {
    id: `log-${state.day}-${state.logs.length + 1}`,
    day: effect.logDay ?? state.day,
    message: effect.message,
    category: effect.category ?? 'system',
    presentation: effect.presentation ?? 'instant',
    sound: effect.sound,
    presentationGroupId: effect.presentationGroupId,
    presentationSequence: effect.presentationSequence,
    presentationPriority: effect.presentationPriority,
  }
}

function insertPresentationLog(logs: GameLogEntry[], entry: GameLogEntry): GameLogEntry[] {
  const priority = entry.presentationPriority
  if (priority === undefined) return [...logs, entry]

  const markerIndex = logs.findLastIndex(
    (log) => log.day === entry.day && log.message === `DAY ${entry.day} 종료`,
  )
  let insertionIndex = markerIndex >= 0 ? markerIndex + 1 : logs.length
  while (
    insertionIndex < logs.length
    && logs[insertionIndex]?.day === entry.day
    && (logs[insertionIndex]?.presentationPriority ?? 0) >= priority
  ) insertionIndex += 1

  return [...logs.slice(0, insertionIndex), entry, ...logs.slice(insertionIndex)]
}

export function applyEffect(state: GameState, effect: EffectDefinition, now = new Date()): GameState {
  // Capture a fulfilled NPC unlock before an action can spend the resource or
  // otherwise remove the condition that made the NPC eligible.
  state = updateNpcEligibility(state)
  const updatedAt = now.toISOString()

  if (effect.type === 'addResource') {
    const change = previewResourceChange(state, effect.resourceId, effect.amount)
    const nextState: GameState = {
      ...state,
      resources: {
        ...state.resources,
        [effect.resourceId]: change.next,
      },
      metadata: { ...state.metadata, updatedAt },
    }
    if (change.overflow <= 0) return updateNpcEligibility(nextState)

    const resourceName = resourceDefinitionById[effect.resourceId]?.name ?? effect.resourceId
    return applyEffect(nextState, {
      type: 'addLog',
      category: 'warning',
      message: `[저장 한도] ${resourceName} +${change.applied} 저장. 공간 부족으로 ${change.overflow} 손실.`,
    }, now)
  }

  if (effect.type === 'setFlag') {
    return updateNpcEligibility({
      ...state,
      flags: { ...state.flags, [effect.flag]: effect.value },
      metadata: { ...state.metadata, updatedAt },
    })
  }

  if (effect.type === 'addPopulation') {
    const availableSpace = getPopulationSpace(state)
    const addedAmount = Math.min(Math.max(0, effect.amount), availableSpace)
    const matchingIndex = state.population.findIndex(
      (group) => group.raceId === effect.raceId,
    )
    const population = state.population.map((group) => ({ ...group }))

    if (matchingIndex >= 0) {
      const matchingGroup = population[matchingIndex]
      if (matchingGroup) matchingGroup.count += addedAmount
    } else if (addedAmount > 0) {
      population.push({
        id: `population-${effect.raceId}`,
        raceId: effect.raceId,
        count: addedAmount,
      })
    }

    const nextState: GameState = {
      ...state,
      population: population.filter((group) => group.count > 0),
      metadata: { ...state.metadata, updatedAt },
    }
    if (addedAmount < effect.amount) {
      return applyEffect(nextState, {
        type: 'addLog',
        category: 'warning',
        message: `숙소 수용 한계로 주민 ${effect.amount - addedAmount}명이 합류하지 못했습니다.`,
      }, now)
    }
    return updateNpcEligibility(nextState)
  }

  if (effect.type === 'offerPopulationJoin') {
    if (effect.amount <= 0) return state
    return queuePopulationOffer(state, { incoming: [{ raceId: effect.raceId, count: effect.amount }], source: 'event' }, now)
  }

  if (effect.type === 'removePopulation') {
    let remaining = effect.amount
    const population = state.population.flatMap((group) => {
      const matches = group.raceId === effect.raceId
      if (!matches || remaining <= 0) return [{ ...group }]

      const removed = Math.min(group.count, remaining)
      remaining -= removed
      const count = group.count - removed
      return count > 0 ? [{ ...group, count }] : []
    })

    return {
      ...state,
      population,
      dungeon: reconcileResidentAssignments(state, population),
      metadata: { ...state.metadata, updatedAt },
    }
  }

  if (effect.type === 'changeCoreHp') {
    const hp = Math.min(state.core.maxHp, Math.max(0, state.core.hp + effect.amount))
    return {
      ...state,
      core: {
        ...state.core,
        hp,
      },
      status: hp <= 0 ? 'gameOver' : state.status,
      metadata: { ...state.metadata, updatedAt },
    }
  }

  if (effect.type === 'damageRoom' || effect.type === 'repairRoom') {
    const room = state.dungeon.rooms[effect.instanceId]
    if (!room) throw new Error(`Unknown room instanceId "${effect.instanceId}" referenced by ${effect.type} effect.`)
    const definition = facilityDefinitionById[room.definitionId]
    if (!definition?.buildable) return state
    return {
      ...state,
      dungeon: {
        ...state.dungeon,
        rooms: {
          ...state.dungeon.rooms,
          [room.instanceId]: { ...room, condition: effect.type === 'damageRoom' ? 'damaged' : 'normal' },
        },
      },
      metadata: { ...state.metadata, updatedAt },
    }
  }

  if (effect.type === 'damageRandomRoom' || effect.type === 'repairRandomRoom') {
    const targetCondition = effect.type === 'damageRandomRoom' ? 'normal' : 'damaged'
    const candidates = Object.values(state.dungeon.rooms).filter((room) => {
      const definition = facilityDefinitionById[room.definitionId]
      return definition?.buildable && room.condition === targetCondition
    })
    if (candidates.length === 0) return state
    const index = Math.min(Math.floor(defaultRandomSource.next() * candidates.length), candidates.length - 1)
    const selected = candidates[index]
    if (!selected) return state
    return applyEffect(state, {
      type: effect.type === 'damageRandomRoom' ? 'damageRoom' : 'repairRoom',
      instanceId: selected.instanceId,
    }, now)
  }

  if (effect.type === 'joinNpc') {
    const current = state.npcs[effect.npcId]
    const joinedState: GameState = {
      ...state,
      npcs: {
        ...state.npcs,
        [effect.npcId]: {
          ...current,
          npcId: effect.npcId,
          eligible: true,
          discovered: true,
          joined: true,
          eligibleSinceDay: current?.eligibleSinceDay ?? state.day,
          joinedAtDay: state.day,
          retryAfterDay: undefined,
        },
      },
      metadata: { ...state.metadata, updatedAt },
    }
    const npc = npcDefinitionById[effect.npcId]
    return npc ? applyEffect(joinedState, { type: 'addLog', category: 'progression', presentation: 'typewriter', sound: 'event_positive', message: `[협력자 합류] ${npc.displayName}\n“${npc.joinLine}”\n${npc.serviceSummary}` }, now) : joinedState
  }

  if (effect.type === 'scheduleNpcRetry') {
    const current = state.npcs[effect.npcId]
    return {
      ...state,
      npcs: {
        ...state.npcs,
        [effect.npcId]: {
          npcId: effect.npcId,
          eligible: true,
          discovered: true,
          joined: current?.joined ?? false,
          eligibleSinceDay: current?.eligibleSinceDay ?? state.day,
          lastVisitDay: current?.lastVisitDay ?? state.day,
          retryAfterDay: state.day + Math.max(1, effect.days),
        },
      },
      metadata: { ...state.metadata, updatedAt },
    }
  }

  if (effect.type === 'addTimedModifier') {
    const modifier = {
      id: `modifier-${state.day}-${state.timedModifiers.length + 1}`,
      type: effect.modifierType,
      value: effect.value,
      targetTag: effect.targetTag,
      expiresOnDay: effect.durationDays ? state.day + effect.durationDays : undefined,
      consumeOnInvasion: effect.consumeOnInvasion ?? false,
    }
    return {
      ...state,
      timedModifiers: [...state.timedModifiers, modifier],
      metadata: { ...state.metadata, updatedAt },
    }
  }

  if (effect.type === 'revealInvasionIntel') {
    return {
      ...state,
      invasion: {
        ...state.invasion,
        intel: { ...state.invasion.intel, [effect.intelType]: true },
      },
      metadata: { ...state.metadata, updatedAt },
    }
  }

  if (effect.type === 'changeFame') {
    return updateNpcEligibility({
      ...state,
      invasion: { ...state.invasion, fame: Math.max(0, state.invasion.fame + effect.amount) },
      metadata: { ...state.metadata, updatedAt },
    })
  }

  if (effect.type === 'addItem' || effect.type === 'removeItem') {
    const nextState = effect.type === 'addItem'
      ? addItem(state, effect.itemId, effect.quantity)
      : removeItem(state, effect.itemId, effect.quantity)
    const item = itemDefinitionById[effect.itemId]
    return applyEffect(nextState, {
      type: 'addLog',
      category: effect.type === 'addItem' && item?.category === 'artifact' ? 'progression' : 'resource',
      message: `[${item?.category === 'artifact' ? '유물' : '아이템'}] ${item?.name ?? effect.itemId} ${effect.type === 'addItem' ? '+' : '-'}${effect.quantity}`,
      presentation: item?.category === 'artifact' ? 'typewriter' : 'instant',
      sound: item?.category === 'artifact' ? 'event_positive' : undefined,
    }, now)
  }

  return {
    ...state,
    logs: insertPresentationLog(state.logs, createLogEntry(state, effect)),
    metadata: { ...state.metadata, updatedAt },
  }
}

export function applyEffects(state: GameState, effects: EffectDefinition[], now = new Date()): GameState {
  return effects.reduce((currentState, effect) => applyEffect(currentState, effect, now), state)
}
