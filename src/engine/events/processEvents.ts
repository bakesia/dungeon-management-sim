import { eventDefinitionById, eventDefinitions } from '../../content/events/events'
import { gameRules } from '../../content/gameRules'
import type { EventChoiceDefinition, EventDefinition } from '../../types/content'
import type { GameState } from '../../types/game'
import { checkConditions } from '../conditions/checkConditions'
import { applyEffect, applyEffects } from '../effects/applyEffects'
import { defaultRandomSource, type RandomSource } from '../random'

export function getEligibleEvents(state: GameState): EventDefinition[] {
  return eventDefinitions.filter((event) => {
    if (event.once && state.events.completedEventIds.includes(event.id)) return false
    return checkConditions(state, event.conditions)
  })
}

export function selectWeightedEvent(
  events: EventDefinition[],
  randomSource: RandomSource = defaultRandomSource,
): EventDefinition | null {
  const weightedEvents = events.filter((event) => event.weight > 0)
  const totalWeight = weightedEvents.reduce((total, event) => total + event.weight, 0)
  if (totalWeight <= 0) return null

  let cursor = Math.min(Math.max(randomSource.next(), 0), 0.999999999) * totalWeight
  for (const event of weightedEvents) {
    cursor -= event.weight
    if (cursor < 0) return event
  }
  return weightedEvents.at(-1) ?? null
}

export function processEventRoll(
  state: GameState,
  randomSource: RandomSource = defaultRandomSource,
  now = new Date(),
): GameState {
  if (state.events.currentEventId) return state

  const forced = state.events.daysSinceLastEvent >= gameRules.events.forcedAfterDays - 1
  const triggered = forced || randomSource.next() < gameRules.events.dailyChance
  if (!triggered) {
    return {
      ...state,
      events: { ...state.events, daysSinceLastEvent: state.events.daysSinceLastEvent + 1 },
      metadata: { ...state.metadata, updatedAt: now.toISOString() },
    }
  }

  const selectedEvent = selectWeightedEvent(getEligibleEvents(state), randomSource)
  if (!selectedEvent) {
    return {
      ...state,
      events: { ...state.events, daysSinceLastEvent: state.events.daysSinceLastEvent + 1 },
      metadata: { ...state.metadata, updatedAt: now.toISOString() },
    }
  }

  const nextState: GameState = {
    ...state,
    events: {
      ...state.events,
      currentEventId: selectedEvent.id,
      daysSinceLastEvent: 0,
    },
  }
  return applyEffect(nextState, {
    type: 'addLog',
    category: 'event',
    message: `[이벤트] ${selectedEvent.title} — 선택이 필요합니다.`,
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
  nextState = applyEffects(nextState, choice.effects, now)

  return {
    ...nextState,
    events: {
      ...nextState.events,
      currentEventId: null,
      completedEventIds: nextState.events.completedEventIds.includes(event.id)
        ? nextState.events.completedEventIds
        : [...nextState.events.completedEventIds, event.id],
    },
    metadata: { ...nextState.metadata, updatedAt: now.toISOString() },
  }
}
