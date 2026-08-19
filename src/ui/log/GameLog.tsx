import type { GameState } from '../../types/game'

interface GameLogProps { state: GameState }

export function GameLog({ state }: GameLogProps) {
  return (
    <section className="log-panel" aria-labelledby="game-log-title">
      <div className="panel-heading panel-heading--log">
        <div><p className="eyebrow">DUNGEON CHRONICLE</p><h2 id="game-log-title">진행 기록</h2></div>
        <span className="live-indicator"><i />LIVE</span>
      </div>
      <div className="game-log" role="log" aria-live="polite">
        <div className="day-divider"><span>&gt; DAY {state.day}</span></div>
        {state.logs.map((entry) => (
          <article className={`log-entry log-entry--${entry.tone}`} key={entry.id}>
            <span className="log-entry__prompt">›</span><p>{entry.message}</p>
          </article>
        ))}
        <div className="log-cursor" aria-hidden="true">_</div>
      </div>
      <footer className="turn-controls">
        <div><span>현재 단계</span><strong>던전 정비</strong></div>
        <button className="primary-button" type="button" disabled title="일일 정산 엔진은 다음 단계에서 구현됩니다.">다음 날 준비 중</button>
      </footer>
    </section>
  )
}
