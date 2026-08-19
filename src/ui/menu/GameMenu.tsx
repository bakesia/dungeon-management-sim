import { selectCurrentTier } from '../../state/gameSelectors'
import type { GameState } from '../../types/game'

interface GameMenuProps {
  state: GameState
  saveStatus: string
  onClose: () => void
  onSave: () => void
  onReturnToTitle: () => void
}

export function GameMenu({ state, saveStatus, onClose, onSave, onReturnToTitle }: GameMenuProps) {
  const tier = selectCurrentTier(state)

  return (
    <div className="menu-overlay" role="presentation" onMouseDown={onClose}>
      <aside className="game-menu" role="dialog" aria-modal="true" aria-labelledby="game-menu-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="game-menu__header">
          <div><p className="eyebrow">DUNGEON COMMAND</p><h2 id="game-menu-title">관리 메뉴</h2></div>
          <button className="close-button" type="button" onClick={onClose} aria-label="메뉴 닫기">×</button>
        </div>
        <div className="dungeon-summary">
          <span>TIER {tier?.level ?? 1}</span><strong>{tier?.name ?? '폐던전'}</strong>
          <p>CORE HP {state.core.hp} / {state.core.maxHp}</p>
        </div>
        <nav className="menu-list" aria-label="던전 관리 기능">
          {['건설', '주민', '던전 정보', '기록'].map((label) => (
            <button type="button" disabled key={label}>{label}<span>준비 중</span></button>
          ))}
          <button type="button" onClick={onSave}>저장<span>IndexedDB</span></button>
          <button type="button" className="menu-list__danger" onClick={onReturnToTitle}>타이틀로<span>현재 화면 종료</span></button>
        </nav>
        <p className="save-status" aria-live="polite">{saveStatus || 'DAY 종료 시 자동 저장은 일일 정산 구현 후 연결됩니다.'}</p>
      </aside>
    </div>
  )
}
