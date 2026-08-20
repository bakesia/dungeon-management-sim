import { getTotalGoldMaintenance } from '../../engine/day/processMaintenance'
import { calculateDungeonDefense } from '../../engine/invasion/calculateDungeonDefense'
import type { GameState } from '../../types/game'

interface QuickAccessProps {
  state: GameState
  onOpenInventory: () => void
  onOpenStatistics: () => void
  onOpenNpcManagement: () => void
}

export function QuickAccess({ state, onOpenInventory, onOpenStatistics, onOpenNpcManagement }: QuickAccessProps) {
  const maintenance = getTotalGoldMaintenance(state)
  const defense = calculateDungeonDefense(state)

  return (
    <div className="quick-access" aria-label="빠른 접근">
      <div className="quick-access__maintenance" title="다음 DAY에 적용되는 시설 골드 유지비">
        <span>NEXT DAY</span>
        <strong>유지비 -{maintenance}G</strong>
      </div>
      <div className="quick-access__maintenance quick-access__defense" title="현재 모든 방어 기여를 합산한 수치">
        <span>DEFENSE</span><strong>방어력 {defense}</strong>
      </div>
      <button className="quick-access__manage" type="button" onClick={onOpenInventory}>인벤토리</button>
      <button className="quick-access__manage" type="button" onClick={onOpenStatistics}>통계</button>
      <button className="quick-access__manage" type="button" onClick={onOpenNpcManagement}>NPC 관리</button>
    </div>
  )
}
