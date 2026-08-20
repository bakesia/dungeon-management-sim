import type { ItemDefinition } from '../../types/content'

export const itemDefinitions: ItemDefinition[] = [
  { id: 'loot_broken_blade', name: '부러진 검', description: '모험가가 남긴 철제 검 조각.', category: 'loot', sellValue: 7, tags: ['common', 'metal'], iconId: 'item-blade' },
  { id: 'loot_adventurer_pack', name: '모험가의 배낭', description: '쓸 만한 물건이 든 낡은 배낭.', category: 'loot', sellValue: 10, tags: ['common', 'supply'], iconId: 'item-pack' },
  { id: 'loot_armor_scrap', name: '갑옷 파편', description: '대장간에서 재료로 쓸 수 있는 금속 조각.', category: 'loot', sellValue: 9, tags: ['common', 'metal'], iconId: 'item-armor' },
  { id: 'loot_silver_trinket', name: '은제 장신구', description: '인간 도시에서 제법 값을 받는 장식품.', category: 'loot', sellValue: 15, tags: ['valuable'], iconId: 'item-trinket' },
  { id: 'loot_arcane_fragment', name: '비전 파편', description: '희미한 마력이 남은 결정 조각.', category: 'loot', sellValue: 17, tags: ['valuable', 'mana'], iconId: 'item-crystal' },
  { id: 'loot_quality_supplies', name: '정예 보급품', description: '토벌대가 가져온 고급 군수품.', category: 'loot', sellValue: 22, tags: ['valuable', 'supply'], iconId: 'item-crate' },
  { id: 'artifact_hoard_stone', name: '축재의 돌', description: '보유 중이면 모든 자원 저장 한도가 20 증가한다.', category: 'artifact', sellValue: 32, tags: ['rare', 'passive'], iconId: 'artifact-stone', modifiers: [
    { type: 'resourceCapacityBonus', resourceId: 'gold', amount: 20 }, { type: 'resourceCapacityBonus', resourceId: 'material', amount: 20 },
    { type: 'resourceCapacityBonus', resourceId: 'food', amount: 20 }, { type: 'resourceCapacityBonus', resourceId: 'mana', amount: 20 },
  ] },
  { id: 'artifact_ward_rune', name: '수호 룬판', description: '보유 중이면 던전 방어력이 5 증가한다.', category: 'artifact', sellValue: 36, tags: ['rare', 'passive', 'defense'], iconId: 'artifact-rune', modifiers: [{ type: 'flatDefense', amount: 5 }] },
  { id: 'artifact_mana_lens', name: '심층 마력 렌즈', description: '보유 중이면 마력 시설마다 마력 생산이 1 증가한다.', category: 'artifact', sellValue: 38, tags: ['rare', 'passive', 'mana'], iconId: 'artifact-lens', modifiers: [{ type: 'productionFlatBonus', targetTag: 'mana', resourceId: 'mana', amount: 1 }] },
  { id: 'artifact_command_banner', name: '부서진 지휘기', description: '보유 중이면 최종 방어력이 5% 증가한다.', category: 'artifact', sellValue: 45, tags: ['rare', 'passive', 'defense'], iconId: 'artifact-banner', modifiers: [{ type: 'defenseMultiplier', value: 1.05 }] },
]

export const itemDefinitionById = Object.fromEntries(itemDefinitions.map((item) => [item.id, item])) as Record<string, ItemDefinition>
