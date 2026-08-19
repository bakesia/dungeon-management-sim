import type { MercenaryDefinition, NpcServiceDefinition, ShopItemDefinition } from '../../types/content'

export const shopItemDefinitions: ShopItemDefinition[] = [
  { id: 'emergency_food', name: '비상 식량', description: '식량 +20', cost: { gold: 15 }, effects: [{ type: 'addResource', resourceId: 'food', amount: 20 }], weight: 10, stock: 2, minTier: 1 },
  { id: 'building_materials', name: '건설 자재', description: '자재 +15', cost: { gold: 20 }, effects: [{ type: 'addResource', resourceId: 'material', amount: 15 }], weight: 10, stock: 2, minTier: 1 },
  { id: 'mana_crystal', name: '마력 결정', description: '마력 +15', cost: { gold: 25 }, effects: [{ type: 'addResource', resourceId: 'mana', amount: 15 }], weight: 8, stock: 1, minTier: 2 },
  { id: 'core_repair_stone', name: '코어 수복석', description: '코어 HP +15', cost: { gold: 30 }, effects: [{ type: 'changeCoreHp', amount: 15 }], weight: 6, stock: 1, minTier: 2 },
  { id: 'repair_kit', name: '시설 수리 도구', description: '손상 시설 하나를 수리', cost: { gold: 20 }, effects: [{ type: 'repairRandomRoom' }], weight: 7, stock: 1, minTier: 2 },
]

export const shopItemDefinitionById = Object.fromEntries(shopItemDefinitions.map((item) => [item.id, item])) as Record<string, ShopItemDefinition>

export const mercenaryDefinitions: MercenaryDefinition[] = [
  { id: 'goblin_scouts', name: '고블린 척후대', description: '기민한 소규모 용병대', combatPower: 10, cost: { gold: 20 }, durationDays: 3, weight: 10, minTier: 3 },
  { id: 'orc_mercenaries', name: '오크 용병대', description: '정면 방어에 강한 중무장 전사들', combatPower: 25, cost: { gold: 40 }, durationDays: 4, weight: 8, minTier: 3 },
  { id: 'imp_warders', name: '임프 수호대', description: '마법 장벽을 다루는 지원 용병대', combatPower: 12, cost: { gold: 35 }, durationDays: 4, weight: 8, minTier: 3 },
]

export const mercenaryDefinitionById = Object.fromEntries(mercenaryDefinitions.map((item) => [item.id, item])) as Record<string, MercenaryDefinition>

export const npcServiceDefinitions: NpcServiceDefinition[] = [
  { id: 'emergency_reinforcement', featureId: 'blacksmith', name: '긴급 보강', description: '다음 침입 방어력 +10%', cost: { gold: 25, material: 20 }, effects: [{ type: 'addTimedModifier', modifierType: 'defenseMultiplier', value: 1.1, consumeOnInvasion: true }] },
  { id: 'core_stabilization', featureId: 'mage', name: '코어 안정화', description: '코어 HP +20', cost: { mana: 20 }, effects: [{ type: 'changeCoreHp', amount: 20 }] },
  { id: 'arcane_barrier', featureId: 'mage', name: '비전 장벽', description: '다음 침입 방어력 +25', cost: { mana: 30 }, effects: [{ type: 'addTimedModifier', modifierType: 'flatDefense', value: 25, consumeOnInvasion: true }] },
  { id: 'mana_surge', featureId: 'mage', name: '마력 쇄도', description: '3 DAY 동안 마력 시설 생산 +30%', cost: { mana: 20 }, effects: [{ type: 'addTimedModifier', modifierType: 'productionTagMultiplier', targetTag: 'mana', value: 1.3, durationDays: 3 }] },
  { id: 'protect_residents', featureId: 'healer', name: '주민 보호', description: '다음 침입 주민 손실 확률 -50%', cost: { gold: 15, food: 10 }, effects: [{ type: 'addTimedModifier', modifierType: 'residentLossChanceMultiplier', value: 0.5, consumeOnInvasion: true }] },
  { id: 'recovery_supplies', featureId: 'healer', name: '회복 물자', description: '다음 침입 주민 손실 확률 -40%', cost: { gold: 20 }, effects: [{ type: 'addTimedModifier', modifierType: 'residentLossChanceMultiplier', value: 0.6, consumeOnInvasion: true }] },
  { id: 'intel_power', featureId: 'informant', name: '전투력 분석', description: '다음 침입 예상 전투력 범위 공개', cost: { gold: 10 }, effects: [{ type: 'revealInvasionIntel', intelType: 'powerRange' }] },
  { id: 'intel_category', featureId: 'informant', name: '침입자 유형 분석', description: '다음 침입 후보 유형 공개', cost: { gold: 15 }, effects: [{ type: 'revealInvasionIntel', intelType: 'invaderCategory' }] },
  { id: 'intel_arrival', featureId: 'informant', name: '도착 시점 분석', description: '위협도 기반 최대 예상 DAY 공개', cost: { gold: 20 }, effects: [{ type: 'revealInvasionIntel', intelType: 'arrivalEstimate' }] },
]

export const npcServiceDefinitionById = Object.fromEntries(npcServiceDefinitions.map((item) => [item.id, item])) as Record<string, NpcServiceDefinition>

