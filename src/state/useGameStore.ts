import { create } from 'zustand'
import { buildFacility as runBuildFacility, demolishFacility as runDemolishFacility, upgradeFacility as runUpgradeFacility } from '../engine/construction/facilities'
import { advanceDay as runAdvanceDay } from '../engine/day/advanceDay'
import { digTile as runDigTile } from '../engine/dungeon/digTile'
import { chooseEvent as runChooseEvent } from '../engine/events/processEvents'
import { createInitialGameState } from '../engine/game/createInitialGameState'
import { adjustWorkerAssignment as runAdjustWorkerAssignment } from '../engine/population/assignWorkers'
import { saveRepository } from '../persistence/saveRepository'
import type { GameState } from '../types/game'

interface GameStore {
  game: GameState
  isAdvancingDay: boolean
  lastSaveError: string | null
  lastActionError: string | null
  startNewGame(): void
  loadAutosave(): Promise<boolean>
  advanceDay(): Promise<void>
  saveGame(): Promise<boolean>
  digTile(tileId: string): boolean
  buildFacility(facilityId: string, tileId: string): boolean
  upgradeFacility(instanceId: string): boolean
  demolishFacility(instanceId: string): boolean
  adjustWorker(instanceId: string, jobId: string, delta: 1 | -1): boolean
  chooseEvent(choiceId: string): boolean
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: createInitialGameState(),
  isAdvancingDay: false,
  lastSaveError: null,
  lastActionError: null,

  startNewGame: () => {
    set({
      game: createInitialGameState(),
      isAdvancingDay: false,
      lastSaveError: null,
      lastActionError: null,
    })
  },

  loadAutosave: async () => {
    try {
      const loadedGame = await saveRepository.load()
      if (!loadedGame) return false
      set({ game: loadedGame, lastSaveError: null, lastActionError: null })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 불러오기 오류입니다.'
      set({ lastSaveError: `자동 저장을 불러오지 못했습니다: ${message}` })
      return false
    }
  },

  advanceDay: async () => {
    if (get().isAdvancingDay) return

    set({ isAdvancingDay: true, lastSaveError: null, lastActionError: null })
    let nextGame: GameState

    try {
      nextGame = runAdvanceDay(get().game)
      set({ game: nextGame })
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 턴 처리 오류입니다.'
      set({ isAdvancingDay: false, lastSaveError: `DAY 진행에 실패했습니다: ${message}` })
      return
    }

    try {
      await saveRepository.save(nextGame)
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 저장 오류입니다.'
      set({ lastSaveError: `DAY는 진행되었지만 자동 저장에 실패했습니다: ${message}` })
    } finally {
      set({ isAdvancingDay: false })
    }
  },

  saveGame: async () => {
    set({ lastSaveError: null })
    try {
      await saveRepository.save(get().game)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 저장 오류입니다.'
      set({ lastSaveError: `수동 저장에 실패했습니다: ${message}` })
      return false
    }
  },

  digTile: (tileId) => {
    try {
      set({ game: runDigTile(get().game, tileId), lastActionError: null })
      return true
    } catch (error) {
      set({ lastActionError: error instanceof Error ? error.message : '굴착에 실패했습니다.' })
      return false
    }
  },

  buildFacility: (facilityId, tileId) => {
    try {
      set({ game: runBuildFacility(get().game, facilityId, tileId), lastActionError: null })
      return true
    } catch (error) {
      set({ lastActionError: error instanceof Error ? error.message : '건설에 실패했습니다.' })
      return false
    }
  },

  upgradeFacility: (instanceId) => {
    try {
      set({ game: runUpgradeFacility(get().game, instanceId), lastActionError: null })
      return true
    } catch (error) {
      set({ lastActionError: error instanceof Error ? error.message : '업그레이드에 실패했습니다.' })
      return false
    }
  },

  demolishFacility: (instanceId) => {
    try {
      set({ game: runDemolishFacility(get().game, instanceId), lastActionError: null })
      return true
    } catch (error) {
      set({ lastActionError: error instanceof Error ? error.message : '철거에 실패했습니다.' })
      return false
    }
  },

  adjustWorker: (instanceId, jobId, delta) => {
    try {
      set({ game: runAdjustWorkerAssignment(get().game, instanceId, jobId, delta), lastActionError: null })
      return true
    } catch (error) {
      set({ lastActionError: error instanceof Error ? error.message : '주민 배치 변경에 실패했습니다.' })
      return false
    }
  },

  chooseEvent: (choiceId) => {
    try {
      set({ game: runChooseEvent(get().game, choiceId), lastActionError: null })
      return true
    } catch (error) {
      set({ lastActionError: error instanceof Error ? error.message : '이벤트 선택을 처리하지 못했습니다.' })
      return false
    }
  },
}))
