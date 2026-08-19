import { useMemo, useState } from 'react'
import { createInitialGameState } from './engine/game/createInitialGameState'
import { createSaveRepository } from './persistence/saveRepository'
import type { GameState } from './types/game'
import { GameScreen } from './ui/game/GameScreen'
import { StartScreen } from './ui/start/StartScreen'
import './App.css'

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const saveRepository = useMemo(() => createSaveRepository(), [])

  if (!gameState) {
    return <StartScreen onStart={() => setGameState(createInitialGameState())} />
  }

  return (
    <GameScreen
      state={gameState}
      saveRepository={saveRepository}
      onReturnToTitle={() => setGameState(null)}
    />
  )
}

export default App
