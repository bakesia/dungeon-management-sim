import { useMemo, useState } from 'react'
import { raceDefinitions, raceDefinitionById } from '../../content/races/races'
import { getProratedOfferCost, getRequiredReplacement } from '../../engine/population/residentReplacement'
import { formatResourceCost } from '../../engine/resources/resourceCosts'
import type { GameState } from '../../types/game'
import { RaceIcon } from './RaceIcon'

interface Props {
  state: GameState
  onConfirm: (acceptances: Record<string, number>, removals: Record<string, number>) => boolean
  onDecline: () => void
}

export function ResidentReplacementModal({ state, onConfirm, onDecline }: Props) {
  const pending = state.populationJoin.pending
  const initial = useMemo(() => Object.fromEntries(pending?.incoming.map((entry) => [entry.raceId, entry.count]) ?? []), [pending])
  const [acceptances, setAcceptances] = useState<Record<string, number>>(initial)
  const [removals, setRemovals] = useState<Record<string, number>>({})
  if (!pending) return null
  const required = getRequiredReplacement(state, acceptances)
  const selected = Object.values(removals).reduce((total, count) => total + count, 0)
  const accepted = Object.values(acceptances).reduce((total, count) => total + count, 0)
  const cost = getProratedOfferCost(pending, accepted)
  const adjustAccept = (raceId: string, delta: 1 | -1, max: number) => setAcceptances((current) => ({ ...current, [raceId]: Math.max(0, Math.min(max, (current[raceId] ?? 0) + delta)) }))
  const adjustRemoval = (raceId: string, delta: 1 | -1, max: number) => setRemovals((current) => ({ ...current, [raceId]: Math.max(0, Math.min(max, (current[raceId] ?? 0) + delta)) }))

  return <div className="decision-overlay" role="presentation"><section className="decision-panel replacement-panel" role="dialog" aria-modal="true" aria-labelledby="replacement-title">
    <header><p className="eyebrow">RESIDENT DECISION</p><h2 id="replacement-title">합류 인원 결정</h2></header>
    <p className="decision-copy">받아들일 주민 수를 종족별로 정하십시오. 0명도 선택할 수 있으며, 수용 공간을 넘기면 기존 주민을 내보내야 합니다.</p>
    <h3>합류 예정</h3><div className="replacement-list">{pending.incoming.map((entry) => {
      const race = raceDefinitionById[entry.raceId]; const value = acceptances[entry.raceId] ?? 0
      return <div className="replacement-row" key={entry.raceId}><RaceIcon iconId={race?.iconId ?? ''} name={race?.name ?? entry.raceId} size={34}/><span><strong>{race?.name ?? entry.raceId}</strong><small>제안 {entry.count}명</small></span><div className="assignment-stepper"><button type="button" disabled={value <= 0} onClick={() => adjustAccept(entry.raceId, -1, entry.count)}>−</button><strong>{value}</strong><button type="button" disabled={value >= entry.count} onClick={() => adjustAccept(entry.raceId, 1, entry.count)}>+</button></div></div>
    })}</div>
    {pending.cost && <p className="replacement-count">선택 비용: {accepted > 0 ? formatResourceCost(cost) : '없음'}</p>}
    {required > 0 && <><h3>떠나보낼 주민</h3><div className="replacement-list">{raceDefinitions.map((race) => {
      const count = state.population.find((group) => group.raceId === race.id)?.count ?? 0; const value = removals[race.id] ?? 0
      return <div className="replacement-row" key={race.id}><RaceIcon iconId={race.iconId} name={race.name} size={34}/><span><strong>{race.name}</strong><small>현재 {count}명</small></span><div className="assignment-stepper"><button type="button" disabled={value <= 0} onClick={() => adjustRemoval(race.id, -1, count)}>−</button><strong>{value}</strong><button type="button" disabled={value >= count || selected >= required} onClick={() => adjustRemoval(race.id, 1, count)}>+</button></div></div>
    })}</div></>}
    <p className={selected === required ? 'replacement-count is-ready' : 'replacement-count'}>합류 {accepted}명 · 퇴출 {selected} / {required}명</p>
    <div className="decision-actions"><button className="secondary-button" type="button" onClick={onDecline}>모두 거절</button><button className="primary-button" type="button" disabled={selected !== required} onClick={() => onConfirm(acceptances, removals)}>{accepted === 0 ? '0명으로 결정' : '결정 확정'}</button></div>
    <small>대기 주민부터 떠나며, 부족하면 최근 배치 시설부터 자동 해제됩니다.</small>
  </section></div>
}
