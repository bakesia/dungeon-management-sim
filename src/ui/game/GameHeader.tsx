import { Menu } from 'lucide-react'
import { resourceDefinitions } from '../../content/resources/resources'
import { selectPopulationCapacity, selectPopulationTotal } from '../../state/gameSelectors'
import type { GameState } from '../../types/game'
import { getThreatLevel } from '../../engine/invasion/processInvasion'

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
        {resourceDefinitions.map((resource) => (
          <div className="resource-item" key={resource.id}>
            <span className="resource-item__dot" style={{ backgroundColor: resource.color }} />
            <span className="resource-item__label">{resource.shortName}</span>
            <strong>{state.resources[resource.id] ?? 0}</strong>
          </div>
        ))}
        <div className="resource-item">
          <span className="resource-item__dot resource-item__dot--population" />
          <span className="resource-item__label">POP</span>
          <strong>{population}/{populationCapacity}</strong>
        </div>
        <div className="resource-item resource-item--threat" title="100에 도달하면 침입이 강제로 발생합니다.">
          <span className="resource-item__dot resource-item__dot--threat" />
          <span className="resource-item__label">위협</span>
          <strong><small>{getThreatLevel(state.invasion.threat)}</small>{state.invasion.threat}/100</strong>
        </div>
      </div>
      <button className="menu-button" type="button" onClick={onOpenMenu} aria-label="메뉴 열기">
        <Menu className="size-4" aria-hidden="true" /> MENU
      </button>
    </header>
  )
}
