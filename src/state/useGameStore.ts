import { create } from 'zustand'
import { buildFacility as runBuildFacility, demolishFacility as runDemolishFacility, upgradeFacility as runUpgradeFacility } from '../engine/construction/facilities'
import { advanceDay as runAdvanceDay } from '../engine/day/advanceDay'
import { digTile as runDigTile } from '../engine/dungeon/digTile'
import { chooseEvent as runChooseEvent } from '../engine/events/processEvents'
import { createInitialGameState } from '../engine/game/createInitialGameState'
import { adjustResidentAssignment as runAdjustResidentAssignment } from '../engine/population/assignWorkers'
import { hireMercenary as runHireMercenary, performNpcService as runNpcService, purchaseShopItem as runPurchaseShopItem, repairWithBlacksmith as runRepairWithBlacksmith } from '../engine/npcs/npcServices'
import { repairFacility as runRepairFacility } from '../engine/construction/repairFacility'
import { continueAfterClear as runContinueAfterClear, processProgression as runProcessProgression } from '../engine/day/processProgression'
import { applyInvasionResolution as runApplyInvasionResolution } from '../engine/invasion/processInvasion'
import { confirmPopulationReplacement as runConfirmPopulationReplacement, declinePopulationJoin as runDeclinePopulationJoin } from '../engine/population/residentReplacement'
import { saveRepository } from '../persistence/saveRepository'
import type { GameState } from '../types/game'

interface GameStore {
  game: GameState
  isAdvancingDay: boolean
  isHydrated: boolean
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
  adjustResident(instanceId: string, raceId: string, delta: 1 | -1): boolean
  purchaseShopItem(itemId: string): boolean
  hireMercenary(contractId: string): boolean
  performNpcService(serviceId: string): boolean
  repairWithBlacksmith(instanceId: string): boolean
  chooseEvent(choiceId: string): boolean
  applyPendingInvasion(): 'win' | 'loss' | null
  confirmPopulationReplacement(removals: Record<string, number>): boolean
  declinePopulationJoin(): void
  repairFacility(instanceId: string): boolean
  continueAfterClear(): Promise<boolean>
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: createInitialGameState(),
  isAdvancingDay: false,
  isHydrated: false,
  lastSaveError: null,
  lastActionError: null,

  startNewGame: () => {
    set({
      game: createInitialGameState(),
      isAdvancingDay: false,
      isHydrated: true,
      lastSaveError: null,
      lastActionError: null,
    })
  },

  loadAutosave: async () => {
    try {
      const loadedGame = await saveRepository.load()
      if (!loadedGame) {
        set({ isHydrated: true })
        return false
      }
      set({ game: loadedGame, isHydrated: true, lastSaveError: null, lastActionError: null })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 불러오기 오류입니다.'
      set({ isHydrated: true, lastSaveError: `자동 저장을 불러오지 못했습니다: ${message}` })
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

  adjustResident: (instanceId, raceId, delta) => {
    try {
      set({ game: runAdjustResidentAssignment(get().game, instanceId, raceId, delta), lastActionError: null })
      return true
    } catch (error) {
      set({ lastActionError: error instanceof Error ? error.message : '주민 배치 변경에 실패했습니다.' })
      return false
    }
  },

  purchaseShopItem: (itemId) => {
    try { set({ game: runPurchaseShopItem(get().game, itemId), lastActionError: null }); return true }
    catch (error) { set({ lastActionError: error instanceof Error ? error.message : '구매에 실패했습니다.' }); return false }
  },

  hireMercenary: (contractId) => {
    try { set({ game: runHireMercenary(get().game, contractId), lastActionError: null }); return true }
    catch (error) { set({ lastActionError: error instanceof Error ? error.message : '용병 고용에 실패했습니다.' }); return false }
  },

  performNpcService: (serviceId) => {
    try { set({ game: runNpcService(get().game, serviceId), lastActionError: null }); return true }
    catch (error) { set({ lastActionError: error instanceof Error ? error.message : 'NPC 지원을 이용하지 못했습니다.' }); return false }
  },

  repairWithBlacksmith: (instanceId) => {
    try { set({ game: runRepairWithBlacksmith(get().game, instanceId), lastActionError: null }); return true }
    catch (error) { set({ lastActionError: error instanceof Error ? error.message : '대장간 수리에 실패했습니다.' }); return false }
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

  applyPendingInvasion: () => {
    const current = get().game
    const resolution = current.invasion.pendingResolution
    if (!resolution) return null
    set({ game: runProcessProgression(runApplyInvasionResolution(current, resolution)), lastActionError: null })
    return resolution.success ? 'win' : 'loss'
  },

  confirmPopulationReplacement: (removals) => {
    try {
      set({ game: runConfirmPopulationReplacement(get().game, removals), lastActionError: null })
      return true
    } catch (error) {
      set({ lastActionError: error instanceof Error ? error.message : '주민 교체에 실패했습니다.' })
      return false
    }
  },

  declinePopulationJoin: () => {
    set({ game: runDeclinePopulationJoin(get().game), lastActionError: null })
  },

  repairFacility: (instanceId) => {
    try {
      set({ game: runRepairFacility(get().game, instanceId), lastActionError: null })
      return true
    } catch (error) {
      set({ lastActionError: error instanceof Error ? error.message : '시설 수리에 실패했습니다.' })
      return false
    }
  },

  continueAfterClear: async () => {
    try {
      const game = runContinueAfterClear(get().game)
      set({ game, lastActionError: null })
      await saveRepository.save(game)
      return true
    } catch (error) {
      set({ lastActionError: error instanceof Error ? error.message : '계속 운영 상태를 저장하지 못했습니다.' })
      return false
    }
  },
}))
