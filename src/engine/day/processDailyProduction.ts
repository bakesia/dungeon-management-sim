import { facilityDefinitionById } from '../../content/facilities/facilities'
import { resourceDefinitionById } from '../../content/resources/resources'
import type { EffectDefinition } from '../../types/content'
import type { GameState } from '../../types/game'
import { applyEffects } from '../effects/applyEffects'
import { calculateFacilityProductionMultiplier, getFacilityLevel } from '../population/assignWorkers'
import { getRoomConditionEfficiency } from '../construction/roomCondition'
import { getActiveArtifactModifiers } from '../inventory/inventory'

function scaleEffect(effect: EffectDefinition, efficiency: number): EffectDefinition | null {
  if (effect.type !== 'addResource') return efficiency > 0 ? effect : null
  const amount = effect.amount >= 0
    ? Math.floor(effect.amount * efficiency)
    : Math.ceil(effect.amount * efficiency)
  return amount === 0 ? null : { ...effect, amount }
}

export function processDailyProduction(state: GameState, now = new Date()): GameState {
  return Object.values(state.dungeon.rooms).reduce((currentState, room) => {
    const definition = facilityDefinitionById[room.definitionId]
    const level = getFacilityLevel(room)
    if (!definition || !level || level.dailyEffects.length === 0) return currentState

    const efficiency = calculateFacilityProductionMultiplier(currentState, room)
      * getRoomConditionEfficiency(room)
      * currentState.maintenance.efficiencyMultiplier
    const effects = level.dailyEffects
      .map((effect) => scaleEffect(effect, efficiency))
      .filter((effect): effect is EffectDefinition => effect !== null)
    for (const modifier of getActiveArtifactModifiers(currentState)) {
      if (modifier.type === 'productionFlatBonus' && definition.tags.includes(modifier.targetTag) && efficiency > 0) {
        effects.push({ type: 'addResource', resourceId: modifier.resourceId, amount: modifier.amount })
      }
    }
    if (effects.length === 0) return currentState

    const resultText = effects.flatMap((effect) => {
      if (effect.type !== 'addResource') return []
      const resourceName = resourceDefinitionById[effect.resourceId]?.name ?? effect.resourceId
      return [`${resourceName} ${effect.amount >= 0 ? '+' : ''}${effect.amount}`]
    }).join(' · ')

    return applyEffects(currentState, [
      ...effects,
      {
        type: 'addLog',
        category: 'resource',
        message: `${definition.name} 생산 완료. [${resultText}] 효율 ${Math.round(efficiency * 100)}%`,
      },
    ], now)
  }, state)
}
