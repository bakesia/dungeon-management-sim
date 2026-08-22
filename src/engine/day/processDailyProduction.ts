import { facilityDefinitionById } from '../../content/facilities/facilities'
import { resourceDefinitionById } from '../../content/resources/resources'
import type { EffectDefinition, ResourceId } from '../../types/content'
import type { GameState } from '../../types/game'
import { applyEffects } from '../effects/applyEffects'
import { calculateFacilityProductionMultiplier, getFacilityLevel } from '../population/assignWorkers'
import { getRoomConditionEfficiency } from '../construction/roomCondition'
import { getOwnedArtifacts } from '../inventory/inventory'

export interface ProductionSource {
  sourceId?: string
  label: string
  resourceId: ResourceId
  amount: number
  sourceType: 'facility' | 'artifact'
}

export interface DailyProductionEstimate {
  effects: EffectDefinition[]
  resources: Record<ResourceId, number>
  sources: ProductionSource[]
}

function scaleResourceAmount(amount: number, efficiency: number): number {
  return amount >= 0 ? Math.floor(amount * efficiency) : Math.ceil(amount * efficiency)
}

export function calculateDailyProduction(state: GameState, maintenanceMultiplier = state.maintenance.efficiencyMultiplier): DailyProductionEstimate {
  const resources: Record<ResourceId, number> = {}
  const sources: ProductionSource[] = []
  const ownedArtifacts = getOwnedArtifacts(state)

  for (const room of Object.values(state.dungeon.rooms)) {
    const definition = facilityDefinitionById[room.definitionId]
    const level = getFacilityLevel(room)
    if (!definition || !level) continue
    const efficiency = calculateFacilityProductionMultiplier(state, room)
      * getRoomConditionEfficiency(room)
      * maintenanceMultiplier

    for (const effect of level.dailyEffects) {
      if (effect.type !== 'addResource') continue
      const amount = scaleResourceAmount(effect.amount, efficiency)
      if (amount === 0) continue
      resources[effect.resourceId] = (resources[effect.resourceId] ?? 0) + amount
      sources.push({ sourceId: room.instanceId, label: `${definition.name}${definition.showLevel === false ? '' : ` Lv.${room.level}`}`, resourceId: effect.resourceId, amount, sourceType: 'facility' })
    }

    if (efficiency <= 0) continue
    for (const artifact of ownedArtifacts) {
      for (const modifier of artifact.modifiers ?? []) {
        if (modifier.type !== 'productionFlatBonus' || !definition.tags.includes(modifier.targetTag)) continue
        resources[modifier.resourceId] = (resources[modifier.resourceId] ?? 0) + modifier.amount
        sources.push({ label: artifact.name, resourceId: modifier.resourceId, amount: modifier.amount, sourceType: 'artifact' })
      }
    }
  }

  const effects: EffectDefinition[] = Object.entries(resources)
    .filter(([, amount]) => amount !== 0)
    .map(([resourceId, amount]) => ({ type: 'addResource', resourceId, amount }))
  return { effects, resources, sources }
}

export function processDailyProduction(state: GameState, now = new Date(), addSummaryLog = true): GameState {
  const estimate = calculateDailyProduction(state)
  if (estimate.effects.length === 0) return state
  const resultText = Object.entries(estimate.resources).map(([resourceId, amount]) => {
    const name = resourceDefinitionById[resourceId]?.name ?? resourceId
    return `${name} ${amount >= 0 ? '+' : ''}${amount}`
  }).join(' · ')
  const artifactText = [...new Set(estimate.sources.filter((source) => source.sourceType === 'artifact').map((source) => source.label))].join(', ')

  return applyEffects(state, [
    ...estimate.effects,
    ...(addSummaryLog ? [{
      type: 'addLog' as const,
      category: 'resource' as const,
      message: `[생산 요약] ${resultText}${artifactText ? ` · 유물 효과: ${artifactText}` : ''}`,
    }] : []),
  ], now)
}
