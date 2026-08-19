import { ArrowLeft, Hammer, Landmark, Save, Users, UserRoundCog, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { facilityDefinitions } from '../../content/facilities/facilities'
import { tierDefinitions } from '../../content/tiers/tiers'
import { getConditionProgress } from '../../engine/conditions/conditionProgress'
import { calculateDungeonDefenseBreakdown } from '../../engine/invasion/calculateDungeonDefense'
import { getPopulationCapacity, getPopulationTotal } from '../../engine/population/populationMetrics'
import { canAfford, formatResourceCost } from '../../engine/resources/resourceCosts'
import { selectCurrentTier } from '../../state/gameSelectors'
import type { GameState } from '../../types/game'
import { PopulationOverview } from '../population/PopulationOverview'
import type { GamePreferences } from '../preferences/preferences'
import { NpcHub } from '../npcs/NpcHub'
import { getTotalGoldMaintenance } from '../../engine/day/processMaintenance'

interface GameMenuProps {
  state: GameState
  saveStatus: string
  saveError: string | null
  onClose: () => void
  onSave: () => void
  onReturnToTitle: () => void
  onSelectBuild: (facilityId: string) => void
  preferences: GamePreferences
  onPreferenceChange: (key: keyof GamePreferences, value: boolean) => void
  onPurchase: (itemId: string) => boolean
  onHire: (contractId: string) => boolean
  onService: (serviceId: string) => boolean
  onBlacksmithRepair: (instanceId: string) => boolean
}

type MenuView = 'main' | 'build' | 'population' | 'dungeon' | 'npcs'

export function GameMenu({ state, saveStatus, saveError, onClose, onSave, onReturnToTitle, onSelectBuild, preferences, onPreferenceChange, onPurchase, onHire, onService, onBlacksmithRepair }: GameMenuProps) {
  const tier = selectCurrentTier(state)
  const [view, setView] = useState<MenuView>('main')
  const defense = calculateDungeonDefenseBreakdown(state)
  const currentTierLevel = tier?.level ?? 1
  const nextTier = [...tierDefinitions].sort((a, b) => a.level - b.level).find((item) => item.level === (tier?.level ?? 1) + 1)

  const selectBuild = (facilityId: string) => {
    onSelectBuild(facilityId)
    onClose()
  }

  return (
    <motion.div
      className="menu-overlay"
      role="presentation"
      onMouseDown={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1 }}
    >
      <motion.aside
        className="game-menu"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-menu-title"
        onMouseDown={(event) => event.stopPropagation()}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ duration: 0.14, ease: 'linear' }}
      >
        <div className="game-menu__header">
          <div><p className="eyebrow">DUNGEON COMMAND</p><h2 id="game-menu-title">관리 메뉴</h2></div>
          <button className="close-button" type="button" onClick={onClose} aria-label="메뉴 닫기">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="dungeon-summary">
          <span>TIER {tier?.level ?? 1}</span><strong>{tier?.name ?? '폐던전'}</strong>
          <p>CORE HP {state.core.hp} / {state.core.maxHp}</p>
        </div>
        {view === 'main' && <nav className="menu-list" aria-label="던전 관리 기능">
          <button type="button" onClick={() => setView('build')}>
            <span className="menu-list__label"><Hammer className="size-3" aria-hidden="true" />건설</span><span>시설 선택</span>
          </button>
          <button type="button" onClick={() => setView('population')}>
            <span className="menu-list__label"><Users className="size-3" aria-hidden="true" />주민</span><span>배치 현황</span>
          </button>
          <button type="button" onClick={() => setView('dungeon')}>
            <span className="menu-list__label"><Landmark className="size-3" aria-hidden="true" />던전 정보</span><span>성장 조건</span>
          </button>
          <button type="button" onClick={() => setView('npcs')}>
            <span className="menu-list__label"><UserRoundCog className="size-3" aria-hidden="true" />NPC</span><span>거래 · 지원</span>
          </button>
          <button type="button" disabled>기록<span>준비 중</span></button>
          <button type="button" onClick={onSave}>
            <span className="menu-list__label"><Save className="size-3" aria-hidden="true" />저장</span>
            <span>DEXIE</span>
          </button>
          <button type="button" className="menu-list__danger" onClick={onReturnToTitle}>타이틀로<span>현재 화면 종료</span></button>
          <div className="preference-controls" aria-label="게임 연출 설정">
            <label><span>타이핑 효과</span><input type="checkbox" checked={preferences.typewriterEnabled} onChange={(event) => onPreferenceChange('typewriterEnabled', event.target.checked)} /><strong>{preferences.typewriterEnabled ? 'ON' : 'OFF'}</strong></label>
            <label><span>효과음</span><input type="checkbox" checked={preferences.soundEnabled} onChange={(event) => onPreferenceChange('soundEnabled', event.target.checked)} /><strong>{preferences.soundEnabled ? 'ON' : 'OFF'}</strong></label>
          </div>
        </nav>}
        {view === 'build' && (
          <section className="menu-subview">
            <button className="menu-back" type="button" onClick={() => setView('main')}><ArrowLeft className="size-3" />관리 메뉴</button>
            <h3>건설할 시설</h3>
            <p>시설을 선택한 뒤 지도에서 빈 공간을 클릭하십시오.</p>
            <div className="build-list">
              {facilityDefinitions
                .filter((facility) => facility.buildable && facility.requiredTier <= currentTierLevel + 1)
                .map((facility) => {
                  const isLocked = facility.requiredTier > currentTierLevel
                  return (
                    <button type="button" key={facility.id} onClick={() => selectBuild(facility.id)} disabled={isLocked || !canAfford(state, facility.buildCost)}>
                      <span><strong>{facility.name}</strong><small>{facility.description}</small></span>
                      <em>{isLocked ? `TIER ${facility.requiredTier} 해금` : formatResourceCost(facility.buildCost)}</em>
                    </button>
                  )
                })}
            </div>
          </section>
        )}
        {view === 'population' && (
          <section className="menu-subview">
            <button className="menu-back" type="button" onClick={() => setView('main')}><ArrowLeft className="size-3" />관리 메뉴</button>
            <h3>주민 현황</h3>
            <PopulationOverview state={state} />
            <p>시설 상세의 인원 변경 버튼에서 종족별 배치를 조정할 수 있습니다.</p>
          </section>
        )}
        {view === 'dungeon' && (
          <section className="menu-subview">
            <button className="menu-back" type="button" onClick={() => setView('main')}><ArrowLeft className="size-3" />관리 메뉴</button>
            <h3>던전 현황</h3>
            <div className="dungeon-info-grid">
              <p><span>현재 Tier</span><strong>{tier?.level ?? 1} · {tier?.name}</strong></p>
              <p><span>방</span><strong>{Object.keys(state.dungeon.rooms).length}</strong></p>
              <p><span>인구</span><strong>{getPopulationTotal(state)} / {getPopulationCapacity(state)}</strong></p>
              <p><span>Core HP</span><strong>{state.core.hp} / {state.core.maxHp}</strong></p>
              <p><span>방어 성공</span><strong>{state.statistics.successfulDefenses}</strong></p>
              <p><span>던전 방어력</span><strong>{defense.total}</strong></p>
              <p><span>시설 유지비</span><strong>골드 {getTotalGoldMaintenance(state)} / DAY</strong></p>
            </div>
            <p className="defense-breakdown">주민 {defense.residentDefense} + 시설 {defense.facilityDefense}</p>
            <h3>{nextTier ? `Tier ${nextTier.level} 승급 조건` : '최종 성장 완료'}</h3>
            {nextTier && (
              <div className="tier-requirements">
                {nextTier.requirements.map((condition, index) => {
                  const progress = getConditionProgress(state, condition)
                  return (
                    <p className={progress.met ? 'is-complete' : ''} key={`${condition.type}-${index}`}>
                      <span>[{progress.current} / {progress.target}]</span><strong>{progress.label}</strong>
                    </p>
                  )
                })}
              </div>
            )}
          </section>
        )}
        {view === 'npcs' && <section className="menu-subview"><button className="menu-back" type="button" onClick={() => setView('main')}><ArrowLeft className="size-3" />관리 메뉴</button><h3>던전의 협력자</h3><NpcHub state={state} onPurchase={onPurchase} onHire={onHire} onService={onService} onRepair={onBlacksmithRepair} /></section>}
        <p className="save-status" aria-live="polite">{(saveError ?? saveStatus) || 'DAY 종료 시 자동 저장됩니다.'}</p>
      </motion.aside>
    </motion.div>
  )
}
