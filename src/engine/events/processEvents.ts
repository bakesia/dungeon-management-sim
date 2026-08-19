import { eventDefinitionById, eventDefinitions } from '../../content/events/events'
import { gameRules } from '../../content/gameRules'
import type { EventChoiceDefinition, EventDefinition } from '../../types/content'
import type { GameState } from '../../types/game'
import { checkConditions } from '../conditions/checkConditions'
import { applyEffect, applyEffects } from '../effects/applyEffects'
import { defaultRandomSource, type RandomSource } from '../random'

export function getEligibleEvents(state: GameState): EventDefinition[] {
  const recentIds = new Set(state.events.history.slice(-gameRules.events.recentHistorySize).map((entry) => entry.eventId))
  return eventDefinitions.filter((event) => {
    if (event.once && state.events.completedEventIds.includes(event.id)) return false
    if (recentIds.has(event.id)) return false
    const latestOccurrence = [...state.events.history].reverse().find((entry) => entry.eventId === event.id)
    const cooldownDays = event.cooldownDays ?? gameRules.events.defaultCooldownDays
    if (latestOccurrence && state.day - latestOccurrence.day < cooldownDays) return false
    return checkConditions(state, event.conditions)
  })
}

export function getEligibleDailyEvents(state: GameState): EventDefinition[] {
  return getEligibleEvents(state).filter((event) => !event.tags.includes('npc_join'))
}

export function getEligibleNpcVisitEvents(state: GameState): EventDefinition[] {
  return getEligibleEvents(state).filter((event) => event.tags.includes('npc_join'))
}

export function getEventCategory(event: EventDefinition): string {
  return event.category ?? event.tags[0] ?? 'general'
}

export function getEventWeight(state: GameState, event: EventDefinition): number {
  let weight = event.weight
  const recentCategories = state.events.history.slice(-2).flatMap((entry) => {
    const previous = eventDefinitionById[entry.eventId]
    return previous ? [getEventCategory(previous)] : []
  })
  if (recentCategories.length === 2 && recentCategories.every((category) => category === getEventCategory(event))) {
    weight *= gameRules.events.categoryRepeatMultiplier
  }
  if (event.tags.includes('chain')) weight *= gameRules.events.chainWeightMultiplier
  if (event.tags.includes('npc_join')) weight *= gameRules.events.npcJoinWeightMultiplier
  return weight
}

export function selectWeightedEvent(
  events: EventDefinition[],
  randomSource: RandomSource = defaultRandomSource,
  state?: GameState,
): EventDefinition | null {
  const weightedEvents = events.map((event) => ({ event, weight: state ? getEventWeight(state, event) : event.weight })).filter((item) => item.weight > 0)
  const totalWeight = weightedEvents.reduce((total, item) => total + item.weight, 0)
  if (totalWeight <= 0) return null

  let cursor = Math.min(Math.max(randomSource.next(), 0), 0.999999999) * totalWeight
  for (const item of weightedEvents) {
    cursor -= item.weight
    if (cursor < 0) return item.event
  }
  return weightedEvents.at(-1)?.event ?? null
}

export function processEventRoll(
  state: GameState,
  randomSource: RandomSource = defaultRandomSource,
  now = new Date(),
): GameState {
  if (state.events.currentEventId) return state

  const forced = state.events.daysSinceDailyEvent >= gameRules.events.maximumBlankDays
  const triggered = forced || randomSource.next() < gameRules.events.dailyChance
  if (!triggered) {
    return {
      ...state,
      events: {
        ...state.events,
        daysSinceLastEvent: state.events.daysSinceLastEvent + 1,
        daysSinceDailyEvent: state.events.daysSinceDailyEvent + 1,
      },
      metadata: { ...state.metadata, updatedAt: now.toISOString() },
    }
  }

  const selectedEvent = selectWeightedEvent(getEligibleDailyEvents(state), randomSource, state)
  if (!selectedEvent) {
    return {
      ...state,
      events: {
        ...state.events,
        daysSinceLastEvent: state.events.daysSinceLastEvent + 1,
        daysSinceDailyEvent: state.events.daysSinceDailyEvent + 1,
      },
      metadata: { ...state.metadata, updatedAt: now.toISOString() },
    }
  }

  const nextState: GameState = {
    ...state,
    events: {
      ...state.events,
      currentEventId: selectedEvent.id,
      daysSinceLastEvent: 0,
      daysSinceDailyEvent: 0,
      history: [...state.events.history, { eventId: selectedEvent.id, day: state.day }].slice(-gameRules.events.historyLimit),
    },
  }
  return applyEffect(nextState, {
    type: 'addLog',
    category: 'event',
    message: `[이벤트] ${selectedEvent.title} — 선택이 필요합니다.`,
  }, now)
}

export function processNpcVisitRoll(
  state: GameState,
  randomSource: RandomSource = defaultRandomSource,
  now = new Date(),
): GameState {
  if (randomSource.next() >= gameRules.npcs.visitorChance) return state
  const selectedEvent = selectWeightedEvent(getEligibleNpcVisitEvents(state), randomSource, state)
  if (!selectedEvent) return state

  const pendingEventIds = state.events.currentEventId
    ? [state.events.currentEventId, ...state.events.pendingEventIds]
    : state.events.pendingEventIds
  const nextState: GameState = {
    ...state,
    events: {
      ...state.events,
      currentEventId: selectedEvent.id,
      pendingEventIds,
      history: [...state.events.history, { eventId: selectedEvent.id, day: state.day }].slice(-gameRules.events.historyLimit),
    },
  }
  return applyEffect(nextState, {
    type: 'addLog',
    category: 'event',
    message: '[특별 방문자] 던전 입구에서 누군가 면담을 요청합니다.',
  }, now)
}

function getAvailableChoice(state: GameState, choiceId: string): {
  event: EventDefinition
  choice: EventChoiceDefinition
} {
  const currentEventId = state.events.currentEventId
  if (!currentEventId) throw new Error('진행 중인 이벤트가 없습니다.')
  const event = eventDefinitionById[currentEventId]
  if (!event) throw new Error(`이벤트 정의 "${currentEventId}"을 찾을 수 없습니다.`)
  const choice = event.choices.find((item) => item.id === choiceId)
  if (!choice) throw new Error(`이벤트 "${event.id}"에 선택지 "${choiceId}"가 없습니다.`)
  if (!checkConditions(state, choice.conditions)) throw new Error('현재 조건으로 선택할 수 없는 항목입니다.')
  return { event, choice }
}

export function chooseEvent(state: GameState, choiceId: string, now = new Date()): GameState {
  const { event, choice } = getAvailableChoice(state, choiceId)
  let nextState = applyEffect(state, {
    type: 'addLog',
    category: 'event',
    message: `${event.title}: ${choice.text}`,
  }, now)
  // Choice result logs receive UI presentation metadata without changing their game effects.
  nextState = applyEffects(
    nextState,
    choice.effects.map((effect) => effect.type === 'addLog' ? { ...effect, presentation: 'typewriter' as const } : effect),
    now,
  )

  return {
    ...nextState,
    events: {
      ...nextState.events,
      currentEventId: nextState.events.pendingEventIds[0] ?? null,
      pendingEventIds: nextState.events.pendingEventIds.slice(1),
      completedEventIds: nextState.events.completedEventIds.includes(event.id)
        ? nextState.events.completedEventIds
        : [...nextState.events.completedEventIds, event.id],
    },
    metadata: { ...nextState.metadata, updatedAt: now.toISOString() },
  }
}
