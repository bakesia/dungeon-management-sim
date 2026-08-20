import { ArrowLeft, Backpack, BarChart3, Hammer, Landmark, Save, Users, UserRoundCog, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { tierDefinitions } from '../../content/tiers/tiers'
import { getConditionProgress } from '../../engine/conditions/conditionProgress'
import { calculateDungeonDefenseBreakdown } from '../../engine/invasion/calculateDungeonDefense'
import { getPopulationCapacity, getPopulationTotal } from '../../engine/population/populationMetrics'
import { canAfford, formatResourceCost } from '../../engine/resources/resourceCosts'
import { selectCurrentTier } from '../../state/gameSelectors'
import type { GameState } from '../../types/game'
import type { FacilityDefinition, FeatureId } from '../../types/content'
import { PopulationOverview } from '../population/PopulationOverview'
import type { GamePreferences } from '../preferences/preferences'
import { NpcHub } from '../npcs/NpcHub'
import { getTotalGoldMaintenance } from '../../engine/day/processMaintenance'
import { resourceDefinitions } from '../../content/resources/resources'
import { getResourceCapacity, isResourceOverCapacity } from '../../engine/resources/resourceCapacity'
import { GameIcon } from '../icons/GameIcon'
import { InventoryPanel } from '../inventory/InventoryPanel'
import { StatisticsPanel } from '../statistics/StatisticsPanel'
import { canPromoteDungeon } from '../../engine/day/processProgression'
import { getConstructionMenuGroups } from '../build/constructionMenu'

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
  onSell: (itemId: string, quantity: number) => boolean
  onHire: (contractId: string) => boolean
  onRecruit: (offerId: string) => boolean
  onService: (serviceId: string) => boolean
  onBlacksmithRepair: (instanceId: string) => boolean
  onPromote: () => boolean
  initialView?: MenuView
  initialNpcFeature?: FeatureId | null
}

export type MenuView = 'main' | 'build' | 'population' | 'dungeon' | 'npcs' | 'inventory' | 'statistics'

function formatSignedAmount(amount: number): string {
  return `${amount >= 0 ? '+' : ''}${amount}`
}

function describeBuildEffects(facility: FacilityDefinition): string[] {
  const level = facility.levels[0]
  if (!level) return [facility.role]
  const effects = level.dailyEffects.flatMap((effect) => effect.type === 'addResource'
    ? [`${resourceDefinitions.find((resource) => resource.id === effect.resourceId)?.name ?? effect.resourceId} ${formatSignedAmount(effect.amount)} / DAY`]
    : [])
  if (level.populationCapacity) effects.push(`인구 수용 +${level.populationCapacity}`)
  for (const [resourceId, amount] of Object.entries(level.storageCapacity ?? {})) {
    effects.push(`${resourceDefinitions.find((resource) => resource.id === resourceId)?.name ?? resourceId} 저장 +${amount}`)
  }
  if (level.defense) effects.push(`방어력 +${level.defense}`)
  if (level.staffSlots) effects.push(`배치 인원 ${level.staffSlots}명`)
  if (level.modifiers?.length) effects.push(facility.role)
  return effects.length > 0 ? effects : [facility.role]
}

function describeMaintenance(facility: FacilityDefinition): string[] {
  const level = facility.levels[0]
  if (!level) return ['없음']
  const maintenance = level.maintenanceEffects?.flatMap((effect) => effect.type === 'addResource'
    ? [`${resourceDefinitions.find((resource) => resource.id === effect.resourceId)?.name ?? effect.resourceId} ${formatSignedAmount(effect.amount)} / DAY`]
    : []) ?? []
  if (level.goldMaintenance) maintenance.unshift(`골드 -${level.goldMaintenance} / DAY`)
  return maintenance.length > 0 ? maintenance : ['없음']
}

export function GameMenu({ state, saveStatus, saveError, onClose, onSave, onReturnToTitle, onSelectBuild, preferences, onPreferenceChange, onPurchase, onSell, onHire, onRecruit, onService, onBlacksmithRepair, onPromote, initialView = 'main', initialNpcFeature = null }: GameMenuProps) {
  const tier = selectCurrentTier(state)
  const [view, setView] = useState<MenuView>(initialView)
  const defense = calculateDungeonDefenseBreakdown(state)
  const currentTierLevel = tier?.level ?? 1
  const nextTier = [...tierDefinitions].sort((a, b) => a.level - b.level).find((item) => item.level === (tier?.level ?? 1) + 1)
  const { available: availableFacilities, locked: lockedFacilities } = getConstructionMenuGroups(currentTierLevel)

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
          <button type="button" onClick={() => setView('inventory')}><span className="menu-list__label"><Backpack className="size-3" aria-hidden="true" />인벤토리</span><span>{state.inventory.reduce((sum, entry) => sum + entry.quantity, 0)}개</span></button>
          <button type="button" onClick={() => setView('statistics')}><span className="menu-list__label"><BarChart3 className="size-3" aria-hidden="true" />통계</span><span>수급 · 방어</span></button>
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
            <h4 className="build-section-title">현재 건설 가능</h4>
            <div className="build-list">
              {availableFacilities
                .map((facility) => {
                  const canPay = canAfford(state, facility.buildCost)
                  const requirements = [
                    { met: true, label: `Tier ${facility.requiredTier}` },
                    ...facility.requirements.map((condition) => {
                      const progress = getConditionProgress(state, condition)
                      return { met: progress.met, label: `${progress.label} ${progress.current}/${progress.target}` }
                    }),
                  ]
                  const requirementsMet = requirements.every((requirement) => requirement.met)
                  return (
                    <button className="build-card" type="button" key={facility.id} onClick={() => selectBuild(facility.id)} disabled={!canPay || !requirementsMet}>
                      <span className="build-card__header">
                        <GameIcon iconId={facility.iconId} label={facility.name} size={46} />
                        <span><strong>{facility.name}</strong><small>{facility.description}</small></span>
                        <em>{!requirementsMet ? '조건 미충족' : canPay ? 'READY' : '자원 부족'}</em>
                      </span>
                      <span className="build-card__sections">
                        <span className="build-card__block"><small>건설 비용</small><strong>{formatResourceCost(facility.buildCost)}</strong></span>
                        <span className="build-card__block"><small>필요 조건</small><strong>{requirements.map((requirement) => `${requirement.met ? '[충족]' : '[미충족]'} ${requirement.label}`).join(' · ')}</strong></span>
                        <span className="build-card__block"><small>유지비</small><strong>{describeMaintenance(facility).join(' · ')}</strong></span>
                        <span className="build-card__block build-card__block--wide"><small>시설 효과</small><strong>{describeBuildEffects(facility).join(' · ')}</strong></span>
                      </span>
                    </button>
                  )
                })}
            </div>
            {lockedFacilities.length > 0 && <>
              <h4 className="build-section-title build-section-title--locked">잠긴 시설</h4>
              <div className="build-list build-list--locked">
                {lockedFacilities.map((facility) => <div className="build-card build-card--locked" key={facility.id}>
                  <span className="build-card__header"><span className="locked-facility-icon" aria-hidden="true">?</span><span><strong>???</strong><small>Tier {facility.requiredTier}에서 새로운 시설이 해금됩니다.</small></span><em>LOCKED</em></span>
                </div>)}
              </div>
            </>}
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
              <p><span>다음 DAY 예상 골드</span><strong>{state.resources.gold} → {Math.max(0, state.resources.gold - getTotalGoldMaintenance(state))}</strong></p>
            </div>
            <div className="capacity-overview">
              {resourceDefinitions.map((resource) => <p className={isResourceOverCapacity(state, resource.id) ? 'is-over-capacity' : ''} key={resource.id}>
                <GameIcon iconId={resource.iconId} size={20} /><span>{resource.name}</span><strong>{state.resources[resource.id] ?? 0} / {getResourceCapacity(state, resource.id)}</strong>
              </p>)}
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
            {nextTier && <button className="tier-promote-button" type="button" disabled={!canPromoteDungeon(state)} onClick={onPromote}>{canPromoteDungeon(state) ? `Tier ${nextTier.level} 승급` : '승급 조건 미충족'}</button>}
          </section>
        )}
        {view === 'inventory' && <section className="menu-subview"><button className="menu-back" type="button" onClick={() => setView('main')}><ArrowLeft className="size-3" />관리 메뉴</button><h3>인벤토리</h3><InventoryPanel state={state}/></section>}
        {view === 'statistics' && <section className="menu-subview"><button className="menu-back" type="button" onClick={() => setView('main')}><ArrowLeft className="size-3" />관리 메뉴</button><h3>통계</h3><StatisticsPanel state={state} /></section>}
        {view === 'npcs' && <section className="menu-subview"><button className="menu-back" type="button" onClick={() => setView('main')}><ArrowLeft className="size-3" />관리 메뉴</button><h3>던전의 협력자</h3><NpcHub state={state} initialFeature={initialNpcFeature} onPurchase={onPurchase} onSell={onSell} onHire={onHire} onRecruit={onRecruit} onService={onService} onRepair={onBlacksmithRepair} /></section>}
        <p className="save-status" aria-live="polite">{(saveError ?? saveStatus) || 'DAY 종료 시 자동 저장됩니다.'}</p>
      </motion.aside>
    </motion.div>
  )
}
