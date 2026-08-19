import type { ConditionDefinition, EffectDefinition } from '../types/content'
import { eventDefinitions } from './events/events'
import { facilityDefinitions } from './facilities/facilities'
import { initialFacilityPlacements, initialPopulationGroups } from './initialGame'
import { jobDefinitions } from './jobs/jobs'
import { raceDefinitions } from './races/races'
import { resourceDefinitions } from './resources/resources'
import { tierDefinitions } from './tiers/tiers'

function findDuplicateIds(label: string, ids: string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  ids.forEach((id) => {
    if (seen.has(id)) duplicates.add(id)
    seen.add(id)
  })

  return [...duplicates].map((id) => `Duplicate ${label} id "${id}".`)
}

export function validateContent(): void {
  const errors = [
    ...findDuplicateIds('resource', resourceDefinitions.map((item) => item.id)),
    ...findDuplicateIds('race', raceDefinitions.map((item) => item.id)),
    ...findDuplicateIds('job', jobDefinitions.map((item) => item.id)),
    ...findDuplicateIds('facility', facilityDefinitions.map((item) => item.id)),
    ...findDuplicateIds('event', eventDefinitions.map((item) => item.id)),
    ...findDuplicateIds('tier', tierDefinitions.map((item) => item.id)),
  ]

  const resourceIds = new Set(resourceDefinitions.map((item) => item.id))
  const raceIds = new Set(raceDefinitions.map((item) => item.id))
  const jobIds = new Set(jobDefinitions.map((item) => item.id))
  const facilityIds = new Set(facilityDefinitions.map((item) => item.id))

  const validateEffect = (effect: EffectDefinition, source: string) => {
    if (effect.type === 'addResource' && !resourceIds.has(effect.resourceId)) {
      errors.push(`Unknown resourceId "${effect.resourceId}" referenced by ${source}.`)
    }
    if ((effect.type === 'addPopulation' || effect.type === 'removePopulation') && !raceIds.has(effect.raceId)) {
      errors.push(`Unknown raceId "${effect.raceId}" referenced by ${source}.`)
    }
    if (effect.type === 'addPopulation' && !jobIds.has(effect.jobId)) {
      errors.push(`Unknown jobId "${effect.jobId}" referenced by ${source}.`)
    }
    if (effect.type === 'removePopulation' && effect.jobId && !jobIds.has(effect.jobId)) {
      errors.push(`Unknown jobId "${effect.jobId}" referenced by ${source}.`)
    }
  }

  const validateCondition = (condition: ConditionDefinition, source: string) => {
    if ((condition.type === 'resourceAtLeast' || condition.type === 'resourceAtMost') && !resourceIds.has(condition.resourceId)) {
      errors.push(`Unknown resourceId "${condition.resourceId}" referenced by ${source}.`)
    }
    if (condition.type === 'hasRace' && !raceIds.has(condition.raceId)) {
      errors.push(`Unknown raceId "${condition.raceId}" referenced by ${source}.`)
    }
    if (condition.type === 'hasRoom' && !facilityIds.has(condition.facilityId)) {
      errors.push(`Unknown facilityId "${condition.facilityId}" referenced by ${source}.`)
    }
  }

  initialPopulationGroups.forEach((group) => {
    if (!raceIds.has(group.raceId)) errors.push(`Unknown raceId "${group.raceId}" in initial population "${group.id}".`)
    if (!jobIds.has(group.jobId)) errors.push(`Unknown jobId "${group.jobId}" in initial population "${group.id}".`)
  })

  initialFacilityPlacements.forEach((placement) => {
    if (!facilityIds.has(placement.definitionId)) {
      errors.push(`Unknown facilityId "${placement.definitionId}" in initial placement "${placement.instanceId}".`)
    }
  })

  facilityDefinitions.forEach((facility) => {
    const levelNumbers = facility.levels.map((level) => String(level.level))
    errors.push(...findDuplicateIds(`facility level (${facility.id})`, levelNumbers))
    facility.requirements.forEach((condition) => validateCondition(condition, `facility "${facility.id}"`))
    const resourceReferences = [
      ...Object.keys(facility.buildCost),
      ...facility.levels.flatMap((level) => [
        ...Object.keys(level.upgradeCost ?? {}),
        ...Object.keys(level.storageCapacity ?? {}),
        ...level.dailyEffects.flatMap((effect) => effect.type === 'addResource' ? [effect.resourceId] : []),
        ...(level.maintenanceEffects ?? []).flatMap((effect) => effect.type === 'addResource' ? [effect.resourceId] : []),
      ]),
    ]

    resourceReferences.forEach((resourceId) => {
      if (!resourceIds.has(resourceId)) errors.push(`Unknown resourceId "${resourceId}" referenced by facility "${facility.id}".`)
    })

    facility.levels.flatMap((level) => Object.keys(level.requiredWorkers ?? {})).forEach((jobId) => {
      if (!jobIds.has(jobId)) errors.push(`Unknown jobId "${jobId}" referenced by facility "${facility.id}".`)
    })

    facility.levels.forEach((level) => {
      level.dailyEffects.forEach((effect) => validateEffect(effect, `facility "${facility.id}" level ${level.level}`))
      level.maintenanceEffects?.forEach((effect) => validateEffect(effect, `facility "${facility.id}" level ${level.level}`))
    })
  })

  tierDefinitions.forEach((tier) => {
    tier.requirements.forEach((condition) => validateCondition(condition, `tier "${tier.id}"`))
  })

  eventDefinitions.forEach((event) => {
    if (event.choices.length === 0) errors.push(`Event "${event.id}" has no choices.`)
    errors.push(...findDuplicateIds(`event choice (${event.id})`, event.choices.map((choice) => choice.id)))
    event.conditions.forEach((condition) => validateCondition(condition, `event "${event.id}"`))
    event.choices.forEach((choice) => {
      choice.conditions?.forEach((condition) => validateCondition(condition, `event choice "${event.id}/${choice.id}"`))
      choice.effects.forEach((effect) => validateEffect(effect, `event choice "${event.id}/${choice.id}"`))
    })
  })

  if (errors.length > 0) {
    throw new Error(`Content validation failed:\n- ${errors.join('\n- ')}`)
  }
}
