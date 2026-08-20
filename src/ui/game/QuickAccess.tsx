import { getTotalGoldMaintenance } from '../../engine/day/processMaintenance'
import type { FeatureId } from '../../types/content'
import type { GameState } from '../../types/game'
import { getJoinedQuickAccessFeatures } from './quickAccessModel'

const featureLabels: Record<FeatureId, string> = {
  shop: '상점',
  blacksmith: '수리',
  tavern: '용병',
  mage: '마법',
  healer: '보호',
  informant: '정보',
}

interface QuickAccessProps {
  state: GameState
  onOpenFeature: (featureId: FeatureId) => void
  onOpenAll: () => void
}

export function QuickAccess({ state, onOpenFeature, onOpenAll }: QuickAccessProps) {
  const joinedFeatures = getJoinedQuickAccessFeatures(state)
  const visibleFeatures = joinedFeatures.slice(0, 3)
  const maintenance = getTotalGoldMaintenance(state)

  return (
    <div className="quick-access" aria-label="빠른 접근">
      <div className="quick-access__maintenance" title="다음 DAY에 적용되는 시설 골드 유지비">
        <span>NEXT DAY</span>
        <strong>유지비 -{maintenance}G</strong>
      </div>
      {visibleFeatures.length > 0 && (
        <nav className="quick-access__links" aria-label="합류한 협력자 기능">
          {visibleFeatures.map((featureId) => (
            <button type="button" key={featureId} onClick={() => onOpenFeature(featureId)}>
              {featureLabels[featureId]}
            </button>
          ))}
          {joinedFeatures.length > visibleFeatures.length && (
            <button type="button" onClick={onOpenAll} aria-label="모든 NPC 기능 열기">...</button>
          )}
        </nav>
      )}
    </div>
  )
}
