import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useGameStore } from '../../state/useGameStore'
import { DungeonMap } from '../dungeon/DungeonMap'
import { GameLog } from '../log/GameLog'
import { GameMenu } from '../menu/GameMenu'
import { GameHeader } from './GameHeader'
import { emptyBuildIntent, getReadyBuild, selectBuildFacility, selectBuildTarget } from '../build/buildIntent'
import { WorkerAssignmentPanel } from '../population/WorkerAssignmentPanel'
import { loadGamePreferences, saveGamePreferences, type GamePreferences } from '../preferences/preferences'
import { soundManager } from '../audio/soundManager'
import { getEventResultSound } from '../audio/eventResultSound'
import { eventDefinitionById } from '../../content/events/events'
import { invaderDefinitionById } from '../../content/invaders/invaders'
import { InvasionWarning } from '../invasion/InvasionWarning'
import { SpecialVisitorModal } from '../npcs/SpecialVisitorModal'
import { ResidentReplacementModal } from '../population/ResidentReplacementModal'
import type { FeatureId } from '../../types/content'
import type { MenuView } from '../menu/GameMenu'

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
  const adjustResident = useGameStore((store) => store.adjustResident)
  const purchaseShopItem = useGameStore((store) => store.purchaseShopItem)
  const hireMercenary = useGameStore((store) => store.hireMercenary)
  const recruitResident = useGameStore((store) => store.recruitResident)
  const performNpcService = useGameStore((store) => store.performNpcService)
  const repairWithBlacksmith = useGameStore((store) => store.repairWithBlacksmith)
  const chooseEvent = useGameStore((store) => store.chooseEvent)
  const applyPendingInvasion = useGameStore((store) => store.applyPendingInvasion)
  const confirmPopulationReplacement = useGameStore((store) => store.confirmPopulationReplacement)
  const declinePopulationJoin = useGameStore((store) => store.declinePopulationJoin)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuView, setMenuView] = useState<MenuView>('main')
  const [menuNpcFeature, setMenuNpcFeature] = useState<FeatureId | null>(null)
  const [buildIntent, setBuildIntent] = useState(emptyBuildIntent)
  const [saveStatus, setSaveStatus] = useState('')
  const [assignmentRoomId, setAssignmentRoomId] = useState<string | null>(null)
  const [preferences, setPreferences] = useState(loadGamePreferences)
  const warnedResolutionId = useRef<string | null>(null)
  const previousTierId = useRef<string | null>(null)
  const currentEvent = state.events.currentEventId ? eventDefinitionById[state.events.currentEventId] : undefined
  const visitorEvent = currentEvent?.tags.includes('npc_join') ? currentEvent : undefined

  const handleSave = async () => {
    setSaveStatus('저장 중...')
    const didSave = await saveGame()
    setSaveStatus(didSave ? '현재 던전을 로컬에 저장했습니다.' : '저장에 실패했습니다. 아래 오류를 확인해 주세요.')
  }

  useEffect(() => {
    const cancelBuildMode = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setBuildIntent(emptyBuildIntent)
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

  useEffect(() => {
    saveGamePreferences(preferences)
    soundManager.setEnabled(preferences.soundEnabled)
  }, [preferences])

  useEffect(() => {
    const unlockAndClick = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('button')) return
      void soundManager.unlock()
      soundManager.play('ui_click')
    }
    document.addEventListener('pointerdown', unlockAndClick)
    return () => document.removeEventListener('pointerdown', unlockAndClick)
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    const resolution = state.invasion.pendingResolution
    if (resolution && warnedResolutionId.current !== resolution.id) {
      warnedResolutionId.current = resolution.id
      soundManager.play('invasion_warning')
    }
  }, [isHydrated, state.invasion.pendingResolution])

  useEffect(() => {
    if (!isHydrated) return
    if (previousTierId.current === null) {
      previousTierId.current = state.currentTierId
      return
    }
    if (previousTierId.current !== state.currentTierId) {
      previousTierId.current = state.currentTierId
      soundManager.play('tier_up')
    }
  }, [isHydrated, state.currentTierId])

  const changePreference = (key: keyof GamePreferences, value: boolean) => {
    setPreferences((current) => ({ ...current, [key]: value }))
  }

  const performBuild = (facilityId: string, tileId: string) => {
    const built = buildFacility(facilityId, tileId)
    if (built) soundManager.play('build_complete')
    return built
  }

  const performDig = (tileId: string) => {
    const dug = digTile(tileId)
    if (dug) soundManager.play('dig')
    return dug
  }

  const handleChooseEvent = (choiceId: string) => {
    const event = state.events.currentEventId ? eventDefinitionById[state.events.currentEventId] : undefined
    const choice = event?.choices.find((item) => item.id === choiceId)
    const chosen = chooseEvent(choiceId)
    if (chosen && choice) soundManager.play(getEventResultSound(choice.effects))
    return chosen
  }

  const closeWarning = useCallback(() => {
    const result = applyPendingInvasion()
    if (result) {
      soundManager.play(result === 'win' ? 'defense_win' : 'defense_loss')
      void saveGame()
    }
  }, [applyPendingInvasion, saveGame])

  const openBuildMenu = (tileId?: string) => {
    if (tileId) setBuildIntent((current) => selectBuildTarget(current, tileId))
    setMenuView('build')
    setMenuNpcFeature(null)
    setIsMenuOpen(true)
  }

  const openMenu = (view: MenuView = 'main', npcFeature: FeatureId | null = null) => {
    setMenuView(view)
    setMenuNpcFeature(npcFeature)
    setIsMenuOpen(true)
  }

  const selectFacilityToBuild = (facilityId: string) => {
    const nextIntent = selectBuildFacility(buildIntent, facilityId)
    const request = getReadyBuild(nextIntent)
    if (request && performBuild(request.facilityId, request.targetTileId)) {
      setBuildIntent(emptyBuildIntent)
      return
    }
    setBuildIntent(nextIntent)
  }

  if (!isHydrated) {
    return <main className="game-loading"><p>던전 기록을 불러오는 중...</p></main>
  }

  return (
    <main className="game-shell">
      <GameHeader state={state} onOpenMenu={() => openMenu()} />
      <div className="game-layout">
        <DungeonMap
          state={state}
          buildModeFacilityId={buildIntent.facilityId}
          actionError={lastActionError}
          onCancelBuild={() => setBuildIntent(emptyBuildIntent)}
          onOpenBuildMenu={openBuildMenu}
          onDig={performDig}
          onBuild={performBuild}
          onUpgrade={upgradeFacility}
          onRepair={repairFacility}
          onDemolish={demolishFacility}
          onOpenAssignment={setAssignmentRoomId}
          onOpenNpcMenu={() => openMenu('npcs')}
        />
        <GameLog
          state={state}
          isAdvancingDay={isAdvancingDay}
          saveError={lastSaveError}
          actionError={lastActionError}
          onAdvanceDay={advanceDay}
          onChooseEvent={handleChooseEvent}
          typewriterEnabled={preferences.typewriterEnabled}
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
          onSelectBuild={selectFacilityToBuild}
          preferences={preferences}
          onPreferenceChange={changePreference}
          onPurchase={purchaseShopItem}
          onHire={hireMercenary}
          onRecruit={recruitResident}
          onService={performNpcService}
          onBlacksmithRepair={repairWithBlacksmith}
          initialView={menuView}
          initialNpcFeature={menuNpcFeature}
        />
      )}
      {assignmentRoomId && (
        <WorkerAssignmentPanel state={state} roomId={assignmentRoomId} onAdjust={adjustResident} onClose={() => setAssignmentRoomId(null)} />
      )}
      {state.invasion.pendingResolution && (
        <InvasionWarning
          invaderName={invaderDefinitionById[state.invasion.pendingResolution.invaderId]?.name ?? state.invasion.pendingResolution.invaderId}
          onComplete={closeWarning}
        />
      )}
      {!state.invasion.pendingResolution && state.populationJoin.pending && (
        <ResidentReplacementModal state={state} onConfirm={confirmPopulationReplacement} onDecline={declinePopulationJoin} />
      )}
      {!state.invasion.pendingResolution && !state.populationJoin.pending && visitorEvent && (
        <SpecialVisitorModal state={state} event={visitorEvent} onChoose={handleChooseEvent} />
      )}
    </main>
  )
}
