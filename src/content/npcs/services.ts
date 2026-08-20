import type { MercenaryDefinition, NpcServiceDefinition, RecruitmentOfferDefinition, ShopItemDefinition } from '../../types/content'

export const shopItemDefinitions: ShopItemDefinition[] = [
  { id: 'emergency_food', name: '비상 식량', description: '식량 +20', cost: { gold: 15 }, effects: [{ type: 'addResource', resourceId: 'food', amount: 20 }], weight: 10, stock: 2, minTier: 1 },
  { id: 'building_materials', name: '건설 자재', description: '자재 +15', cost: { gold: 20 }, effects: [{ type: 'addResource', resourceId: 'material', amount: 15 }], weight: 10, stock: 2, minTier: 1 },
  { id: 'mana_crystal', name: '마력 결정', description: '마력 +15', cost: { gold: 25 }, effects: [{ type: 'addResource', resourceId: 'mana', amount: 15 }], weight: 8, stock: 1, minTier: 2 },
  { id: 'core_repair_stone', name: '코어 수복석', description: '코어 HP +15', cost: { gold: 30 }, effects: [{ type: 'changeCoreHp', amount: 15 }], weight: 6, stock: 1, minTier: 2 },
  { id: 'repair_kit', name: '시설 수리 도구', description: '손상 시설 하나를 수리', cost: { gold: 20 }, effects: [{ type: 'repairRandomRoom' }], weight: 7, stock: 1, minTier: 2 },
]

export const shopItemDefinitionById = Object.fromEntries(shopItemDefinitions.map((item) => [item.id, item])) as Record<string, ShopItemDefinition>

export const mercenaryDefinitions: MercenaryDefinition[] = [
  { id: 'goblin_scouts', name: '고블린 척후대', description: '기민한 소규모 용병대', combatPower: 8, cost: { gold: 20 }, durationDays: 3, weight: 10, minTier: 2 },
  { id: 'orc_mercenaries', name: '오크 용병대', description: '정면 방어에 강한 중무장 전사들', combatPower: 17, cost: { gold: 38 }, durationDays: 4, weight: 8, minTier: 2 },
  { id: 'imp_warders', name: '임프 수호대', description: '마법 장벽을 다루는 지원 용병대', combatPower: 10, cost: { gold: 30, mana: 5 }, durationDays: 4, weight: 8, minTier: 2 },
]

export const mercenaryDefinitionById = Object.fromEntries(mercenaryDefinitions.map((item) => [item.id, item])) as Record<string, MercenaryDefinition>

export const recruitmentOfferDefinitions: RecruitmentOfferDefinition[] = [
  { id: 'recruit_goblin_pair', name: '고블린 일꾼 둘', description: '범용 작업에 적합한 고블린 2명이 영구 합류합니다.', raceId: 'goblin', count: 2, cost: { gold: 24, food: 10 }, stock: 1, weight: 10, minTier: 2 },
  { id: 'recruit_orc', name: '오크 전사', description: '식량을 많이 소비하지만 방어 임무에 강한 오크 1명이 영구 합류합니다.', raceId: 'orc', count: 1, cost: { gold: 26, food: 12 }, stock: 1, weight: 8, minTier: 2 },
  { id: 'recruit_imp', name: '임프 술사', description: '마력 시설에 강한 임프 1명이 영구 합류합니다.', raceId: 'imp', count: 1, cost: { gold: 24, mana: 10 }, stock: 1, weight: 8, minTier: 2 },
]

export const recruitmentOfferDefinitionById = Object.fromEntries(recruitmentOfferDefinitions.map((item) => [item.id, item])) as Record<string, RecruitmentOfferDefinition>

export const npcServiceDefinitions: NpcServiceDefinition[] = [
  { id: 'emergency_reinforcement', featureId: 'blacksmith', name: '긴급 보강', description: '다음 침입 방어력 +10%', cost: { gold: 25, material: 20 }, effects: [{ type: 'addTimedModifier', modifierType: 'defenseMultiplier', value: 1.1, consumeOnInvasion: true }] },
  { id: 'core_stabilization', featureId: 'mage', name: '코어 안정화', description: '코어 HP +20', cost: { mana: 20 }, effects: [{ type: 'changeCoreHp', amount: 20 }] },
  { id: 'arcane_barrier', featureId: 'mage', name: '비전 장벽', description: '다음 침입 방어력 +16', cost: { mana: 25 }, effects: [{ type: 'addTimedModifier', modifierType: 'flatDefense', value: 16, consumeOnInvasion: true }] },
  { id: 'mana_surge', featureId: 'mage', name: '마력 쇄도', description: '3 DAY 동안 마력 시설 생산 +30%', cost: { mana: 20 }, effects: [{ type: 'addTimedModifier', modifierType: 'productionTagMultiplier', targetTag: 'mana', value: 1.3, durationDays: 3 }] },
  { id: 'protect_residents', featureId: 'healer', name: '주민 보호', description: '다음 침입 주민 손실 확률 -50%', cost: { gold: 15, food: 10 }, effects: [{ type: 'addTimedModifier', modifierType: 'residentLossChanceMultiplier', value: 0.5, consumeOnInvasion: true }] },
  { id: 'recovery_supplies', featureId: 'healer', name: '회복 물자', description: '다음 침입 주민 손실 확률 -40%', cost: { gold: 20 }, effects: [{ type: 'addTimedModifier', modifierType: 'residentLossChanceMultiplier', value: 0.6, consumeOnInvasion: true }] },
  { id: 'intel_power', featureId: 'informant', name: '전투력 분석', description: '다음 침입 예상 전투력 범위 공개', cost: { gold: 10 }, effects: [{ type: 'revealInvasionIntel', intelType: 'powerRange' }] },
  { id: 'intel_category', featureId: 'informant', name: '침입자 유형 분석', description: '다음 침입 후보 유형 공개', cost: { gold: 15 }, effects: [{ type: 'revealInvasionIntel', intelType: 'invaderCategory' }] },
  { id: 'intel_arrival', featureId: 'informant', name: '도착 시점 분석', description: '내부 공략 압력을 분석해 다음 침입 근접도를 공개', cost: { gold: 18 }, effects: [{ type: 'revealInvasionIntel', intelType: 'arrivalEstimate' }] },
]

export const npcServiceDefinitionById = Object.fromEntries(npcServiceDefinitions.map((item) => [item.id, item])) as Record<string, NpcServiceDefinition>
