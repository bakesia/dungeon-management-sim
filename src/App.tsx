import { Navigate, Route, Routes } from 'react-router'
import { GameScreen } from './ui/game/GameScreen'
import { StartScreen } from './ui/start/StartScreen'
import { ClearScreen } from './ui/end/ClearScreen'
import { GameOverScreen } from './ui/end/GameOverScreen'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<StartScreen />} />
      <Route path="/game" element={<GameScreen />} />
      <Route path="/clear" element={<ClearScreen />} />
      <Route path="/game-over" element={<GameOverScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
