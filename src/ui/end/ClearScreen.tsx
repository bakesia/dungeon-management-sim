import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useGameStore } from '../../state/useGameStore'
import { selectPopulationTotal } from '../../state/gameSelectors'

export function ClearScreen() {
  const navigate = useNavigate()
  const state = useGameStore((store) => store.game)
  const isHydrated = useGameStore((store) => store.isHydrated)
  const loadAutosave = useGameStore((store) => store.loadAutosave)
  const continueAfterClear = useGameStore((store) => store.continueAfterClear)

  const continueGame = async () => {
    if (await continueAfterClear()) navigate('/game')
  }

  useEffect(() => {
    if (!isHydrated) void loadAutosave()
    else if (state.status !== 'clear') navigate('/game')
  }, [isHydrated, loadAutosave, navigate, state.status])

  if (!isHydrated) return <main className="game-loading"><p>완료 기록을 불러오는 중...</p></main>

  return (
    <main className="end-screen end-screen--clear">
      <section className="end-panel">
        <p className="eyebrow">DUNGEON COMPLETE</p>
        <h1>v0.1 CLEAR</h1>
        <p className="end-message">폐허에서 시작한 던전이 거대 던전으로 성장했습니다.</p>
        <dl className="end-statistics">
          <div><dt>완료 DAY</dt><dd>{state.day}</dd></div>
          <div><dt>최종 인구</dt><dd>{selectPopulationTotal(state)}</dd></div>
          <div><dt>보유 방</dt><dd>{Object.keys(state.dungeon.rooms).length}</dd></div>
          <div><dt>방어 성공</dt><dd>{state.statistics.successfulDefenses}</dd></div>
          <div><dt>Gold</dt><dd>{state.resources.gold}</dd></div>
          <div><dt>Mana</dt><dd>{state.resources.mana}</dd></div>
        </dl>
        <div className="end-actions">
          <button className="secondary-button" type="button" onClick={continueGame}>계속 운영</button>
          <button className="primary-button" type="button" onClick={() => navigate('/')}>타이틀로</button>
        </div>
      </section>
    </main>
  )
}
