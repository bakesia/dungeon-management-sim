import { useState } from 'react'
import { raceDefinitions, raceDefinitionById } from '../../content/races/races'
import { getRequiredReplacement } from '../../engine/population/residentReplacement'
import type { GameState } from '../../types/game'
import { RaceIcon } from './RaceIcon'

interface ResidentReplacementModalProps {
  state: GameState
  onConfirm: (removals: Record<string, number>) => boolean
  onDecline: () => void
}

export function ResidentReplacementModal({ state, onConfirm, onDecline }: ResidentReplacementModalProps) {
  const [removals, setRemovals] = useState<Record<string, number>>({})
  const pending = state.populationJoin.pending
  const required = getRequiredReplacement(state)
  const selected = Object.values(removals).reduce((total, count) => total + count, 0)

  if (!pending) return null

  const adjust = (raceId: string, delta: 1 | -1, maximum: number) => {
    setRemovals((current) => {
      const value = Math.max(0, Math.min(maximum, (current[raceId] ?? 0) + delta))
      return { ...current, [raceId]: value }
    })
  }

  return <div className="decision-overlay" role="presentation">
    <section className="decision-panel replacement-panel" role="dialog" aria-modal="true" aria-labelledby="replacement-title">
      <header><p className="eyebrow">RESIDENT REPLACEMENT</p><h2 id="replacement-title">주민 교체 필요</h2></header>
      <p className="decision-copy"><strong>{raceDefinitionById[pending.raceId]?.name ?? pending.raceId} {pending.amount}명</strong>이 합류하려 하지만 수용 공간이 부족합니다. 기존 주민을 정확히 {required}명 선택해 내보내야 합니다.</p>
      <div className="replacement-list">
        {raceDefinitions.map((race) => {
          const count = state.population.find((group) => group.raceId === race.id)?.count ?? 0
          const value = removals[race.id] ?? 0
          return <div className="replacement-row" key={race.id}>
            <RaceIcon iconId={race.iconId} name={race.name} size={34} />
            <span><strong>{race.name}</strong><small>현재 {count}명</small></span>
            <div className="assignment-stepper"><button type="button" disabled={value <= 0} onClick={() => adjust(race.id, -1, count)}>−</button><strong>{value}</strong><button type="button" disabled={value >= count || selected >= required} onClick={() => adjust(race.id, 1, count)}>+</button></div>
          </div>
        })}
      </div>
      <p className={selected === required ? 'replacement-count is-ready' : 'replacement-count'}>선택 {selected} / {required}명</p>
      <div className="decision-actions"><button className="secondary-button" type="button" onClick={onDecline}>합류를 거절한다</button><button className="primary-button" type="button" disabled={selected !== required} onClick={() => onConfirm(removals)}>교체하고 받아들인다</button></div>
      <small>먼저 대기 중인 주민이 떠납니다. 부족한 경우 최근 배치 시설부터 자동으로 배치가 해제됩니다.</small>
    </section>
  </div>
}
