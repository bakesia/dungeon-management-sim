import { Navigate, Route, Routes } from 'react-router'
import { GameScreen } from './ui/game/GameScreen'
import { StartScreen } from './ui/start/StartScreen'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<StartScreen />} />
      <Route path="/game" element={<GameScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
