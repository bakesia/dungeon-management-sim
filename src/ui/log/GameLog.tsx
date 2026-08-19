import { useEffect, useRef } from 'react'
import { eventDefinitionById } from '../../content/events/events'
import { checkConditions } from '../../engine/conditions/checkConditions'
import type { GameState } from '../../types/game'

interface GameLogProps {
  state: GameState
  isAdvancingDay: boolean
  saveError: string | null
  actionError: string | null
  onAdvanceDay: () => Promise<void>
  onChooseEvent: (choiceId: string) => boolean
}

export function GameLog({ state, isAdvancingDay, saveError, actionError, onAdvanceDay, onChooseEvent }: GameLogProps) {
  const logRef = useRef<HTMLDivElement>(null)
  const currentEvent = state.events.currentEventId ? eventDefinitionById[state.events.currentEventId] : undefined

  useEffect(() => {
    const logElement = logRef.current
    if (logElement) logElement.scrollTop = logElement.scrollHeight
  }, [state.logs.length, state.events.currentEventId])

  return (
    <section className="log-panel" aria-labelledby="game-log-title">
      <div className="panel-heading panel-heading--log">
        <div><p className="eyebrow">DUNGEON CHRONICLE</p><h2 id="game-log-title">진행 기록</h2></div>
        <span className="live-indicator"><i />LIVE</span>
      </div>
      <div className="game-log" role="log" aria-live="polite" ref={logRef}>
        <div className="day-divider"><span>&gt; DAY {state.day}</span></div>
        {state.logs.map((entry) => (
          <article className={`log-entry log-entry--${entry.category}`} key={entry.id}>
            <span className="log-entry__prompt">›</span><p>{entry.message}</p>
          </article>
        ))}
        {currentEvent && (
          <section className="event-prompt" aria-labelledby="current-event-title">
            <span>[ EVENT ]</span>
            <h3 id="current-event-title">{currentEvent.title}</h3>
            <p>{currentEvent.text}</p>
            <div className="event-choices">
              {currentEvent.choices.map((choice) => {
                const enabled = checkConditions(state, choice.conditions)
                return <button type="button" key={choice.id} disabled={!enabled} onClick={() => onChooseEvent(choice.id)}>{choice.text}</button>
              })}
            </div>
          </section>
        )}
        <div className="log-cursor" aria-hidden="true">_</div>
      </div>
      <footer className="turn-controls">
        <div>
          <span>현재 단계</span>
          <strong>{saveError ?? actionError ?? (currentEvent ? '이벤트 선택 대기' : '던전 정비')}</strong>
        </div>
        <button className="primary-button" type="button" onClick={onAdvanceDay} disabled={isAdvancingDay || Boolean(currentEvent)}>
          {isAdvancingDay ? '저장 중...' : currentEvent ? '선택 필요' : '다음 날'}
        </button>
      </footer>
    </section>
  )
}
