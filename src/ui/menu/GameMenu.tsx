import { ArrowLeft, Hammer, Save, Users, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { facilityDefinitions } from '../../content/facilities/facilities'
import { jobDefinitionById, jobDefinitions } from '../../content/jobs/jobs'
import { raceDefinitionById } from '../../content/races/races'
import { getAssignedWorkersByJob, getAvailableWorkersByJob, getPopulationByJob } from '../../engine/population/assignWorkers'
import { canAfford, formatResourceCost } from '../../engine/resources/resourceCosts'
import { selectCurrentTier } from '../../state/gameSelectors'
import type { GameState } from '../../types/game'

interface GameMenuProps {
  state: GameState
  saveStatus: string
  saveError: string | null
  onClose: () => void
  onSave: () => void
  onReturnToTitle: () => void
  onSelectBuild: (facilityId: string) => void
}

type MenuView = 'main' | 'build' | 'population'

export function GameMenu({ state, saveStatus, saveError, onClose, onSave, onReturnToTitle, onSelectBuild }: GameMenuProps) {
  const tier = selectCurrentTier(state)
  const [view, setView] = useState<MenuView>('main')

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
          {['던전 정보', '기록'].map((label) => (
            <button type="button" disabled key={label}>{label}<span>준비 중</span></button>
          ))}
          <button type="button" onClick={onSave}>
            <span className="menu-list__label"><Save className="size-3" aria-hidden="true" />저장</span>
            <span>DEXIE</span>
          </button>
          <button type="button" className="menu-list__danger" onClick={onReturnToTitle}>타이틀로<span>현재 화면 종료</span></button>
        </nav>}
        {view === 'build' && (
          <section className="menu-subview">
            <button className="menu-back" type="button" onClick={() => setView('main')}><ArrowLeft className="size-3" />관리 메뉴</button>
            <h3>건설할 시설</h3>
            <p>시설을 선택한 뒤 지도에서 빈 공간을 클릭하십시오.</p>
            <div className="build-list">
              {facilityDefinitions.filter((facility) => facility.buildable).map((facility) => (
                <button type="button" key={facility.id} onClick={() => selectBuild(facility.id)} disabled={!canAfford(state, facility.buildCost)}>
                  <span><strong>{facility.name}</strong><small>{facility.description}</small></span>
                  <em>{formatResourceCost(facility.buildCost)}</em>
                </button>
              ))}
            </div>
          </section>
        )}
        {view === 'population' && (
          <section className="menu-subview">
            <button className="menu-back" type="button" onClick={() => setView('main')}><ArrowLeft className="size-3" />관리 메뉴</button>
            <h3>주민 현황</h3>
            <div className="population-groups">
              {state.population.map((group) => (
                <p key={group.id}><span>{raceDefinitionById[group.raceId]?.name ?? group.raceId} · {jobDefinitionById[group.jobId]?.name ?? group.jobId}</span><strong>{group.count}명</strong></p>
              ))}
            </div>
            <h3>직업별 배치</h3>
            <div className="population-groups">
              {jobDefinitions.map((job) => (
                <p key={job.id}><span>{job.name} · 전체 {getPopulationByJob(state, job.id)}</span><strong>{getAssignedWorkersByJob(state, job.id)} 배치 / {getAvailableWorkersByJob(state, job.id)} 대기</strong></p>
              ))}
            </div>
            <p>시설을 선택하면 상세 패널의 + / − 버튼으로 주민을 배치할 수 있습니다.</p>
          </section>
        )}
        <p className="save-status" aria-live="polite">{(saveError ?? saveStatus) || 'DAY 종료 시 자동 저장됩니다.'}</p>
      </motion.aside>
    </motion.div>
  )
}
