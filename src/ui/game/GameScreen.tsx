import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useGameStore } from '../../state/useGameStore'
import { DungeonMap } from '../dungeon/DungeonMap'
import { GameLog } from '../log/GameLog'
import { GameMenu } from '../menu/GameMenu'
import { GameHeader } from './GameHeader'

export function GameScreen() {
  const navigate = useNavigate()
  const state = useGameStore((store) => store.game)
  const isAdvancingDay = useGameStore((store) => store.isAdvancingDay)
  const isHydrated = useGameStore((store) => store.isHydrated)
  const loadAutosave = useGameStore((store) => store.loadAutosave)
  const lastSaveError = useGameStore((store) => store.lastSaveError)
  const lastActionError = useGameStore((store) => store.lastActionError)
  const advanceDay = useGameStore((store) => store.advanceDay)
  const saveGame = useGameStore((store) => store.saveGame)
  const digTile = useGameStore((store) => store.digTile)
  const buildFacility = useGameStore((store) => store.buildFacility)
  const upgradeFacility = useGameStore((store) => store.upgradeFacility)
  const repairFacility = useGameStore((store) => store.repairFacility)
  const demolishFacility = useGameStore((store) => store.demolishFacility)
  const adjustWorker = useGameStore((store) => store.adjustWorker)
  const chooseEvent = useGameStore((store) => store.chooseEvent)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [buildModeFacilityId, setBuildModeFacilityId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState('')

  const handleSave = async () => {
    setSaveStatus('저장 중...')
    const didSave = await saveGame()
    setSaveStatus(didSave ? '현재 던전을 로컬에 저장했습니다.' : '저장에 실패했습니다. 아래 오류를 확인해 주세요.')
  }

  useEffect(() => {
    const cancelBuildMode = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setBuildModeFacilityId(null)
    }
    window.addEventListener('keydown', cancelBuildMode)
    return () => window.removeEventListener('keydown', cancelBuildMode)
  }, [])

  useEffect(() => {
    if (!isHydrated) void loadAutosave()
  }, [isHydrated, loadAutosave])

  useEffect(() => {
    if (state.status === 'gameOver') navigate('/game-over')
    if (state.status === 'clear') navigate('/clear')
  }, [navigate, state.status])

  if (!isHydrated) {
    return <main className="game-loading"><p>던전 기록을 불러오는 중...</p></main>
  }

  return (
    <main className="game-shell">
      <GameHeader state={state} onOpenMenu={() => setIsMenuOpen(true)} />
      <div className="game-layout">
        <DungeonMap
          state={state}
          buildModeFacilityId={buildModeFacilityId}
          actionError={lastActionError}
          onCancelBuild={() => setBuildModeFacilityId(null)}
          onOpenBuildMenu={() => setIsMenuOpen(true)}
          onDig={digTile}
          onBuild={buildFacility}
          onUpgrade={upgradeFacility}
          onRepair={repairFacility}
          onDemolish={demolishFacility}
          onAdjustWorker={adjustWorker}
        />
        <GameLog
          state={state}
          isAdvancingDay={isAdvancingDay}
          saveError={lastSaveError}
          actionError={lastActionError}
          onAdvanceDay={advanceDay}
          onChooseEvent={chooseEvent}
        />
      </div>
      {isMenuOpen && (
        <GameMenu
          state={state}
          saveStatus={saveStatus}
          saveError={lastSaveError}
          onClose={() => setIsMenuOpen(false)}
          onSave={handleSave}
          onReturnToTitle={() => navigate('/')}
          onSelectBuild={setBuildModeFacilityId}
        />
      )}
    </main>
  )
}
