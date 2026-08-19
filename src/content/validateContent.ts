import type { ConditionDefinition, EffectDefinition } from '../types/content'
import { eventDefinitions } from './events/events'
import { facilityDefinitions } from './facilities/facilities'
import { initialFacilityPlacements, initialPopulationGroups } from './initialGame'
import { invaderDefinitions } from './invaders/invaders'
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
    ...findDuplicateIds('tier level', tierDefinitions.map((item) => String(item.level))),
    ...findDuplicateIds('invader', invaderDefinitions.map((item) => item.id)),
  ]

  const resourceIds = new Set(resourceDefinitions.map((item) => item.id))
  const raceIds = new Set(raceDefinitions.map((item) => item.id))
  const jobIds = new Set(jobDefinitions.map((item) => item.id))
  const facilityIds = new Set(facilityDefinitions.map((item) => item.id))
  const tierLevels = new Set(tierDefinitions.map((item) => item.level))
  const definedFlags = new Set(
    eventDefinitions.flatMap((event) => event.choices.flatMap((choice) =>
      choice.effects.flatMap((effect) => effect.type === 'setFlag' ? [effect.flag] : []),
    )),
  )

  const validateCost = (cost: Record<string, number>, source: string) => {
    Object.entries(cost).forEach(([resourceId, amount]) => {
      if (!resourceIds.has(resourceId)) errors.push(`Unknown resourceId "${resourceId}" referenced by ${source}.`)
      if (amount < 0) errors.push(`${source} has a negative cost for "${resourceId}".`)
    })
  }

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
    if (effect.type === 'setFlag' && effect.flag.trim().length === 0) errors.push(`Empty flag referenced by ${source}.`)
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
    if (condition.type === 'tierAtLeast' && !tierLevels.has(condition.level)) {
      errors.push(`Unknown tier level "${condition.level}" referenced by ${source}.`)
    }
    if (condition.type === 'flagEquals' && !definedFlags.has(condition.flag)) {
      errors.push(`Unknown flag "${condition.flag}" referenced by ${source}.`)
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

  jobDefinitions.forEach((job) => {
    if (job.combatContribution < 0) errors.push(`Job "${job.id}" has negative combatContribution.`)
  })

  facilityDefinitions.forEach((facility) => {
    const sortedLevels = [...facility.levels].map((level) => level.level).sort((a, b) => a - b)
    const levelNumbers = sortedLevels.map(String)
    errors.push(...findDuplicateIds(`facility level (${facility.id})`, levelNumbers))
    if (!tierLevels.has(facility.requiredTier)) errors.push(`Facility "${facility.id}" references unknown requiredTier ${facility.requiredTier}.`)
    if (sortedLevels.some((level, index) => level !== index + 1)) errors.push(`Facility "${facility.id}" levels must be consecutive from 1.`)
    facility.requirements.forEach((condition) => validateCondition(condition, `facility "${facility.id}"`))
    validateCost(facility.buildCost, `facility "${facility.id}" buildCost`)
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
      if (level.upgradeCost) validateCost(level.upgradeCost, `facility "${facility.id}" level ${level.level} upgradeCost`)
      level.dailyEffects.forEach((effect) => validateEffect(effect, `facility "${facility.id}" level ${level.level}`))
      level.maintenanceEffects?.forEach((effect) => validateEffect(effect, `facility "${facility.id}" level ${level.level}`))
      level.modifiers?.forEach((modifier) => {
        if (!Number.isFinite(modifier.value) || modifier.value < 0) {
          errors.push(`Facility "${facility.id}" level ${level.level} has an invalid ${modifier.type} value.`)
        }
      })
    })
  })

  tierDefinitions.forEach((tier) => {
    tier.requirements.forEach((condition) => validateCondition(condition, `tier "${tier.id}"`))
    tier.promotionRewards.forEach((effect) => validateEffect(effect, `tier "${tier.id}" promotion reward`))
  })

  if (eventDefinitions.length < 35) errors.push(`Expected at least 35 events, found ${eventDefinitions.length}.`)

  eventDefinitions.forEach((event) => {
    if (event.choices.length === 0) errors.push(`Event "${event.id}" has no choices.`)
    errors.push(...findDuplicateIds(`event choice (${event.id})`, event.choices.map((choice) => choice.id)))
    event.conditions.forEach((condition) => validateCondition(condition, `event "${event.id}"`))
    event.choices.forEach((choice) => {
      choice.conditions?.forEach((condition) => validateCondition(condition, `event choice "${event.id}/${choice.id}"`))
      choice.effects.forEach((effect) => validateEffect(effect, `event choice "${event.id}/${choice.id}"`))
    })
  })

  invaderDefinitions.forEach((invader) => {
    if (invader.allowedTierMin > invader.allowedTierMax) {
      errors.push(`Invader "${invader.id}" has an invalid tier range.`)
    }
    if (!tierLevels.has(invader.allowedTierMin) || !tierLevels.has(invader.allowedTierMax)) {
      errors.push(`Invader "${invader.id}" references an unknown tier level.`)
    }
    if (invader.combatPower < 0 || invader.raidPower < 0) {
      errors.push(`Invader "${invader.id}" has negative combat or raid power.`)
    }
    invader.rewards.forEach((effect) => validateEffect(effect, `invader "${invader.id}"`))
  })

  if (errors.length > 0) {
    throw new Error(`Content validation failed:\n- ${errors.join('\n- ')}`)
  }
}
