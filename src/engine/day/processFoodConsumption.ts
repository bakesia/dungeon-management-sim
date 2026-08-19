import { raceDefinitionById } from '../../content/races/races'
import { RESOURCE_IDS } from '../../content/resources/resources'
import type { EffectDefinition } from '../../types/content'
import type { GameState } from '../../types/game'
import { applyEffects } from '../effects/applyEffects'

export function calculateFoodConsumption(state: GameState): number {
  return state.population.reduce((total, group) => {
    const race = raceDefinitionById[group.raceId]
    if (!race) {
      throw new Error(`Unknown raceId "${group.raceId}" in population group "${group.id}".`)
    }

    return total + group.count * race.foodConsumption
  }, 0)
}

export function processFoodConsumption(state: GameState, now = new Date()): GameState {
  const requiredFood = calculateFoodConsumption(state)
  if (requiredFood === 0) return state

  const availableFood = state.resources[RESOURCE_IDS.food] ?? 0
  const consumedFood = Math.min(availableFood, requiredFood)
  const effects: EffectDefinition[] = []

  if (consumedFood > 0) {
    effects.push(
      { type: 'addResource', resourceId: RESOURCE_IDS.food, amount: -consumedFood },
      {
        type: 'addLog',
        category: 'resource',
        message: `주민들이 식량을 소비했습니다. [식량 -${consumedFood}]`,
      },
    )
  }

  if (availableFood < requiredFood) {
    effects.push({
      type: 'addLog',
      category: 'warning',
      message: `식량이 ${requiredFood - availableFood} 부족합니다. 주민 피해는 아직 적용되지 않습니다.`,
    })
  }

  return applyEffects(state, effects, now)
}
