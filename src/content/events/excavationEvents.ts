import type { EventDefinition } from '../../types/content'

// These events are queued explicitly by excavation discoveries. Weight 0 keeps them out of the daily event roll.
export const excavationEventDefinitions: EventDefinition[] = [
  {
    id: 'event_excavation_old_trap', title: '매몰된 낡은 함정', text: '공동 바닥 아래에서 녹슨 압력판과 작은 보관함을 발견했습니다.',
    conditions: [], weight: 0, once: false, tags: ['excavation_trigger', 'hazard'],
    choices: [
      { id: 'disarm', text: '자재 6으로 안전하게 해체한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 6 }], effects: [{ type: 'addResource', resourceId: 'material', amount: -6 }, { type: 'addItem', itemId: 'loot_silver_trinket', quantity: 1 }, { type: 'addLog', category: 'resource', message: '함정을 해체하고 보관함의 은제 장신구를 회수했습니다. [자재 -6]' }] },
      { id: 'retreat', text: '표시만 남기고 물러난다', effects: [{ type: 'addLog', category: 'event', message: '함정 구역을 봉쇄했습니다. 추가 피해는 없습니다.' }] },
    ],
  },
  {
    id: 'event_excavation_sealed_door', title: '봉인된 문', text: '돌벽 안쪽에서 낡은 봉인문이 모습을 드러냈습니다.',
    conditions: [], weight: 0, once: false, tags: ['excavation_trigger', 'special'],
    choices: [
      { id: 'break_seal', text: '자재 8로 봉인을 걷어낸다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 8 }], effects: [{ type: 'addResource', resourceId: 'material', amount: -8 }, { type: 'addItem', itemId: 'loot_quality_supplies', quantity: 1 }, { type: 'addLog', category: 'resource', message: '봉인 너머에서 오래된 고급 보급품을 회수했습니다. [자재 -8]' }] },
      { id: 'leave', text: '문을 다시 봉인한다', effects: [{ type: 'addLog', category: 'event', message: '정체를 알 수 없는 문을 그대로 남겨 두었습니다.' }] },
    ],
  },
  {
    id: 'event_excavation_old_altar', title: '오래된 제단', text: '희미한 마력의 잔향이 남은 지하 제단을 발견했습니다.',
    conditions: [], weight: 0, once: false, tags: ['excavation_trigger', 'special'],
    choices: [
      { id: 'stabilize', text: '마력 6으로 잔향을 안정시킨다', conditions: [{ type: 'resourceAtLeast', resourceId: 'mana', amount: 6 }], effects: [{ type: 'addResource', resourceId: 'mana', amount: -6 }, { type: 'addItem', itemId: 'loot_arcane_fragment', quantity: 2 }, { type: 'addLog', category: 'resource', message: '제단의 잔향을 비전 파편으로 응축했습니다. [마력 -6]' }] },
      { id: 'dismantle', text: '위험한 부분만 부순다', effects: [{ type: 'addResource', resourceId: 'material', amount: 8 }, { type: 'addLog', category: 'resource', message: '제단의 석재를 회수했습니다. [자재 +8]' }] },
    ],
  },
  {
    id: 'event_excavation_locked_storage', title: '잠긴 보관실', text: '무너진 통로 뒤에 손대지 않은 작은 보관실이 남아 있습니다.',
    conditions: [], weight: 0, once: false, tags: ['excavation_trigger', 'special'],
    choices: [
      { id: 'open', text: '문을 뜯어 내용물을 회수한다', effects: [{ type: 'addItem', itemId: 'loot_adventurer_pack', quantity: 1 }, { type: 'addItem', itemId: 'loot_armor_scrap', quantity: 1 }, { type: 'addLog', category: 'resource', message: '보관실에서 판매 가능한 물품을 회수했습니다.' }] },
      { id: 'secure', text: '통로부터 안전하게 정리한다', effects: [{ type: 'addResource', resourceId: 'material', amount: 10 }, { type: 'addLog', category: 'resource', message: '주변 잔해에서 자재를 골라냈습니다. [자재 +10]' }] },
    ],
  },
  {
    id: 'event_excavation_unknown_tracks', title: '정체불명의 흔적', text: '최근까지 누군가 드나든 듯한 발자국이 깊은 틈으로 이어집니다.',
    conditions: [], weight: 0, once: false, tags: ['excavation_trigger', 'special'],
    choices: [
      { id: 'erase', text: '흔적을 지워 던전의 위치를 감춘다', effects: [{ type: 'changeFame', amount: -2 }, { type: 'addLog', category: 'invasion', message: '외부로 이어지는 흔적을 지웠습니다. [악명 -2]' }] },
      { id: 'search', text: '남겨진 물품을 추적한다', effects: [{ type: 'addItem', itemId: 'loot_broken_blade', quantity: 1 }, { type: 'changeFame', amount: 1 }, { type: 'addLog', category: 'invasion', message: '침입자의 물품을 노획했지만 던전의 흔적도 남았습니다. [악명 +1]' }] },
    ],
  },
]
