import type { NpcDefinition } from '../../types/content'

export const npcDefinitions: NpcDefinition[] = [
  {
    id: 'npc_merchant', role: 'merchant', displayName: '떠돌이 상인',
    description: '던전과 정기적으로 물자를 거래합니다.',
    visitorText: '이곳과 정기적인 거래를 맺고 싶습니다. 안전한 자리를 내어 주시겠습니까?',
    unlockConditions: [{ type: 'dayAtLeast', day: 3 }, { type: 'resourceAtLeast', resourceId: 'gold', amount: 80 }],
    precursorFlags: ['merchant_trail_followed', 'merchant_goods_taken'], visitPityDays: 5, retryCooldownDays: 5,
    unlockHint: '부유한 던전의 소문을 좇는 자가 있습니다.',
    joinEventId: 'event_npc_merchant_join', featureId: 'shop', tags: ['trade'],
  },
  {
    id: 'npc_blacksmith', role: 'blacksmith', displayName: '대장장이',
    description: '손상 시설을 효율적으로 수리하고 방어 시설을 보강합니다.',
    visitorText: '망치와 화덕을 놓을 자리를 준다면 이 던전의 시설을 책임지겠습니다.',
    unlockConditions: [{ type: 'dayAtLeast', day: 4 }, { type: 'resourceAtLeast', resourceId: 'material', amount: 90 }],
    precursorFlags: ['forge_tools_kept', 'forge_tools_scrapped'], visitPityDays: 5, retryCooldownDays: 5,
    unlockHint: '풍부한 자재와 시설에 관심을 가진 자가 있습니다.',
    joinEventId: 'event_npc_blacksmith_join', featureId: 'blacksmith', tags: ['repair', 'defense'],
  },
  {
    id: 'npc_tavern_keeper', role: 'tavern_keeper', displayName: '펍 주인',
    description: '용병 계약과 영구 주민 모집을 중개합니다.',
    visitorText: '전사들이 쉬고 계약을 나눌 장소가 필요합니다. 주점을 맡겨 주시겠습니까?',
    unlockConditions: [{ type: 'tierAtLeast', level: 2 }],
    precursorFlags: ['mercenaries_welcomed'], visitPityDays: 3, retryCooldownDays: 4,
    unlockHint: '성장한 던전에서 전사와 주민을 중개하려는 자가 있습니다.',
    joinEventId: 'event_npc_tavern_join', featureId: 'tavern', tags: ['mercenary', 'recruitment'],
  },
  {
    id: 'npc_mage', role: 'mage', displayName: '마도사',
    description: '마력을 소비해 코어와 시설에 강력한 지원을 제공합니다.',
    visitorText: '이 마력의 흐름은 흥미롭군요. 연구를 허락한다면 제 힘을 보태겠습니다.',
    unlockConditions: [{ type: 'hasRoom', facilityId: 'mana_chamber' }],
    precursorFlags: ['mana_stabilized'], visitPityDays: 5, retryCooldownDays: 5,
    unlockHint: '강한 마력의 흐름을 감지하는 누군가가 있습니다.',
    joinEventId: 'event_npc_mage_join', featureId: 'mage', tags: ['mana', 'support'],
  },
  {
    id: 'npc_healer', role: 'healer', displayName: '치료사',
    description: '침입 때 주민 피해를 줄이는 보호 물자를 준비합니다.',
    visitorText: '이곳의 주민들을 돌볼 치료 공간을 마련해 주십시오.',
    unlockConditions: [{ type: 'populationAtLeast', amount: 12 }],
    precursorFlags: ['compassionate_dungeon'], visitPityDays: 5, retryCooldownDays: 5,
    unlockHint: '늘어난 주민을 돌볼 치료사가 소문을 듣고 있습니다.',
    joinEventId: 'event_npc_healer_join', featureId: 'healer', tags: ['recovery', 'protection'],
  },
  {
    id: 'npc_informant', role: 'informant', displayName: '정보상',
    description: '악명과 다음 침입 후보, 전투력 범위를 분석합니다.',
    visitorText: '인간 원정대의 움직임을 알고 싶다면 제 정보망을 받아들이십시오.',
    unlockConditions: [{ type: 'fameAtLeast', amount: 18 }, { type: 'defenseWinsAtLeast', amount: 1 }],
    precursorFlags: ['intelligence_network_seed'], visitPityDays: 4, retryCooldownDays: 5,
    unlockHint: '높아진 악명에 이끌린 정보상이 움직이고 있습니다.',
    joinEventId: 'event_npc_informant_join', featureId: 'informant', tags: ['intel', 'fame'],
  },
]

export const npcDefinitionById = Object.fromEntries(npcDefinitions.map((npc) => [npc.id, npc])) as Record<string, NpcDefinition>
