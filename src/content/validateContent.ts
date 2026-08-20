import type { ConditionDefinition, EffectDefinition } from '../types/content'
import { eventDefinitions } from './events/events'
import { facilityDefinitions } from './facilities/facilities'
import { initialFacilityPlacements, initialPopulationGroups } from './initialGame'
import { invaderDefinitions } from './invaders/invaders'
import { npcDefinitions } from './npcs/npcs'
import { mercenaryDefinitions, npcServiceDefinitions, recruitmentOfferDefinitions, shopItemDefinitions } from './npcs/services'
import { raceDefinitions } from './races/races'
import { resourceDefinitions } from './resources/resources'
import { tierDefinitions } from './tiers/tiers'
import { gameIconDefinitionById } from './icons/gameIcons'
import { itemDefinitions } from './items/items'

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
    ...findDuplicateIds('npc', npcDefinitions.map((item) => item.id)),
    ...findDuplicateIds('item', itemDefinitions.map((item) => item.id)),
    ...findDuplicateIds('shop item', shopItemDefinitions.map((item) => item.id)),
    ...findDuplicateIds('mercenary', mercenaryDefinitions.map((item) => item.id)),
    ...findDuplicateIds('recruitment offer', recruitmentOfferDefinitions.map((item) => item.id)),
    ...findDuplicateIds('npc service', npcServiceDefinitions.map((item) => item.id)),
    ...findDuplicateIds('facility', facilityDefinitions.map((item) => item.id)),
    ...findDuplicateIds('event', eventDefinitions.map((item) => item.id)),
    ...findDuplicateIds('tier', tierDefinitions.map((item) => item.id)),
    ...findDuplicateIds('tier level', tierDefinitions.map((item) => String(item.level))),
    ...findDuplicateIds('invader', invaderDefinitions.map((item) => item.id)),
    ...findDuplicateIds('content icon', [
      ...resourceDefinitions.map((item) => item.iconId),
      ...facilityDefinitions.map((item) => item.iconId),
    ]),
  ]

  const resourceIds = new Set(resourceDefinitions.map((item) => item.id))
  const raceIds = new Set(raceDefinitions.map((item) => item.id))
  const npcIds = new Set(npcDefinitions.map((item) => item.id))
  const itemIds = new Set(itemDefinitions.map((item) => item.id))
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
    if ((effect.type === 'addPopulation' || effect.type === 'offerPopulationJoin' || effect.type === 'removePopulation') && !raceIds.has(effect.raceId)) {
      errors.push(`Unknown raceId "${effect.raceId}" referenced by ${source}.`)
    }
    if ((effect.type === 'joinNpc' || effect.type === 'scheduleNpcRetry') && !npcIds.has(effect.npcId)) errors.push(`Unknown npcId "${effect.npcId}" referenced by ${source}.`)
    if (effect.type === 'setFlag' && effect.flag.trim().length === 0) errors.push(`Empty flag referenced by ${source}.`)
    if ((effect.type === 'addItem' || effect.type === 'removeItem') && !itemIds.has(effect.itemId)) errors.push(`Unknown itemId "${effect.itemId}" referenced by ${source}.`)
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
    if ((condition.type === 'npcJoined' || condition.type === 'npcEligible') && !npcIds.has(condition.npcId)) errors.push(`Unknown npcId "${condition.npcId}" referenced by ${source}.`)
    if (condition.type === 'hasItem' && !itemIds.has(condition.itemId)) errors.push(`Unknown itemId "${condition.itemId}" referenced by ${source}.`)
  }

  initialPopulationGroups.forEach((group) => {
    if (!raceIds.has(group.raceId)) errors.push(`Unknown raceId "${group.raceId}" in initial population "${group.id}".`)
  })

  initialFacilityPlacements.forEach((placement) => {
    if (!facilityIds.has(placement.definitionId)) {
      errors.push(`Unknown facilityId "${placement.definitionId}" in initial placement "${placement.instanceId}".`)
    }
  })

  raceDefinitions.forEach((race) => {
    race.modifiers.forEach((modifier) => {
      if (!Number.isFinite(modifier.value) || modifier.value <= 0) errors.push(`Race "${race.id}" has an invalid ${modifier.type} value.`)
      if (modifier.type === 'roomEfficiencyMultiplier' && modifier.targetTag.trim().length === 0) {
        errors.push(`Race "${race.id}" has an empty production modifier targetTag.`)
      }
    })
  })

  resourceDefinitions.forEach((resource) => {
    if (!Number.isFinite(resource.baseCapacity) || resource.baseCapacity <= 0) errors.push(`Resource "${resource.id}" has an invalid baseCapacity.`)
    if (!gameIconDefinitionById[resource.iconId]) errors.push(`Missing icon asset mapping "${resource.iconId}" for resource "${resource.id}".`)
  })

  facilityDefinitions.forEach((facility) => {
    const sortedLevels = [...facility.levels].map((level) => level.level).sort((a, b) => a - b)
    const levelNumbers = sortedLevels.map(String)
    errors.push(...findDuplicateIds(`facility level (${facility.id})`, levelNumbers))
    if (!tierLevels.has(facility.requiredTier)) errors.push(`Facility "${facility.id}" references unknown requiredTier ${facility.requiredTier}.`)
    if (facility.role.trim().length === 0) errors.push(`Facility "${facility.id}" has no role description.`)
    if (!gameIconDefinitionById[facility.iconId]) errors.push(`Missing icon asset mapping "${facility.iconId}" for facility "${facility.id}".`)
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

    facility.levels.forEach((level) => {
      if ((level.staffSlots ?? 0) < 0) errors.push(`Facility "${facility.id}" level ${level.level} has negative staffSlots.`)
      if (!Number.isFinite(level.goldMaintenance ?? 0) || (level.goldMaintenance ?? 0) < 0) errors.push(`Facility "${facility.id}" level ${level.level} has invalid goldMaintenance.`)
      Object.entries(level.storageCapacity ?? {}).forEach(([resourceId, amount]) => {
        if (!resourceIds.has(resourceId) || typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) errors.push(`Facility "${facility.id}" level ${level.level} has invalid capacity modifier for "${resourceId}".`)
      })
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

  if (eventDefinitions.length < 55) errors.push(`Expected at least 55 events, found ${eventDefinitions.length}.`)

  eventDefinitions.forEach((event) => {
    if (event.choices.length === 0) errors.push(`Event "${event.id}" has no choices.`)
    if (event.choices.every((choice) => (choice.conditions?.length ?? 0) > 0)) {
      errors.push(`Event "${event.id}" has no unconditional fallback choice and may have zero eligible choices.`)
    }
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
    if (invader.powerRange.min < 0 || invader.powerRange.max < invader.powerRange.min || invader.raidPower < 0) {
      errors.push(`Invader "${invader.id}" has an invalid combat power range or raid power.`)
    }
    if (invader.minimumFame < 0 || invader.weight <= 0) {
      errors.push(`Invader "${invader.id}" has invalid fame or weight data.`)
    }
    invader.rewards.forEach((effect) => validateEffect(effect, `invader "${invader.id}"`))
    invader.lootTable?.forEach((drop) => {
      if (!itemIds.has(drop.itemId)) errors.push(`Invader "${invader.id}" references unknown loot item "${drop.itemId}".`)
      if (drop.chance < 0 || drop.chance > 1 || drop.quantity.min <= 0 || drop.quantity.max < drop.quantity.min) errors.push(`Invader "${invader.id}" has invalid loot data for "${drop.itemId}".`)
    })
  })

  npcDefinitions.forEach((npc) => {
    npc.unlockConditions.forEach((condition) => validateCondition(condition, `npc "${npc.id}"`))
    npc.precursorFlags.forEach((flag) => {
      if (!definedFlags.has(flag)) errors.push(`Unknown precursor flag "${flag}" referenced by npc "${npc.id}".`)
    })
    if (npc.visitPityDays < 1 || npc.retryCooldownDays < 1) errors.push(`NPC "${npc.id}" has invalid visit timing.`)
  })
  itemDefinitions.forEach((item) => {
    if (item.sellValue < 0 || item.tags.length === 0 || !item.iconId) errors.push(`Item "${item.id}" has invalid value, tags, or iconId.`)
    item.modifiers?.forEach((modifier) => {
      if (modifier.type === 'resourceCapacityBonus' && !resourceIds.has(modifier.resourceId)) errors.push(`Item "${item.id}" references unknown resource "${modifier.resourceId}".`)
      if (modifier.type === 'productionFlatBonus' && (!resourceIds.has(modifier.resourceId) || !modifier.targetTag)) errors.push(`Item "${item.id}" has invalid production modifier.`)
    })
  })
  shopItemDefinitions.forEach((item) => { validateCost(item.cost, `shop item "${item.id}"`); item.effects.forEach((effect) => validateEffect(effect, `shop item "${item.id}"`)) })
  mercenaryDefinitions.forEach((item) => validateCost(item.cost, `mercenary "${item.id}"`))
  recruitmentOfferDefinitions.forEach((item) => {
    validateCost(item.cost, `recruitment offer "${item.id}"`)
    if (!raceIds.has(item.raceId)) errors.push(`Recruitment offer "${item.id}" references unknown raceId "${item.raceId}".`)
    if (item.count <= 0 || item.stock <= 0 || item.weight <= 0 || !tierLevels.has(item.minTier)) errors.push(`Recruitment offer "${item.id}" has invalid count, stock, weight, or tier data.`)
  })
  npcServiceDefinitions.forEach((service) => { validateCost(service.cost, `npc service "${service.id}"`); service.effects.forEach((effect) => validateEffect(effect, `npc service "${service.id}"`)) })

  if (errors.length > 0) {
    throw new Error(`Content validation failed:\n- ${errors.join('\n- ')}`)
  }
}
