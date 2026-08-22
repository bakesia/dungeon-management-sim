import { resourceDefinitionById } from '../../content/resources/resources'
import { calculateExpectedDailyFlow } from '../../engine/day/dailyEconomy'
import { aggregateDefenseContributions, calculateDungeonDefenseBreakdown } from '../../engine/invasion/calculateDungeonDefense'
import { getFameLevel } from '../../engine/invasion/processInvasion'
import { getPopulationCapacity, getPopulationTotal } from '../../engine/population/populationMetrics'
import type { GameState } from '../../types/game'
import { getRoomDisplayName } from '../facilities/roomDisplay'

function signed(value: number): string {
  return `${value >= 0 ? '+' : ''}${value}`
}

export function StatisticsPanel({ state }: { state: GameState }) {
  const flow = calculateExpectedDailyFlow(state)
  const defense = calculateDungeonDefenseBreakdown(state)
  const defenseGroups = aggregateDefenseContributions(defense.contributions)
  const artifactProduction = flow.productionSources.filter((source) => source.sourceType === 'artifact')
  const goldProduction = flow.productionSources.filter((source) => source.sourceType === 'facility' && source.resourceId === 'gold')

  return <div className="statistics-panel">
    <p className="statistics-note">현재 시설·배치 기준 예상 고정 수급입니다. 이벤트, 침입, NPC 거래는 포함하지 않습니다.</p>
    {flow.maintenanceEfficiency < 1 && <p className="statistics-warning">현재 골드로 유지비 전액을 낼 수 없어 다음 DAY 생산·방어 효율 50%가 예상됩니다.</p>}
    <div className="statistics-flow">
      <div className="statistics-flow__header"><span>자원</span><span>생산</span><span>고정 소비</span><strong>순수급</strong></div>
      {flow.resources.map((entry) => <div key={entry.resourceId}>
        <span>{resourceDefinitionById[entry.resourceId]?.name ?? entry.resourceId}</span>
        <span>{signed(entry.production)}</span><span>{entry.fixedConsumption ? `-${entry.fixedConsumption}` : '0'}</span>
        <strong className={entry.net < 0 ? 'is-negative' : ''}>{signed(entry.net)}</strong>
      </div>)}
    </div>
    {artifactProduction.length > 0 && <div className="statistics-sources"><strong>유물 생산 효과</strong>{artifactProduction.map((source, index) => <span key={`${source.label}-${source.resourceId}-${index}`}>{source.label} · {resourceDefinitionById[source.resourceId]?.name} +{source.amount}</span>)}</div>}
    {goldProduction.length > 0 && <div className="statistics-sources"><strong>골드 생산 내역</strong>{goldProduction.map((source, index) => {
      const room = source.sourceId ? state.dungeon.rooms[source.sourceId] : undefined
      return <span key={`${source.sourceId ?? source.label}-${index}`}>{room ? getRoomDisplayName(state, room) : source.label} · 골드 +{source.amount}</span>
    })}</div>}
    <div className="statistics-summary">
      <p><span>인구</span><strong>{getPopulationTotal(state)} / {getPopulationCapacity(state)}</strong></p>
      <p><span>총 방어력</span><strong>{defense.total}</strong></p>
      <p><span>악명</span><strong>{state.invasion.fame} · {getFameLevel(state.invasion.fame)}</strong></p>
    </div>
    <h4>방어 기여</h4>
    <div className="statistics-defense">
      {defenseGroups.length > 0 ? defenseGroups.map((entry) => <p key={entry.label}><span>{entry.label}</span><strong>+{entry.amount}</strong></p>) : <p><span>방어 기여 없음</span><strong>0</strong></p>}
      <p className="statistics-defense__total"><span>총 방어력</span><strong>{defense.total}</strong></p>
    </div>
  </div>
}
