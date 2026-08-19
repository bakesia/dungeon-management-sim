import { facilityDefinitionById } from '../../content/facilities/facilities'
import { jobDefinitionById } from '../../content/jobs/jobs'
import { raceDefinitionById } from '../../content/races/races'
import type { GameState } from '../../types/game'
import { getRoomConditionEfficiency } from '../construction/roomCondition'
import { calculateFacilityEfficiency, getFacilityLevel } from '../population/assignWorkers'

export interface DefenseContribution {
  sourceType: 'population' | 'room' | 'modifier'
  sourceId: string
  label: string
  amount: number
}

export interface DungeonDefenseBreakdown {
  residentDefense: number
  facilityDefense: number
  total: number
  contributions: DefenseContribution[]
}

export function calculateDungeonDefenseBreakdown(state: GameState): DungeonDefenseBreakdown {
  const populationContributions: DefenseContribution[] = state.population.flatMap((group) => {
    const job = jobDefinitionById[group.jobId]
    const race = raceDefinitionById[group.raceId]
    const amount = Math.floor(group.count * (job?.combatContribution ?? 0) * (race?.combatModifier ?? 1))
    if (amount <= 0) return []
    return [{
      sourceType: 'population' as const,
      sourceId: group.id,
      label: `${race?.name ?? group.raceId} ${job?.name ?? group.jobId}`,
      amount,
    }]
  })

  const baseResidentDefense = populationContributions.reduce((total, item) => total + item.amount, 0)
  const modifierContributions: DefenseContribution[] = Object.values(state.dungeon.rooms).flatMap((room) => {
    const definition = facilityDefinitionById[room.definitionId]
    const level = getFacilityLevel(room)
    const effectiveness = calculateFacilityEfficiency(room) * getRoomConditionEfficiency(room)
    return (level?.modifiers ?? []).flatMap((modifier) => {
      if (modifier.type !== 'guardContributionMultiplier') return []
      const amount = Math.floor(baseResidentDefense * (modifier.value - 1) * effectiveness)
      if (amount <= 0) return []
      return [{
        sourceType: 'modifier' as const,
        sourceId: room.instanceId,
        label: `${definition?.name ?? room.definitionId} 보정${room.condition === 'damaged' ? ' (손상)' : ''}`,
        amount,
      }]
    })
  })

  const roomContributions: DefenseContribution[] = Object.values(state.dungeon.rooms).flatMap((room) => {
    const definition = facilityDefinitionById[room.definitionId]
    const level = getFacilityLevel(room)
    if (!definition || !level?.defense) return []
    const amount = Math.floor(
      level.defense * calculateFacilityEfficiency(room) * getRoomConditionEfficiency(room),
    )
    if (amount <= 0) return []
    return [{
      sourceType: 'room' as const,
      sourceId: room.instanceId,
      label: `${definition.name}${room.condition === 'damaged' ? ' (손상)' : ''}`,
      amount,
    }]
  })

  const contributions = [...populationContributions, ...modifierContributions, ...roomContributions]
  const residentDefense = [...populationContributions, ...modifierContributions].reduce((total, item) => total + item.amount, 0)
  const facilityDefense = roomContributions.reduce((total, item) => total + item.amount, 0)
  return { residentDefense, facilityDefense, total: residentDefense + facilityDefense, contributions }
}

export function calculateDungeonDefense(state: GameState): number {
  return calculateDungeonDefenseBreakdown(state).total
}
