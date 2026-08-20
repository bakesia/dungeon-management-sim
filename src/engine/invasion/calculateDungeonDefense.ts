import { facilityDefinitionById } from '../../content/facilities/facilities'
import { raceDefinitionById } from '../../content/races/races'
import type { GameState } from '../../types/game'
import { getRoomConditionEfficiency } from '../construction/roomCondition'
import { calculateFacilityEfficiency, getFacilityLevel, getRaceCombatMultiplier } from '../population/assignWorkers'
import { getActiveArtifactModifiers } from '../inventory/inventory'

export const RESIDENT_BASE_COMBAT = 6

export interface DefenseContribution {
  sourceType: 'population' | 'room' | 'temporary' | 'artifact' | 'mercenary'
  sourceId: string
  label: string
  amount: number
  category: 'resident' | 'guard' | 'trap' | 'gate' | 'facility' | 'mercenary' | 'temporary' | 'artifact'
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
      return [{ sourceType: 'population' as const, sourceId: `${room.instanceId}:${assignment.raceId}`, label: `${raceDefinitionById[assignment.raceId]?.name ?? assignment.raceId} · ${definition.name}`, amount, category: 'resident' as const }]
    })
  })

  const roomContributions: DefenseContribution[] = Object.values(state.dungeon.rooms).flatMap((room) => {
    const definition = facilityDefinitionById[room.definitionId]
    const level = getFacilityLevel(room)
    if (!definition || !level?.defense) return []
    const amount = Math.floor(level.defense * calculateFacilityEfficiency(room) * getRoomConditionEfficiency(room) * maintenanceMultiplier)
    const category = definition.id === 'guard_post' ? 'guard' : definition.id === 'trap_room' ? 'trap' : definition.id === 'reinforced_gate' ? 'gate' : 'facility'
    return amount > 0 ? [{ sourceType: 'room' as const, sourceId: room.instanceId, label: `${definition.name}${room.condition === 'damaged' ? ' (손상)' : ''}`, amount, category }] : []
  })

  const mercenaryContributions: DefenseContribution[] = state.activeMercenaries
    .filter((contract) => state.day < contract.expiresOnDay)
    .map((contract) => ({ sourceType: 'mercenary' as const, sourceId: contract.contractId, label: `용병 · ${contract.contractId}`, amount: Math.floor(contract.combatPower * maintenanceMultiplier), category: 'mercenary' as const }))

  const subtotal = [...residentContributions, ...roomContributions, ...mercenaryContributions].reduce((total, item) => total + item.amount, 0)
  const artifactModifiers = getActiveArtifactModifiers(state)
  const timedFlat = state.timedModifiers.filter((modifier) => modifier.type === 'flatDefense' && (!modifier.expiresOnDay || state.day < modifier.expiresOnDay)).reduce((total, modifier) => total + modifier.value, 0)
  const artifactFlat = artifactModifiers.reduce((total, modifier) => modifier.type === 'flatDefense' ? total + modifier.amount : total, 0)
  const timedMultiplier = state.timedModifiers.filter((modifier) => modifier.type === 'defenseMultiplier' && (!modifier.expiresOnDay || state.day < modifier.expiresOnDay)).reduce((value, modifier) => value * modifier.value, 1)
  const artifactMultiplier = artifactModifiers.reduce((value, modifier) => modifier.type === 'defenseMultiplier' ? value * modifier.value : value, 1)
  const modifierAmount = Math.floor((subtotal + timedFlat + artifactFlat) * timedMultiplier * artifactMultiplier) - subtotal
  const timedWeight = timedFlat + Math.max(0, subtotal * (timedMultiplier - 1))
  const artifactWeight = artifactFlat + Math.max(0, subtotal * (artifactMultiplier - 1))
  const combinedWeight = timedWeight + artifactWeight
  const artifactAmount = combinedWeight > 0 ? Math.floor(modifierAmount * artifactWeight / combinedWeight) : 0
  const timedAmount = modifierAmount - artifactAmount
  const modifierContributions: DefenseContribution[] = [
    ...(timedAmount > 0 ? [{ sourceType: 'temporary' as const, sourceId: 'active-temporary-defense', label: '임시 지원', amount: timedAmount, category: 'temporary' as const }] : []),
    ...(artifactAmount > 0 ? [{ sourceType: 'artifact' as const, sourceId: 'active-defense-artifacts', label: '유물', amount: artifactAmount, category: 'artifact' as const }] : []),
  ]

  const residentDefense = residentContributions.reduce((total, item) => total + item.amount, 0)
  const facilityDefense = roomContributions.reduce((total, item) => total + item.amount, 0)
  const mercenaryDefense = mercenaryContributions.reduce((total, item) => total + item.amount, 0)
  const contributions = [...residentContributions, ...roomContributions, ...mercenaryContributions, ...modifierContributions]
  return { residentDefense, facilityDefense, mercenaryDefense, modifierDefense: modifierAmount, total: subtotal + modifierAmount, contributions }
}

const defenseCategoryLabels: Record<DefenseContribution['category'], string> = {
  resident: '주민 전투력', guard: '경비실', trap: '함정', gate: '강화 관문', facility: '기타 시설',
  mercenary: '용병', temporary: '임시 보강', artifact: '유물',
}

export function aggregateDefenseContributions(contributions: DefenseContribution[]): Array<{ label: string; amount: number }> {
  const totals = new Map<DefenseContribution['category'], number>()
  for (const contribution of contributions) totals.set(contribution.category, (totals.get(contribution.category) ?? 0) + contribution.amount)
  return [...totals.entries()].filter(([, amount]) => amount > 0).map(([category, amount]) => ({ label: defenseCategoryLabels[category], amount }))
}

export function calculateDungeonDefense(state: GameState): number {
  return calculateDungeonDefenseBreakdown(state).total
}
