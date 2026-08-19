import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { tierDefinitionById } from '../../content/tiers/tiers'
import { useGameStore } from '../../state/useGameStore'

export function GameOverScreen() {
  const navigate = useNavigate()
  const state = useGameStore((store) => store.game)
  const isHydrated = useGameStore((store) => store.isHydrated)
  const loadAutosave = useGameStore((store) => store.loadAutosave)
  const startNewGame = useGameStore((store) => store.startNewGame)
  const saveGame = useGameStore((store) => store.saveGame)
  const tier = tierDefinitionById[state.currentTierId]

  useEffect(() => {
    if (!isHydrated) void loadAutosave()
    else if (state.status !== 'gameOver') navigate('/game')
  }, [isHydrated, loadAutosave, navigate, state.status])

  const retry = async () => {
    startNewGame()
    await saveGame()
    navigate('/game')
  }

  if (!isHydrated) return <main className="game-loading"><p>최종 기록을 불러오는 중...</p></main>

  return (
    <main className="end-screen end-screen--game-over">
      <section className="end-panel">
        <p className="eyebrow">DUNGEON CORE LOST</p>
        <h1>GAME OVER</h1>
        <p className="end-message">던전 코어의 빛이 꺼졌습니다.</p>
        <dl className="end-statistics">
          <div><dt>도달 DAY</dt><dd>{state.day}</dd></div>
          <div><dt>최종 Tier</dt><dd>{tier?.level ?? 1} · {tier?.name ?? state.currentTierId}</dd></div>
          <div><dt>방어 성공</dt><dd>{state.statistics.successfulDefenses}</dd></div>
        </dl>
        <div className="end-actions">
          <button className="primary-button" type="button" onClick={retry}>새 던전으로 재도전</button>
          <button className="secondary-button" type="button" onClick={() => navigate('/')}>타이틀로</button>
        </div>
      </section>
    </main>
  )
}
