import type { GameState } from './game'

export interface SaveRecord {
  slotId: string
  savedAt: number
  appVersion: string
  saveVersion: number
  gameState: GameState
}
