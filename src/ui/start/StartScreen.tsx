import { useNavigate } from 'react-router'
import { APP_VERSION } from '../../app/version'
import { useGameStore } from '../../state/useGameStore'

export function StartScreen() {
  const navigate = useNavigate()
  const startNewGame = useGameStore((store) => store.startNewGame)

  const handleStart = () => {
    startNewGame()
    navigate('/game')
  }

  return (
    <main className="start-screen">
      <div className="start-screen__mist" aria-hidden="true" />
      <section className="start-card" aria-labelledby="game-title">
        <div className="core-mark" aria-hidden="true"><span /></div>
        <p className="eyebrow">DUNGEON MANAGEMENT SIMULATION</p>
        <h1 id="game-title">심연의 주인</h1>
        <p className="start-card__subtitle">잠든 코어를 깨우고, 잊힌 폐던전을 다시 일으키십시오.</p>
        <button className="primary-button start-card__button" type="button" onClick={handleStart}>
          새 던전 시작
        </button>
        <p className="version-label">FOUNDATION BUILD · v{APP_VERSION}</p>
      </section>
    </main>
  )
}
