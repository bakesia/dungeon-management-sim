import { resourceDefinitions } from '../../content/resources/resources'
import { gameRules } from '../../content/gameRules'
import type { ResourceId } from '../../types/content'
import type { GameState } from '../../types/game'
import { applyEffect } from '../effects/applyEffects'
import { calculateFoodConsumption } from './processFoodConsumption'
import { calculateDailyProduction, type ProductionSource } from './processDailyProduction'
import { getTotalGoldMaintenance } from './processMaintenance'
import { getFacilityLevel } from '../population/assignWorkers'

export interface ExpectedResourceFlow {
  resourceId: ResourceId
  production: number
  fixedConsumption: number
  net: number
}

export interface ExpectedDailyFlow {
  resources: ExpectedResourceFlow[]
  productionSources: ProductionSource[]
  maintenanceGold: number
  foodConsumption: number
  maintenanceEfficiency: number
}

export function calculateExpectedDailyFlow(state: GameState): ExpectedDailyFlow {
  const maintenanceGold = getTotalGoldMaintenance(state)
  const maintenanceEfficiency = (state.resources.gold ?? 0) >= maintenanceGold ? 1 : gameRules.maintenance.unpaidEfficiencyMultiplier
  const production = calculateDailyProduction(state, maintenanceEfficiency)
  const foodConsumption = calculateFoodConsumption(state)
  const fixedConsumption: Record<ResourceId, number> = { gold: maintenanceGold, food: foodConsumption }

  for (const room of Object.values(state.dungeon.rooms)) {
    for (const effect of getFacilityLevel(room)?.maintenanceEffects ?? []) {
      if (effect.type !== 'addResource' || effect.amount >= 0 || effect.resourceId === 'gold') continue
      fixedConsumption[effect.resourceId] = (fixedConsumption[effect.resourceId] ?? 0) + Math.abs(effect.amount)
    }
  }

  const resources = resourceDefinitions.map((resource) => {
    const produced = production.resources[resource.id] ?? 0
    const consumed = fixedConsumption[resource.id] ?? 0
    return { resourceId: resource.id, production: produced, fixedConsumption: consumed, net: produced - consumed }
  })
  return { resources, productionSources: production.sources, maintenanceGold, foodConsumption, maintenanceEfficiency }
}

function delta(before: GameState, after: GameState, resourceId: ResourceId): number {
  return (after.resources[resourceId] ?? 0) - (before.resources[resourceId] ?? 0)
}

export function addDailyEconomySummary(
  start: GameState,
  afterMaintenance: GameState,
  afterProduction: GameState,
  afterFood: GameState,
  now = new Date(),
): GameState {
  const lines = resourceDefinitions.flatMap((resource) => {
    const maintenance = delta(start, afterMaintenance, resource.id)
    const production = delta(afterMaintenance, afterProduction, resource.id)
    const consumption = delta(afterProduction, afterFood, resource.id)
    const net = maintenance + production + consumption
    if (maintenance === 0 && production === 0 && consumption === 0) return []
    const details = [
      production !== 0 ? `${production > 0 ? '+' : ''}${production} 생산` : '',
      maintenance !== 0 ? `${maintenance > 0 ? '+' : ''}${maintenance} 유지비` : '',
      consumption !== 0 ? `${consumption > 0 ? '+' : ''}${consumption} 주민 소비` : '',
    ].filter(Boolean).join(' · ')
    return [`${resource.name}  ${details}  = ${net >= 0 ? '+' : ''}${net}`]
  })
  if (lines.length === 0) return afterFood
  return applyEffect(afterFood, { type: 'addLog', category: 'resource', message: `[오늘의 수급]\n${lines.join('\n')}` }, now)
}
