import type { EffectDefinition } from '../../types/content'
import type { GameLogEntry, GameState } from '../../types/game'

export function applyEffects(state: GameState, effects: EffectDefinition[]): GameState {
  const nextState: GameState = {
    ...state,
    resources: { ...state.resources },
    core: { ...state.core },
    flags: [...state.flags],
    logs: [...state.logs],
    metadata: { ...state.metadata, updatedAt: new Date().toISOString() },
  }

  effects.forEach((effect, index) => {
    if (effect.type === 'resource') {
      const currentAmount = nextState.resources[effect.resourceId] ?? 0
      nextState.resources[effect.resourceId] = Math.max(0, currentAmount + effect.amount)
      return
    }

    if (effect.type === 'coreHp') {
      nextState.core.hp = Math.min(nextState.core.maxHp, Math.max(0, nextState.core.hp + effect.amount))
      return
    }

    if (effect.type === 'flag') {
      const flags = new Set(nextState.flags)
      if (effect.operation === 'add') flags.add(effect.flag)
      else flags.delete(effect.flag)
      nextState.flags = [...flags]
      return
    }

    const logEntry: GameLogEntry = {
      id: `effect-${state.day}-${state.logs.length + index}`,
      day: state.day,
      message: effect.message,
      tone: effect.tone ?? 'default',
    }
    nextState.logs.push(logEntry)
  })

  return nextState
}
