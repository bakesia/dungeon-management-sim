import { facilityDefinitionById } from '../../content/facilities/facilities'
import { raceDefinitionById } from '../../content/races/races'
import type { GameState } from '../../types/game'
import { getRoomConditionEfficiency } from '../construction/roomCondition'
import { calculateFacilityEfficiency, getFacilityLevel, getRaceCombatMultiplier } from '../population/assignWorkers'
import { getActiveArtifactModifiers } from '../inventory/inventory'

export const RESIDENT_BASE_COMBAT = 6

export interface DefenseContribution {
  sourceType: 'population' | 'room' | 'modifier' | 'mercenary'
  sourceId: string
  label: string
  amount: number
}

export interface DungeonDefenseBreakdown {
  residentDefense: number
  facilityDefense: number
  mercenaryDefense: number
  modifierDefense: number
  total: number
  contributions: DefenseContribution[]
}

export function calculateDungeonDefenseBreakdown(state: GameState): DungeonDefenseBreakdown {
  const maintenanceMultiplier = state.maintenance.efficiencyMultiplier
  const residentContributions: DefenseContribution[] = Object.values(state.dungeon.rooms).flatMap((room) => {
    const definition = facilityDefinitionById[room.definitionId]
    if (!definition?.tags.includes('combat')) return []
    const roomMultiplier = (getFacilityLevel(room)?.modifiers ?? []).reduce(
      (value, modifier) => modifier.type === 'combatContributionMultiplier' ? value * modifier.value : value,
      1,
    )
    const conditionMultiplier = getRoomConditionEfficiency(room)
    return room.residentAssignments.flatMap((assignment) => {
      const amount = Math.floor(assignment.count * RESIDENT_BASE_COMBAT * getRaceCombatMultiplier(assignment.raceId) * roomMultiplier * conditionMultiplier * maintenanceMultiplier)
      if (amount <= 0) return []
      return [{ sourceType: 'population' as const, sourceId: `${room.instanceId}:${assignment.raceId}`, label: `${raceDefinitionById[assignment.raceId]?.name ?? assignment.raceId} · ${definition.name}`, amount }]
    })
  })

  const roomContributions: DefenseContribution[] = Object.values(state.dungeon.rooms).flatMap((room) => {
    const definition = facilityDefinitionById[room.definitionId]
    const level = getFacilityLevel(room)
    if (!definition || !level?.defense) return []
    const amount = Math.floor(level.defense * calculateFacilityEfficiency(room) * getRoomConditionEfficiency(room) * maintenanceMultiplier)
    return amount > 0 ? [{ sourceType: 'room' as const, sourceId: room.instanceId, label: `${definition.name}${room.condition === 'damaged' ? ' (손상)' : ''}`, amount }] : []
  })

  const mercenaryContributions: DefenseContribution[] = state.activeMercenaries
    .filter((contract) => state.day < contract.expiresOnDay)
    .map((contract) => ({ sourceType: 'mercenary' as const, sourceId: contract.contractId, label: `용병 · ${contract.contractId}`, amount: Math.floor(contract.combatPower * maintenanceMultiplier) }))

  const subtotal = [...residentContributions, ...roomContributions, ...mercenaryContributions].reduce((total, item) => total + item.amount, 0)
  const artifactModifiers = getActiveArtifactModifiers(state)
  const flatDefense = state.timedModifiers.filter((modifier) => modifier.type === 'flatDefense' && (!modifier.expiresOnDay || state.day < modifier.expiresOnDay)).reduce((total, modifier) => total + modifier.value, 0)
    + artifactModifiers.reduce((total, modifier) => modifier.type === 'flatDefense' ? total + modifier.amount : total, 0)
  const defenseMultiplier = state.timedModifiers.filter((modifier) => modifier.type === 'defenseMultiplier' && (!modifier.expiresOnDay || state.day < modifier.expiresOnDay)).reduce((value, modifier) => value * modifier.value, 1)
    * artifactModifiers.reduce((value, modifier) => modifier.type === 'defenseMultiplier' ? value * modifier.value : value, 1)
  const modifierAmount = Math.floor((subtotal + flatDefense) * defenseMultiplier) - subtotal
  const modifierContributions: DefenseContribution[] = modifierAmount > 0 ? [{ sourceType: 'modifier', sourceId: 'active-defense-modifiers', label: '지원 효과', amount: modifierAmount }] : []

  const residentDefense = residentContributions.reduce((total, item) => total + item.amount, 0)
  const facilityDefense = roomContributions.reduce((total, item) => total + item.amount, 0)
  const mercenaryDefense = mercenaryContributions.reduce((total, item) => total + item.amount, 0)
  const contributions = [...residentContributions, ...roomContributions, ...mercenaryContributions, ...modifierContributions]
  return { residentDefense, facilityDefense, mercenaryDefense, modifierDefense: modifierAmount, total: subtotal + modifierAmount, contributions }
}

export function calculateDungeonDefense(state: GameState): number {
  return calculateDungeonDefenseBreakdown(state).total
}
