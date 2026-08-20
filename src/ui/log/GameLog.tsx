import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { eventDefinitionById } from '../../content/events/events'
import { canChooseEventChoice, shouldShowEventChoice } from '../../engine/events/processEvents'
import type { GameState } from '../../types/game'
import { TypewriterText } from './TypewriterText'

interface GameLogProps {
  state: GameState
  isAdvancingDay: boolean
  saveError: string | null
  actionError: string | null
  onAdvanceDay: () => Promise<void>
  onChooseEvent: (choiceId: string) => boolean
  typewriterEnabled: boolean
}

export function GameLog({ state, isAdvancingDay, saveError, actionError, onAdvanceDay, onChooseEvent, typewriterEnabled }: GameLogProps) {
  const logRef = useRef<HTMLDivElement>(null)
  const choicesRef = useRef<HTMLDivElement>(null)
  const followsBottomRef = useRef(true)
  const [completedTypingIds, setCompletedTypingIds] = useState(() => new Set(state.logs.map((entry) => entry.id)))
  const [activeTypingId, setActiveTypingId] = useState<string | null>(null)
  const [eventPresentation, setEventPresentation] = useState<{ key: string; complete: boolean; skipped: boolean } | null>(null)
  const activeEvent = state.events.currentEventId ? eventDefinitionById[state.events.currentEventId] : undefined
  const currentEvent = activeEvent?.tags.includes('npc_join') ? undefined : activeEvent
  const eventPresentationKey = `${currentEvent?.id ?? 'none'}:${typewriterEnabled}`
  const eventBodyComplete = !typewriterEnabled || (eventPresentation?.key === eventPresentationKey && eventPresentation.complete)
  const eventWasSkipped = !typewriterEnabled || (eventPresentation?.key === eventPresentationKey && eventPresentation.skipped)
  const firstIncompleteLogIndex = state.logs.findIndex((entry) => entry.presentation === 'typewriter' && !completedTypingIds.has(entry.id))
  const visibleLogs = firstIncompleteLogIndex >= 0 ? state.logs.slice(0, firstIncompleteLogIndex + 1) : state.logs
  const hasPendingPresentation = firstIncompleteLogIndex >= 0

  useEffect(() => {
    const logElement = logRef.current
    if (logElement && followsBottomRef.current) logElement.scrollTop = logElement.scrollHeight
  }, [state.logs.length, state.events.currentEventId])

  useEffect(() => {
    if (!currentEvent || !eventBodyComplete || hasPendingPresentation) return
    const frame = window.requestAnimationFrame(() => choicesRef.current?.scrollIntoView({ block: 'nearest' }))
    return () => window.cancelAnimationFrame(frame)
  }, [currentEvent, eventBodyComplete, hasPendingPresentation])

  useEffect(() => {
    let timer: number | undefined
    if (!typewriterEnabled) {
      timer = window.setTimeout(() => {
        setCompletedTypingIds(new Set(state.logs.map((entry) => entry.id)))
        setActiveTypingId(null)
      }, 0)
      return () => window.clearTimeout(timer)
    }
    if (activeTypingId) return
    const next = state.logs.find((entry) => entry.presentation === 'typewriter' && !completedTypingIds.has(entry.id))
    if (next) timer = window.setTimeout(() => setActiveTypingId(next.id), 0)
    return () => {
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [activeTypingId, completedTypingIds, state.logs, typewriterEnabled])

  const completeTyping = useCallback((id: string) => {
    setCompletedTypingIds((current) => new Set(current).add(id))
    setActiveTypingId((current) => current === id ? null : current)
  }, [])

  return (
    <section className="log-panel" aria-labelledby="game-log-title">
      <div className="panel-heading panel-heading--log">
        <div><p className="eyebrow">DUNGEON CHRONICLE</p><h2 id="game-log-title">진행 기록</h2></div>
        <span className="live-indicator"><i />LIVE</span>
      </div>
      <div className="game-log" role="log" aria-live="polite" ref={logRef} onScroll={(event) => {
        const element = event.currentTarget
        followsBottomRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80
      }}>
        <div className="day-divider"><span>&gt; DAY {state.day}</span></div>
        {visibleLogs.map((entry) => (
          <article className={`log-entry log-entry--${entry.category}`} key={entry.id}>
            <span className="log-entry__prompt">›</span>
            {entry.presentation === 'typewriter' && activeTypingId === entry.id
              ? <TypewriterText key={`${entry.id}-${typewriterEnabled}`} text={entry.message} enabled={typewriterEnabled} onComplete={() => completeTyping(entry.id)} />
              : <p>{completedTypingIds.has(entry.id) || entry.presentation === 'instant' ? entry.message : ''}</p>}
          </article>
        ))}
        {currentEvent && !hasPendingPresentation && (
          <section className="event-prompt" aria-labelledby="current-event-title">
            <span>[ EVENT ]</span>
            <h3 id="current-event-title">{currentEvent.title}</h3>
            <TypewriterText
              key={`${currentEvent.id}-${typewriterEnabled}`}
              text={currentEvent.text}
              enabled={typewriterEnabled}
              onComplete={() => setEventPresentation((current) => ({ key: eventPresentationKey, complete: true, skipped: current?.key === eventPresentationKey && current.skipped }))}
              onSkip={() => setEventPresentation({ key: eventPresentationKey, complete: true, skipped: true })}
            />
            {eventBodyComplete && <div className="event-choices" ref={choicesRef}>
              {currentEvent.choices.filter((choice) => shouldShowEventChoice(state, choice)).map((choice, index, choices) => {
                const enabled = canChooseEventChoice(state, choice)
                return <motion.button
                  type="button"
                  key={choice.id}
                  disabled={!enabled}
                  onClick={() => onChooseEvent(choice.id)}
                  initial={eventWasSkipped ? false : { opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.12, delay: eventWasSkipped ? 0 : index * 0.14, ease: 'linear' }}
                  onAnimationComplete={() => {
                    if (index === choices.length - 1) choicesRef.current?.scrollIntoView({ block: 'nearest' })
                  }}
                >{choice.text}</motion.button>
              })}
            </div>}
          </section>
        )}
        <div className="log-cursor" aria-hidden="true">_</div>
      </div>
      <footer className="turn-controls">
        <div>
          <span>현재 단계</span>
          <strong>{saveError ?? actionError ?? (activeEvent ? '이벤트 선택 대기' : '던전 정비')}</strong>
        </div>
        <button className="primary-button" type="button" onClick={onAdvanceDay} disabled={isAdvancingDay || Boolean(activeEvent) || Boolean(state.populationJoin.pending) || Boolean(state.invasion.pendingResolution)}>
          {isAdvancingDay ? '저장 중...' : activeEvent || state.populationJoin.pending || state.invasion.pendingResolution ? '결정 필요' : '다음 날'}
        </button>
      </footer>
    </section>
  )
}
