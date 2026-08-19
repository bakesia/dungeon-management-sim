import { facilityDefinitionById } from '../../content/facilities/facilities'
import { resourceDefinitionById } from '../../content/resources/resources'
import type { EffectDefinition } from '../../types/content'
import type { GameState } from '../../types/game'
import { applyEffects } from '../effects/applyEffects'
import { getFacilityLevel } from '../population/assignWorkers'

export function processMaintenance(state: GameState, now = new Date()): GameState {
  return Object.values(state.dungeon.rooms).reduce((currentState, room) => {
    const definition = facilityDefinitionById[room.definitionId]
    const effects = getFacilityLevel(room)?.maintenanceEffects ?? []
    if (!definition || effects.length === 0) return currentState

    const warnings: EffectDefinition[] = effects.flatMap((effect) => {
      if (effect.type !== 'addResource' || effect.amount >= 0) return []
      const available = currentState.resources[effect.resourceId] ?? 0
      if (available >= Math.abs(effect.amount)) return []
      return [{
        type: 'addLog' as const,
        category: 'warning' as const,
        message: `${definition.name} 유지비가 부족합니다: ${resourceDefinitionById[effect.resourceId]?.name ?? effect.resourceId}`,
      }]
    })

    const resultText = effects.flatMap((effect) => {
      if (effect.type !== 'addResource') return []
      return [`${resourceDefinitionById[effect.resourceId]?.name ?? effect.resourceId} ${effect.amount}`]
    }).join(' · ')

    return applyEffects(currentState, [
      ...effects,
      { type: 'addLog', category: 'resource', message: `${definition.name} 유지비 처리. [${resultText}]` },
      ...warnings,
    ], now)
  }, state)
}
