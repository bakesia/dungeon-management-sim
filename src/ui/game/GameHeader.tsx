import { Menu } from 'lucide-react'
import { resourceDefinitions } from '../../content/resources/resources'
import { selectPopulationCapacity, selectPopulationTotal } from '../../state/gameSelectors'
import type { GameState } from '../../types/game'
import { getFameLevel } from '../../engine/invasion/processInvasion'
import { getResourceCapacity, isResourceOverCapacity } from '../../engine/resources/resourceCapacity'
import { GameIcon } from '../icons/GameIcon'

interface GameHeaderProps {
  state: GameState
  onOpenMenu: () => void
}

export function GameHeader({ state, onOpenMenu }: GameHeaderProps) {
  const population = selectPopulationTotal(state)
  const populationCapacity = selectPopulationCapacity(state)

  return (
    <header className="game-header">
      <div className="game-header__brand" aria-label="심연의 주인">
        <span className="brand-rune" aria-hidden="true">◆</span>
        <span>심연의 주인</span>
      </div>
      <div className="day-counter"><span>DAY</span><strong>{state.day}</strong></div>
      <div className="resource-bar" aria-label="던전 자원">
        {resourceDefinitions.map((resource) => {
          const isOverCapacity = isResourceOverCapacity(state, resource.id)
          return (
            <div
              className={`resource-item${isOverCapacity ? ' is-over-capacity' : ''}`}
              key={resource.id}
              title={`${resource.name} 저장량${isOverCapacity ? ' · 저장 한도 초과: 추가 획득 불가' : ''}`}
            >
              <GameIcon iconId={resource.iconId} label={resource.name} size={20} />
              <span className="resource-item__label">{resource.shortName}</span>
              <strong>{state.resources[resource.id] ?? 0}<small>/ {getResourceCapacity(state, resource.id)}</small></strong>
              {isOverCapacity && <span className="resource-item__capacity-state">OVER</span>}
            </div>
          )
        })}
        <div className="resource-item">
          <GameIcon iconId="hud_population" label="인구" size={20} />
          <span className="resource-item__label">POP</span>
          <strong>{population}/{populationCapacity}</strong>
        </div>
        <div className="resource-item resource-item--fame" title="던전의 명성입니다. 명성이 높을수록 더 강한 침입자와 큰 보상이 등장합니다.">
          <GameIcon iconId="hud_fame" label="명성" size={20} />
          <span className="resource-item__label">명성</span>
          <strong><small>{getFameLevel(state.invasion.fame)}</small>{state.invasion.fame}</strong>
        </div>
      </div>
      <button className="menu-button" type="button" onClick={onOpenMenu} aria-label="메뉴 열기">
        <Menu className="size-4" aria-hidden="true" /> MENU
      </button>
    </header>
  )
}
