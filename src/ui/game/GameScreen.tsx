import { useState } from 'react'
import type { SaveRepository } from '../../persistence/saveRepository'
import type { GameState } from '../../types/game'
import { DungeonMap } from '../dungeon/DungeonMap'
import { GameLog } from '../log/GameLog'
import { GameMenu } from '../menu/GameMenu'
import { GameHeader } from './GameHeader'

interface GameScreenProps {
  state: GameState
  saveRepository: SaveRepository
  onReturnToTitle: () => void
}

export function GameScreen({ state, saveRepository, onReturnToTitle }: GameScreenProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')

  const handleSave = async () => {
    setSaveStatus('저장 중...')
    try {
      await saveRepository.save(state)
      setSaveStatus('현재 던전을 로컬에 저장했습니다.')
    } catch {
      setSaveStatus('저장하지 못했습니다. 브라우저 저장소 권한을 확인해 주세요.')
    }
  }

  return (
    <main className="game-shell">
      <GameHeader state={state} onOpenMenu={() => setIsMenuOpen(true)} />
      <div className="game-layout"><DungeonMap state={state} /><GameLog state={state} /></div>
      {isMenuOpen && (
        <GameMenu state={state} saveStatus={saveStatus} onClose={() => setIsMenuOpen(false)} onSave={handleSave} onReturnToTitle={onReturnToTitle} />
      )}
    </main>
  )
}
