import type { FacilityDefinition } from '../../types/content'

export const REMOVED_FACILITY_IDS = ['training_ground', 'watch_post'] as const

export const facilityDefinitions: FacilityDefinition[] = [
  {
    id: 'dungeon_core', name: '던전 코어', shortName: '코어', description: '던전 전체를 유지하는 심장부입니다.',
    role: '코어 HP·Tier 관리', iconId: 'room_dungeon_core', category: 'core', buildable: false, requiredTier: 1, buildCost: {},
    levels: [{ level: 1, dailyEffects: [], goldMaintenance: 0 }], tags: ['unique', 'core'], requirements: [],
  },
  {
    id: 'quarters', name: '숙소', shortName: '숙소', description: '주민들이 몸을 누일 수 있는 공동 숙소입니다.',
    role: '인구 수용량 증가', iconId: 'room_quarters', category: 'housing', buildable: true, requiredTier: 1, buildCost: { material: 20 },
    levels: [
      { level: 1, dailyEffects: [], populationCapacity: 5, goldMaintenance: 0, upgradeCost: { material: 30 } },
      { level: 2, dailyEffects: [], populationCapacity: 10, goldMaintenance: 1, upgradeCost: { material: 50 } },
      { level: 3, dailyEffects: [], populationCapacity: 18, goldMaintenance: 1 },
    ], tags: ['housing'], requirements: [],
  },
  {
    id: 'mine', name: '채굴장', shortName: '채굴장', description: '암반을 깎아 건설에 필요한 자재를 생산합니다.',
    role: '자재 생산', iconId: 'room_mine', category: 'production', buildable: true, requiredTier: 1, buildCost: { material: 25 },
    levels: [
      { level: 1, dailyEffects: [{ type: 'addResource', resourceId: 'material', amount: 6 }], staffSlots: 2, goldMaintenance: 1, upgradeCost: { material: 35 } },
      { level: 2, dailyEffects: [{ type: 'addResource', resourceId: 'material', amount: 10 }], staffSlots: 3, goldMaintenance: 1, upgradeCost: { material: 55 } },
      { level: 3, dailyEffects: [{ type: 'addResource', resourceId: 'material', amount: 16 }], staffSlots: 4, goldMaintenance: 2 },
    ], tags: ['production', 'labor', 'physical', 'material'], requirements: [],
  },
  {
    id: 'fungus_farm', name: '균사 농장', shortName: '농장', description: '어둠에서도 자라는 균류를 재배합니다.',
    role: '식량 생산', iconId: 'room_fungus_farm', category: 'production', buildable: true, requiredTier: 1, buildCost: { material: 20 },
    levels: [
      { level: 1, dailyEffects: [{ type: 'addResource', resourceId: 'food', amount: 8 }], staffSlots: 2, goldMaintenance: 0, upgradeCost: { material: 30 } },
      { level: 2, dailyEffects: [{ type: 'addResource', resourceId: 'food', amount: 13 }], staffSlots: 3, goldMaintenance: 1, upgradeCost: { material: 45 } },
      { level: 3, dailyEffects: [{ type: 'addResource', resourceId: 'food', amount: 20 }], staffSlots: 4, goldMaintenance: 1 },
    ], tags: ['production', 'labor', 'food'], requirements: [],
  },
  {
    id: 'warehouse', name: '창고', shortName: '창고', description: '골드·자재·식량의 저장 한도를 늘립니다.',
    role: '일반 자원 저장 한도', iconId: 'room_warehouse', category: 'storage', buildable: true, requiredTier: 1, buildCost: { material: 20 },
    levels: [
      { level: 1, dailyEffects: [], storageCapacity: { gold: 50, material: 75, food: 50 }, goldMaintenance: 0, upgradeCost: { material: 30 } },
      { level: 2, dailyEffects: [], storageCapacity: { gold: 100, material: 150, food: 100 }, goldMaintenance: 1, upgradeCost: { material: 50 } },
      { level: 3, dailyEffects: [], storageCapacity: { gold: 175, material: 250, food: 175 }, goldMaintenance: 1 },
    ], tags: ['storage'], requirements: [],
  },
  {
    id: 'guard_post', name: '경비실', shortName: '경비실', description: '배치한 주민이 침입에 대비하는 방어 거점입니다.',
    role: '주민 배치·전투력 증폭', iconId: 'room_guard_post', category: 'defense', buildable: true, requiredTier: 2, buildCost: { gold: 10, material: 30 },
    levels: [
      { level: 1, dailyEffects: [], defense: 3, staffSlots: 2, modifiers: [{ type: 'combatContributionMultiplier', value: 1.25 }], goldMaintenance: 1, upgradeCost: { gold: 18, material: 36 } },
      { level: 2, dailyEffects: [], defense: 5, staffSlots: 3, modifiers: [{ type: 'combatContributionMultiplier', value: 1.4 }], goldMaintenance: 2, upgradeCost: { gold: 30, material: 52 } },
      { level: 3, dailyEffects: [], defense: 7, staffSlots: 4, modifiers: [{ type: 'combatContributionMultiplier', value: 1.55 }], goldMaintenance: 3 },
    ], tags: ['defense', 'combat'], requirements: [],
  },
  {
    id: 'mana_chamber', name: '마력실', shortName: '마력실', description: '지맥의 흐름에서 마력을 모으는 Tier 2 생산 시설입니다.',
    role: '마력 생산', iconId: 'room_mana_chamber', category: 'production', buildable: true, requiredTier: 2, buildCost: { material: 30 },
    levels: [
      { level: 1, dailyEffects: [{ type: 'addResource', resourceId: 'mana', amount: 4 }], staffSlots: 1, goldMaintenance: 1, upgradeCost: { material: 40, mana: 10 } },
      { level: 2, dailyEffects: [{ type: 'addResource', resourceId: 'mana', amount: 8 }], staffSlots: 2, goldMaintenance: 2, upgradeCost: { material: 60, mana: 20 } },
      { level: 3, dailyEffects: [{ type: 'addResource', resourceId: 'mana', amount: 13 }], staffSlots: 3, goldMaintenance: 2 },
    ], tags: ['production', 'mana'], requirements: [],
  },
  {
    id: 'trap_room', name: '함정실', shortName: '함정실', description: '마력 유지비를 소모해 높은 고정 방어력을 제공합니다.',
    role: '마력 소모·고정 방어', iconId: 'room_trap_room', category: 'defense', buildable: true, requiredTier: 2, buildCost: { material: 25, mana: 10 },
    levels: [
      { level: 1, dailyEffects: [], maintenanceEffects: [{ type: 'addResource', resourceId: 'mana', amount: -1 }], defense: 14, goldMaintenance: 1, upgradeCost: { material: 32, mana: 14 } },
      { level: 2, dailyEffects: [], maintenanceEffects: [{ type: 'addResource', resourceId: 'mana', amount: -2 }], defense: 24, goldMaintenance: 2, upgradeCost: { material: 46, mana: 22 } },
      { level: 3, dailyEffects: [], maintenanceEffects: [{ type: 'addResource', resourceId: 'mana', amount: -3 }], defense: 38, goldMaintenance: 3 },
    ], tags: ['defense', 'trap', 'magical'], requirements: [],
  },
  {
    id: 'mana_reservoir', name: '마력 저장고', shortName: '마력고', description: '마력만 안전하게 보관하여 저장 한도를 늘립니다.',
    role: '마력 저장 한도', iconId: 'room_mana_reservoir', category: 'storage', buildable: true, requiredTier: 2, buildCost: { material: 45, mana: 20 },
    levels: [
      { level: 1, dailyEffects: [], storageCapacity: { mana: 50 }, goldMaintenance: 0, upgradeCost: { material: 40, mana: 20 } },
      { level: 2, dailyEffects: [], storageCapacity: { mana: 100 }, goldMaintenance: 1, upgradeCost: { material: 60, mana: 30 } },
      { level: 3, dailyEffects: [], storageCapacity: { mana: 175 }, goldMaintenance: 2 },
    ], tags: ['storage', 'mana', 'advanced'], requirements: [],
  },
  {
    id: 'infirmary', name: '치료소', shortName: '치료소', description: '상시 의료 지원으로 침입 패배 시 주민 손실을 줄입니다.',
    role: '상시 주민 보호', iconId: 'room_infirmary', category: 'housing', buildable: true, requiredTier: 3, buildCost: { material: 40, gold: 25 },
    levels: [
      { level: 1, dailyEffects: [], modifiers: [{ type: 'residentLossChanceMultiplier', value: 0.8 }], goldMaintenance: 1, upgradeCost: { material: 35, gold: 20 } },
      { level: 2, dailyEffects: [], modifiers: [{ type: 'residentLossChanceMultiplier', value: 0.65 }], goldMaintenance: 2, upgradeCost: { material: 50, gold: 30 } },
      { level: 3, dailyEffects: [], modifiers: [{ type: 'residentLossChanceMultiplier', value: 0.5 }], goldMaintenance: 2 },
    ], tags: ['support', 'recovery', 'population_protection'], requirements: [],
  },
  {
    id: 'reinforced_gate', name: '강화 관문', shortName: '관문', description: '인구 배치 없이 고정 방어력을 제공하는 견고한 관문입니다.',
    role: '무인·무마력 안정 방어', iconId: 'room_reinforced_gate', category: 'defense', buildable: true, requiredTier: 3, buildCost: { material: 55, gold: 30 },
    levels: [
      { level: 1, dailyEffects: [], defense: 16, goldMaintenance: 2, upgradeCost: { material: 46, gold: 28 } },
      { level: 2, dailyEffects: [], defense: 28, goldMaintenance: 3, upgradeCost: { material: 64, gold: 40 } },
      { level: 3, dailyEffects: [], defense: 42, goldMaintenance: 4 },
    ], tags: ['defense', 'gate'], requirements: [],
  },
]

export const facilityDefinitionById = Object.fromEntries(
  facilityDefinitions.map((facility) => [facility.id, facility]),
) as Record<string, FacilityDefinition>
