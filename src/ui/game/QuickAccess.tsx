import { getTotalGoldMaintenance } from '../../engine/day/processMaintenance'
import type { GameState } from '../../types/game'

interface QuickAccessProps {
  state: GameState
  onOpenAll: () => void
}

export function QuickAccess({ state, onOpenAll }: QuickAccessProps) {
  const maintenance = getTotalGoldMaintenance(state)

  return (
    <div className="quick-access" aria-label="빠른 접근">
      <div className="quick-access__maintenance" title="다음 DAY에 적용되는 시설 골드 유지비">
        <span>NEXT DAY</span>
        <strong>유지비 -{maintenance}G</strong>
      </div>
      <button className="quick-access__manage" type="button" onClick={onOpenAll}>던전 관리</button>
    </div>
  )
}
