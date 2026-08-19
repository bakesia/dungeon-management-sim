import { checkConditions } from '../../engine/conditions/checkConditions'
import type { EventDefinition } from '../../types/content'
import type { GameState } from '../../types/game'
import { npcDefinitions } from '../../content/npcs/npcs'
import { motion } from 'motion/react'

interface SpecialVisitorModalProps {
  state: GameState
  event: EventDefinition
  onChoose: (choiceId: string) => boolean
}

export function SpecialVisitorModal({ state, event, onChoose }: SpecialVisitorModalProps) {
  const visitor = npcDefinitions.find((npc) => npc.joinEventId === event.id)
  return <motion.div className="decision-overlay" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.12 }}>
    <motion.section className="decision-panel visitor-panel" role="dialog" aria-modal="true" aria-labelledby="visitor-title" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.16, ease: 'linear' }}>
      <header><p className="eyebrow">SPECIAL VISITOR</p><h2 id="visitor-title">특별 방문자</h2></header>
      <div className="visitor-silhouette" aria-hidden="true">◆</div>
      <strong className="visitor-name">{visitor?.displayName ?? '이름 없는 방문자'}</strong>
      <p className="decision-copy">{event.text}</p>
      <div className="decision-actions">
        {event.choices.map((choice) => <button
          className={choice.id === 'decline' ? 'secondary-button' : 'primary-button'}
          type="button"
          key={choice.id}
          disabled={!checkConditions(state, choice.conditions)}
          onClick={() => onChoose(choice.id)}
        >{choice.text}</button>)}
      </div>
      <small>비용이 부족한 선택지는 이용할 수 없습니다. 거절한 방문자는 일정 시간이 지나면 다시 찾아올 수 있습니다.</small>
    </motion.section>
  </motion.div>
}
