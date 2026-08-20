import { canChooseEventChoice, shouldShowEventChoice } from '../../engine/events/processEvents'
import type { EventDefinition } from '../../types/content'
import type { GameState } from '../../types/game'
import { npcDefinitions } from '../../content/npcs/npcs'
import { motion } from 'motion/react'
import { formatResourceCost } from '../../engine/resources/resourceCosts'

interface SpecialVisitorModalProps {
  state: GameState
  event: EventDefinition
  onChoose: (choiceId: string) => boolean
}

export function SpecialVisitorModal({ state, event, onChoose }: SpecialVisitorModalProps) {
  const visitor = npcDefinitions.find((npc) => npc.joinEventId === event.id)
  const costs = event.choices.flatMap((choice) => choice.conditions ?? []).flatMap((condition) => condition.type === 'resourceAtLeast' ? [[condition.resourceId, condition.amount] as const] : [])
  return <motion.div className="decision-overlay" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.12 }}>
    <motion.section className="decision-panel visitor-panel" role="dialog" aria-modal="true" aria-labelledby="visitor-title" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.16, ease: 'linear' }}>
      <header><p className="eyebrow">SPECIAL VISITOR</p><h2 id="visitor-title">특별 방문자</h2></header>
      <div className="visitor-silhouette" aria-hidden="true">{visitor?.visitorSymbol ?? '◆'}</div>
      <strong className="visitor-name">{visitor?.displayName ?? '이름 없는 방문자'}</strong>
      <p className="visitor-role">{visitor?.role ?? 'visitor'} · {visitor?.serviceSummary}</p>
      <p className="decision-copy">{event.text}</p>
      <div className="visitor-terms"><p><span>합류 시 제공</span><strong>{visitor?.serviceSummary ?? '던전 지원'}</strong></p><p><span>요구 비용</span><strong>{costs.length ? formatResourceCost(Object.fromEntries(costs)) : '없음'}</strong></p></div>
      <div className="decision-actions">
        {event.choices.filter((choice) => shouldShowEventChoice(state, choice)).map((choice) => <button
          className={choice.id === 'decline' ? 'secondary-button' : 'primary-button'}
          type="button"
          key={choice.id}
          disabled={!canChooseEventChoice(state, choice)}
          onClick={() => onChoose(choice.id)}
        >{choice.text}</button>)}
      </div>
      <small>비용이 부족한 선택지는 이용할 수 없습니다. 거절한 방문자는 일정 시간이 지나면 다시 찾아올 수 있습니다.</small>
    </motion.section>
  </motion.div>
}
