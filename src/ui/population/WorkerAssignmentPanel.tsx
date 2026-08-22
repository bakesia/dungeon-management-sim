import { X } from 'lucide-react'
import { useEffect } from 'react'
import { facilityDefinitionById } from '../../content/facilities/facilities'
import { raceDefinitions } from '../../content/races/races'
import { resourceDefinitionById } from '../../content/resources/resources'
import { getRoomConditionEfficiency } from '../../engine/construction/roomCondition'
import { calculateFacilityProductionMultiplier, canAdjustResidentAssignment, getAssignmentProductionBreakdown, getAvailableResidentsByRace, getFacilityLevel, getRaceRoomEfficiencyMultiplier, getRoomAssignmentCount } from '../../engine/population/assignWorkers'
import type { GameState } from '../../types/game'
import { RaceIcon } from './RaceIcon'
import { calculateDungeonDefenseBreakdown } from '../../engine/invasion/calculateDungeonDefense'
import { getRoomDisplayName } from '../facilities/roomDisplay'

interface WorkerAssignmentPanelProps {
  state: GameState
  roomId: string
  onAdjust: (instanceId: string, raceId: string, delta: 1 | -1) => boolean
  onClose: () => void
}

function formatAmount(amount: number): string { return Number.isInteger(amount) ? String(amount) : amount.toFixed(1) }

export function WorkerAssignmentPanel({ state, roomId, onAdjust, onClose }: WorkerAssignmentPanelProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])
  const room = state.dungeon.rooms[roomId]
  if (!room) return null
  const definition = facilityDefinitionById[room.definitionId]
  const level = getFacilityLevel(room)
  if (!definition || !level) return null
  const productionEffect = level.dailyEffects.find((effect) => effect.type === 'addResource')
  const conditionMultiplier = getRoomConditionEfficiency(room)
  const finalMultiplier = calculateFacilityProductionMultiplier(state, room) * conditionMultiplier
  const breakdown = productionEffect ? getAssignmentProductionBreakdown(state, room, productionEffect.amount).map((item) => ({ ...item, amount: item.amount * conditionMultiplier })) : []
  const roomResidentDefense = definition.tags.includes('combat')
    ? calculateDungeonDefenseBreakdown(state).contributions.filter((item) => item.sourceType === 'population' && item.sourceId.startsWith(`${roomId}:`)).reduce((total, item) => total + item.amount, 0)
    : null

  return <div className="assignment-overlay" role="presentation" onMouseDown={onClose}>
    <section className="assignment-panel" role="dialog" aria-modal="true" aria-labelledby="assignment-title" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><p className="eyebrow">RESIDENT ASSIGNMENT</p><h2 id="assignment-title">{getRoomDisplayName(state, room)}{definition.showLevel === false ? '' : ` · Lv.${room.level}`}</h2></div><button className="close-button" type="button" onClick={onClose} aria-label="인원 배치 닫기" autoFocus><X className="size-4" /></button></header>
      <div className="assignment-job">
        <p><strong>필요 인원</strong><span>{getRoomAssignmentCount(room)} / {level.staffSlots ?? 0}</span></p>
        <div className="assignment-races">
          {raceDefinitions.map((race) => {
            const current = getRoomAssignmentCount(room, race.id)
            const available = getAvailableResidentsByRace(state, race.id)
            const multiplier = getRaceRoomEfficiencyMultiplier(race.id, definition.tags)
            return <div className="assignment-race" key={race.id}>
              <RaceIcon iconId={race.iconId} name={race.name} size={34} />
              <div><strong>{race.name}</strong><span>대기 {available} · 시설 적성 {Math.round(multiplier * 100)}%</span></div>
              <div className="assignment-stepper"><button type="button" disabled={!canAdjustResidentAssignment(state, roomId, race.id, -1).allowed} onClick={() => onAdjust(roomId, race.id, -1)}>−</button><strong>{current}</strong><button type="button" disabled={!canAdjustResidentAssignment(state, roomId, race.id, 1).allowed} onClick={() => onAdjust(roomId, race.id, 1)}>+</button></div>
            </div>
          })}
        </div>
      </div>
      <div className="assignment-production"><p><span>인원·종족·손상 보정</span><strong>{Math.round(finalMultiplier * 100)}%</strong></p>{breakdown.map((item) => <p key={item.raceId}><span>{item.raceName} ×{item.count} · {Math.round(item.multiplier * 100)}%</span><strong>{formatAmount(item.amount)}</strong></p>)}{productionEffect && <p className="assignment-production__total"><span>예상 {resourceDefinitionById[productionEffect.resourceId]?.name ?? productionEffect.resourceId} 생산</span><strong>{productionEffect.amount >= 0 ? '+' : ''}{formatAmount(productionEffect.amount * finalMultiplier)} / DAY</strong></p>}{roomResidentDefense !== null && <p className="assignment-production__total"><span>이 시설 주민 방어 기여</span><strong>+{roomResidentDefense}</strong></p>}</div>
      <button className="primary-button assignment-done" type="button" onClick={onClose}>완료</button>
    </section>
  </div>
}
