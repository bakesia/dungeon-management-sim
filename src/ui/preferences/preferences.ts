export interface GamePreferences {
  soundEnabled: boolean
  typewriterEnabled: boolean
}

export const DEFAULT_GAME_PREFERENCES: GamePreferences = {
  soundEnabled: true,
  typewriterEnabled: true,
}

const STORAGE_KEY = 'dungeon-management-sim:preferences:v1'

export function loadGamePreferences(): GamePreferences {
  if (typeof localStorage === 'undefined') return DEFAULT_GAME_PREFERENCES
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<GamePreferences>
    return {
      soundEnabled: typeof value.soundEnabled === 'boolean' ? value.soundEnabled : true,
      typewriterEnabled: typeof value.typewriterEnabled === 'boolean' ? value.typewriterEnabled : true,
    }
  } catch {
    return DEFAULT_GAME_PREFERENCES
  }
}

export function saveGamePreferences(preferences: GamePreferences): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
}
