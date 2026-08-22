import type { EventDefinition } from '../../types/content'
import { expandedEventDefinitions } from './expandedEvents'
import { npcEventDefinitions } from './npcEvents'
import { connectedEventDefinitions } from './connectedEvents'
import { excavationEventDefinitions } from './excavationEvents'

const baseEventDefinitions: EventDefinition[] = [
  {
    id: 'event_small_ore_vein', title: '작은 광맥', text: '갈라진 암벽 사이에서 쓸 만한 광맥이 드러났습니다.',
    conditions: [{ type: 'dayAtLeast', day: 2 }], weight: 10, once: true, tags: ['discovery', 'resource'],
    choices: [
      { id: 'mine', text: '광석을 채취한다', effects: [{ type: 'addResource', resourceId: 'material', amount: 12 }, { type: 'setFlag', flag: 'ore_vein_found', value: true }, { type: 'addLog', category: 'resource', message: '광맥에서 자재를 확보했습니다. [자재 +12]' }] },
      { id: 'leave', text: '표식을 남기고 돌아간다', effects: [{ type: 'addLog', category: 'event', message: '광맥을 그대로 남겨 두었습니다.' }] },
    ],
  },
  {
    id: 'event_fungus_colony', title: '버섯 군락', text: '습한 통로에 식용 가능한 버섯 군락이 자라고 있습니다.',
    conditions: [], weight: 10, once: false, tags: ['resource', 'food'],
    choices: [
      { id: 'harvest', text: '조심스럽게 수확한다', effects: [{ type: 'addResource', resourceId: 'food', amount: 9 }, { type: 'addLog', category: 'resource', message: '버섯을 수확했습니다. [식량 +9]' }] },
      { id: 'preserve', text: '군락을 보존한다', effects: [{ type: 'addLog', category: 'event', message: '버섯 군락을 건드리지 않았습니다.' }] },
    ],
  },
  {
    id: 'event_groundwater', title: '지하수 발견', text: '바위 틈에서 맑은 지하수가 솟아납니다.',
    conditions: [], weight: 8, once: true, tags: ['discovery'],
    choices: [
      { id: 'collect', text: '저장 용기에 모은다', effects: [{ type: 'addResource', resourceId: 'food', amount: 6 }, { type: 'addLog', category: 'resource', message: '식수와 재배용 물을 확보했습니다. [식량 +6]' }] },
      { id: 'channel', text: '마력으로 물길을 넓힌다', conditions: [{ type: 'resourceAtLeast', resourceId: 'mana', amount: 2 }], effects: [{ type: 'addResource', resourceId: 'mana', amount: -2 }, { type: 'addResource', resourceId: 'food', amount: 10 }, { type: 'addLog', category: 'resource', message: '안정적인 물길을 만들었습니다. [마력 -2, 식량 +10]' }] },
    ],
  },
  {
    id: 'event_old_chest', title: '오래된 상자', text: '무너진 벽 뒤에서 녹슨 자물쇠가 달린 상자를 찾았습니다.',
    conditions: [], weight: 7, once: true, tags: ['discovery', 'gold'],
    choices: [
      { id: 'open', text: '상자를 연다', effects: [{ type: 'addResource', resourceId: 'gold', amount: 14 }, { type: 'addItem', itemId: 'loot_silver_trinket', quantity: 1 }, { type: 'addLog', category: 'resource', message: '낡은 금화와 은제 장신구를 발견했습니다. [골드 +14]' }] },
      { id: 'ignore', text: '수상하니 두고 간다', effects: [{ type: 'addLog', category: 'event', message: '상자를 건드리지 않았습니다.' }] },
    ],
  },
  {
    id: 'event_abandoned_coin_purse', title: '버려진 동전 주머니', text: '입구의 돌 틈에서 급히 숨긴 듯한 작은 동전 주머니를 발견했습니다.',
    conditions: [{ type: 'dayAtLeast', day: 3 }], weight: 6, once: false, cooldownDays: 6, tags: ['gold', 'external'],
    choices: [
      { id: 'take', text: '주머니를 회수한다', effects: [{ type: 'addResource', resourceId: 'gold', amount: 9 }, { type: 'addLog', category: 'resource', message: '주인 없는 동전을 회수했습니다. [골드 +9]' }] },
      { id: 'bait', text: '미끼로 남겨 침입 흔적을 살핀다', effects: [{ type: 'changeFame', amount: -1 }, { type: 'addLog', category: 'invasion', message: '동전 주머니 주변의 흔적을 지워 던전의 소문을 조금 잠재웠습니다. [악명 -1]' }] },
    ],
  },
  {
    id: 'event_emergency_stash', title: '모험가의 비상금', text: '무너진 야영 흔적 아래에서 방수 천에 싸인 비상 물자를 찾아냈습니다.',
    conditions: [{ type: 'dayAtLeast', day: 6 }], weight: 4, once: true, tags: ['gold', 'loot', 'external'],
    choices: [
      { id: 'coins', text: '동전만 챙긴다', effects: [{ type: 'addResource', resourceId: 'gold', amount: 18 }, { type: 'addLog', category: 'resource', message: '비상금에서 골드를 확보했습니다. [골드 +18]' }] },
      { id: 'supplies', text: '남은 물품까지 회수한다', effects: [{ type: 'addItem', itemId: 'loot_adventurer_pack', quantity: 1 }, { type: 'addItem', itemId: 'loot_broken_blade', quantity: 1 }, { type: 'addLog', category: 'resource', message: '판매 가능한 모험가 물품을 회수했습니다.' }] },
    ],
  },
  {
    id: 'event_material_loss', title: '자재 더미 붕괴', text: '쌓아 둔 자재 일부가 습기를 먹고 무너졌습니다.',
    conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 4 }], weight: 8, once: false, tags: ['setback'],
    choices: [
      { id: 'salvage', text: '쓸 만한 것을 건진다', effects: [{ type: 'addResource', resourceId: 'material', amount: -4 }, { type: 'addLog', category: 'warning', message: '손상된 자재를 정리했습니다. [자재 -4]' }] },
      { id: 'reinforce', text: '추가 자재로 보강한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 8 }], effects: [{ type: 'addResource', resourceId: 'material', amount: -8 }, { type: 'setFlag', flag: 'storage_reinforced', value: true }, { type: 'addLog', category: 'warning', message: '자재 더미를 보강했습니다. [자재 -8]' }] },
    ],
  },
  {
    id: 'event_goblin_influx', title: '떠돌이 고블린', text: '일거리를 찾는 고블린 셋이 던전 입구에 찾아왔습니다.',
    conditions: [{ type: 'dayAtLeast', day: 2 }], weight: 8, once: false, tags: ['population', 'goblin'],
    choices: [
      { id: 'accept', text: '주민으로 받아들인다', effects: [{ type: 'offerPopulationJoin', raceId: 'goblin', amount: 3 }, { type: 'addLog', category: 'event', message: '고블린 주민 3명이 합류를 요청했습니다.' }] },
      { id: 'reject', text: '돌려보낸다', effects: [{ type: 'addLog', category: 'event', message: '고블린들을 돌려보냈습니다.' }] },
    ],
  },
  {
    id: 'event_orc_visit', title: '낯선 오크', text: '무장한 오크 한 명이 안전한 거처를 요구합니다.',
    conditions: [{ type: 'resourceAtLeast', resourceId: 'food', amount: 8 }], weight: 10, once: false, tags: ['population', 'orc'],
    choices: [
      { id: 'accept', text: '주민으로 받아들인다', conditions: [{ type: 'resourceAtLeast', resourceId: 'food', amount: 4 }], effects: [{ type: 'addResource', resourceId: 'food', amount: -4 }, { type: 'offerPopulationJoin', raceId: 'orc', amount: 1 }, { type: 'addLog', category: 'event', message: '오크 주민 1명이 합류를 요청했습니다. [식량 -4]' }] },
      { id: 'reject', text: '거절한다', effects: [{ type: 'addLog', category: 'event', message: '오크는 말없이 떠났습니다.' }] },
    ],
  },
  {
    id: 'event_imp_visit', title: '호기심 많은 임프', text: '마력의 냄새를 따라온 임프가 작업장을 둘러봅니다.',
    conditions: [{ type: 'resourceAtLeast', resourceId: 'mana', amount: 5 }], weight: 10, once: false, tags: ['population', 'imp'],
    choices: [
      { id: 'accept', text: '주민으로 받아들인다', conditions: [{ type: 'resourceAtLeast', resourceId: 'mana', amount: 3 }], effects: [{ type: 'addResource', resourceId: 'mana', amount: -3 }, { type: 'offerPopulationJoin', raceId: 'imp', amount: 1 }, { type: 'addLog', category: 'event', message: '임프 주민 1명이 합류를 요청했습니다. [마력 -3]' }] },
      { id: 'reject', text: '돌려보낸다', effects: [{ type: 'addLog', category: 'event', message: '임프는 아쉬운 표정으로 날아갔습니다.' }] },
    ],
  },
  {
    id: 'event_small_collapse', title: '작은 붕괴', text: '낡은 천장에서 돌가루와 파편이 쏟아집니다.',
    conditions: [], weight: 7, once: false, tags: ['hazard'],
    choices: [
      { id: 'repair', text: '자재로 보강한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 7 }], effects: [{ type: 'addResource', resourceId: 'material', amount: -7 }, { type: 'addLog', category: 'warning', message: '붕괴 지점을 보강했습니다. [자재 -7]' }] },
      { id: 'endure', text: '코어의 힘으로 버틴다', effects: [{ type: 'changeCoreHp', amount: -6 }, { type: 'addLog', category: 'warning', message: '붕괴 충격으로 코어가 손상되었습니다. [코어 HP -6]' }] },
    ],
  },
  {
    id: 'event_mana_anomaly', title: '마력 이상 현상', text: '던전 안의 마력이 불규칙하게 소용돌이칩니다.',
    conditions: [], weight: 7, once: false, tags: ['mana', 'hazard'],
    choices: [
      { id: 'stabilize', text: '마력을 코어 안정화에 사용한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'mana', amount: 10 }], effects: [{ type: 'addResource', resourceId: 'mana', amount: -10 }, { type: 'changeCoreHp', amount: 12 }, { type: 'setFlag', flag: 'mana_stabilized', value: true }, { type: 'addLog', category: 'event', message: '마력 흐름으로 코어를 안정시켰습니다. [마력 -10, 코어 HP +12]' }] },
      { id: 'harvest', text: '위험을 감수하고 흡수한다', effects: [{ type: 'addResource', resourceId: 'mana', amount: 10 }, { type: 'changeCoreHp', amount: -5 }, { type: 'addLog', category: 'warning', message: '마력을 흡수했지만 코어가 손상되었습니다. [마력 +10, 코어 HP -5]' }] },
    ],
  },
  {
    id: 'event_wandering_merchant', title: '떠돌이 상인', text: '겁이 많은 상인이 입구에서 식량 거래를 제안합니다.',
    conditions: [{ type: 'resourceAtLeast', resourceId: 'gold', amount: 10 }], weight: 6, once: false, tags: ['trade'],
    choices: [
      { id: 'buy', text: '식량을 구매한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'gold', amount: 10 }], effects: [{ type: 'addResource', resourceId: 'gold', amount: -10 }, { type: 'addResource', resourceId: 'food', amount: 15 }, { type: 'addLog', category: 'resource', message: '식량을 구매했습니다. [골드 -10, 식량 +15]' }] },
      { id: 'decline', text: '거래하지 않는다', effects: [{ type: 'addLog', category: 'event', message: '상인은 서둘러 자리를 떠났습니다.' }] },
    ],
  },
  {
    id: 'event_scout_traces', title: '모험가의 흔적', text: '던전 입구 근처에서 인간 모험가의 발자국을 발견했습니다.',
    conditions: [{ type: 'dayAtLeast', day: 3 }], weight: 7, once: true, tags: ['invasion', 'warning'],
    choices: [
      { id: 'study', text: '흔적을 조사한다', effects: [{ type: 'setFlag', flag: 'adventurer_scouted', value: true }, { type: 'addLog', category: 'invasion', message: '모험가의 정찰 경로를 파악했습니다.' }] },
      { id: 'erase', text: '흔적을 지우고 입구를 위장한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 3 }], effects: [{ type: 'addResource', resourceId: 'material', amount: -3 }, { type: 'addLog', category: 'invasion', message: '던전 입구를 위장했습니다. [자재 -3]' }] },
    ],
  },
  {
    id: 'event_abandoned_camp', title: '버려진 야영지', text: '급히 철수한 모험가 야영지에 배낭과 장비 조각이 남아 있습니다.',
    conditions: [{ type: 'dayAtLeast', day: 4 }], weight: 5, once: true, tags: ['loot', 'invasion'],
    choices: [
      { id: 'salvage', text: '쓸 만한 물건을 챙긴다', effects: [{ type: 'addItem', itemId: 'loot_adventurer_pack', quantity: 1 }, { type: 'addItem', itemId: 'loot_armor_scrap', quantity: 1 }, { type: 'addLog', category: 'resource', message: '야영지에서 판매 가능한 전리품을 챙겼습니다.' }] },
      { id: 'erase', text: '흔적만 지운다', effects: [{ type: 'addResource', resourceId: 'material', amount: 5 }, { type: 'addLog', category: 'event', message: '야영지를 해체해 자재를 확보했습니다. [자재 +5]' }] },
    ],
  },
  {
    id: 'event_arcane_cache', title: '봉인된 마력 궤', text: '오래된 봉인 안에서 비전 파편들이 떨리고 있습니다.',
    conditions: [{ type: 'tierAtLeast', level: 2 }], weight: 3, once: true, tags: ['loot', 'mana'],
    choices: [
      { id: 'open', text: '마력 8로 봉인을 푼다', conditions: [{ type: 'resourceAtLeast', resourceId: 'mana', amount: 8 }], effects: [{ type: 'addResource', resourceId: 'mana', amount: -8 }, { type: 'addItem', itemId: 'loot_arcane_fragment', quantity: 2 }, { type: 'addLog', category: 'resource', message: '봉인된 비전 파편 두 개를 회수했습니다.' }] },
      { id: 'leave', text: '위험을 피한다', effects: [{ type: 'addLog', category: 'event', message: '마력 궤를 봉인된 채 남겼습니다.' }] },
    ],
  },
  {
    id: 'event_forgotten_hoard_relic', title: '잊힌 수장고', text: '코어 아래 숨은 작은 수장고에서 기묘한 돌 하나가 던전의 자원을 끌어당깁니다.',
    conditions: [{ type: 'tierAtLeast', level: 3 }, { type: 'defenseWinsAtLeast', amount: 3 }], weight: 1, once: true, tags: ['artifact', 'rare'],
    choices: [
      { id: 'claim', text: '유물을 코어에 귀속한다', effects: [{ type: 'addItem', itemId: 'artifact_hoard_stone', quantity: 1 }, { type: 'addLog', category: 'progression', presentation: 'typewriter', sound: 'event_positive', message: '수장고의 유물이 던전에 귀속되었습니다. 저장 한도가 넓어집니다.' }] },
      { id: 'sell_marks', text: '수장고의 표식만 떼어낸다', effects: [{ type: 'addResource', resourceId: 'gold', amount: 28 }, { type: 'addLog', category: 'resource', message: '오래된 표식을 처분했습니다. [골드 +28]' }] },
    ],
  },
]

export const eventDefinitions: EventDefinition[] = [
  ...baseEventDefinitions,
  ...expandedEventDefinitions,
  ...connectedEventDefinitions,
  ...excavationEventDefinitions,
  ...npcEventDefinitions,
]

export const eventDefinitionById = Object.fromEntries(
  eventDefinitions.map((event) => [event.id, event]),
) as Record<string, EventDefinition>
