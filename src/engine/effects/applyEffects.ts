import type { EffectDefinition, JobId } from '../../types/content'
import type { GameLogEntry, GameState, PopulationGroup } from '../../types/game'

function reconcileWorkerAssignments(state: GameState, population: PopulationGroup[]): GameState['dungeon'] {
  const remainingByJob = population.reduce<Partial<Record<JobId, number>>>((totals, group) => ({
    ...totals,
    [group.jobId]: (totals[group.jobId] ?? 0) + group.count,
  }), {})

  const rooms = Object.fromEntries(Object.entries(state.dungeon.rooms).map(([instanceId, room]) => {
    const assignedWorkers = Object.fromEntries(Object.entries(room.assignedWorkers).map(([jobId, count]) => {
      const available = remainingByJob[jobId] ?? 0
      const reconciledCount = Math.min(count ?? 0, available)
      remainingByJob[jobId] = Math.max(0, available - reconciledCount)
      return [jobId, reconciledCount]
    }))
    return [instanceId, { ...room, assignedWorkers }]
  }))

  return { ...state.dungeon, rooms }
}

function createLogEntry(state: GameState, effect: Extract<EffectDefinition, { type: 'addLog' }>): GameLogEntry {
  return {
    id: `log-${state.day}-${state.logs.length + 1}`,
    day: state.day,
    message: effect.message,
    category: effect.category ?? 'system',
  }
}

export function applyEffect(state: GameState, effect: EffectDefinition, now = new Date()): GameState {
  const updatedAt = now.toISOString()

  if (effect.type === 'addResource') {
    const currentAmount = state.resources[effect.resourceId]
    if (currentAmount === undefined) {
      throw new Error(`Unknown resourceId "${effect.resourceId}" referenced by addResource effect.`)
    }

    return {
      ...state,
      resources: {
        ...state.resources,
        [effect.resourceId]: Math.max(0, currentAmount + effect.amount),
      },
      metadata: { ...state.metadata, updatedAt },
    }
  }

  if (effect.type === 'setFlag') {
    return {
      ...state,
      flags: { ...state.flags, [effect.flag]: effect.value },
      metadata: { ...state.metadata, updatedAt },
    }
  }

  if (effect.type === 'addPopulation') {
    const matchingIndex = state.population.findIndex(
      (group) => group.raceId === effect.raceId && group.jobId === effect.jobId,
    )
    const population = state.population.map((group) => ({ ...group }))

    if (matchingIndex >= 0) {
      const matchingGroup = population[matchingIndex]
      if (matchingGroup) matchingGroup.count += effect.amount
    } else if (effect.amount > 0) {
      population.push({
        id: `population-${effect.raceId}-${effect.jobId}-${state.population.length + 1}`,
        raceId: effect.raceId,
        jobId: effect.jobId,
        count: effect.amount,
      })
    }

    return {
      ...state,
      population: population.filter((group) => group.count > 0),
      metadata: { ...state.metadata, updatedAt },
    }
  }

  if (effect.type === 'removePopulation') {
    let remaining = effect.amount
    const population = state.population.flatMap((group) => {
      const matches = group.raceId === effect.raceId && (!effect.jobId || group.jobId === effect.jobId)
      if (!matches || remaining <= 0) return [{ ...group }]

      const removed = Math.min(group.count, remaining)
      remaining -= removed
      const count = group.count - removed
      return count > 0 ? [{ ...group, count }] : []
    })

    return {
      ...state,
      population,
      dungeon: reconcileWorkerAssignments(state, population),
      metadata: { ...state.metadata, updatedAt },
    }
  }

  if (effect.type === 'changeCoreHp') {
    return {
      ...state,
      core: {
        ...state.core,
        hp: Math.min(state.core.maxHp, Math.max(0, state.core.hp + effect.amount)),
      },
      metadata: { ...state.metadata, updatedAt },
    }
  }

  return {
    ...state,
    logs: [...state.logs, createLogEntry(state, effect)],
    metadata: { ...state.metadata, updatedAt },
  }
}

export function applyEffects(state: GameState, effects: EffectDefinition[], now = new Date()): GameState {
  return effects.reduce((currentState, effect) => applyEffect(currentState, effect, now), state)
}
