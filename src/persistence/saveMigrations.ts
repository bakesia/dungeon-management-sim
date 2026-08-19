import { CURRENT_SAVE_VERSION } from '../engine/game/createInitialGameState'
import type { GameState } from '../types/game'

function hasSaveVersion(value: unknown): value is { saveVersion: number } {
  return typeof value === 'object' && value !== null && 'saveVersion' in value
}

export function migrateSaveData(value: unknown): GameState {
  if (!hasSaveVersion(value)) {
    throw new Error('세이브 버전 정보가 없습니다.')
  }

  if (value.saveVersion !== CURRENT_SAVE_VERSION) {
    throw new Error(`지원하지 않는 세이브 버전입니다: ${value.saveVersion}`)
  }

  return value as GameState
}
