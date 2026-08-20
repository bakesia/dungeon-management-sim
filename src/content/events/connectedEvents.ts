import type { EventDefinition } from '../../types/content'

// 일상 사건, 후속 사건, NPC 전조를 같은 데이터 규칙으로 연결한다.
export const connectedEventDefinitions: EventDefinition[] = [
  {
    id: 'event_pantry_rats', title: '식량 창고의 쥐떼', text: '비축 식량 사이로 굶주린 쥐떼가 몰려들었습니다.', conditions: [{ type: 'resourceAtLeast', resourceId: 'food', amount: 8 }], weight: 8, once: false, category: 'internal', tags: ['daily', 'food'],
    choices: [
      { id: 'trap', text: '자재로 덫을 놓는다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 5 }], effects: [{ type: 'addResource', resourceId: 'material', amount: -5 }, { type: 'setFlag', flag: 'vermin_trapped', value: true }, { type: 'addLog', category: 'event', message: '덫을 놓아 식량 손실을 막았습니다. [자재 -5]' }] },
      { id: 'merchant', text: '상인에게 방충 약제를 산다 · 골드 7', conditions: [{ type: 'npcJoined', npcId: 'npc_merchant', value: true }, { type: 'resourceAtLeast', resourceId: 'gold', amount: 7 }], effects: [{ type: 'addResource', resourceId: 'gold', amount: -7 }, { type: 'addResource', resourceId: 'food', amount: 3 }, { type: 'addLog', category: 'resource', message: '상인의 약제로 식량 일부까지 건졌습니다. [골드 -7, 식량 +3]' }] },
      { id: 'ignore', text: '오염된 식량을 버린다', effects: [{ type: 'addResource', resourceId: 'food', amount: -8 }, { type: 'setFlag', flag: 'vermin_ignored', value: true }, { type: 'addLog', category: 'warning', message: '오염된 식량을 폐기했습니다. [식량 -8]' }] },
    ],
  },
  {
    id: 'event_old_coin_pouch', title: '오래된 금화 주머니', text: '경비병이 입구 주변에서 주인 없는 낡은 주머니를 가져왔습니다.', conditions: [{ type: 'dayAtLeast', day: 3 }], weight: 7, once: false, category: 'external', tags: ['daily', 'gold'],
    choices: [
      { id: 'keep', text: '금화를 운영비로 쓴다', effects: [{ type: 'addResource', resourceId: 'gold', amount: 11 }, { type: 'changeFame', amount: 3 }, { type: 'addLog', category: 'resource', message: '금화를 챙긴 던전의 소문이 바깥에 퍼졌습니다. [골드 +11, 명성 +3]' }] },
      { id: 'merchant', text: '상인에게 감정을 맡긴다', conditions: [{ type: 'npcJoined', npcId: 'npc_merchant', value: true }], effects: [{ type: 'addResource', resourceId: 'gold', amount: 16 }, { type: 'addLog', category: 'resource', message: '상인이 희귀 주화를 골라 더 좋은 값에 팔았습니다. [골드 +16]' }] },
      { id: 'leave', text: '원래 자리에 돌려놓는다', effects: [{ type: 'changeFame', amount: -1 }, { type: 'addLog', category: 'event', message: '수상한 물건을 건드리지 않아 던전의 소문이 잦아들었습니다. [명성 -1]' }] },
    ],
  },
  {
    id: 'event_wall_mana_crystal', title: '벽 틈의 마력 결정', text: '통로 벽 틈에서 불안정한 마력 결정이 맥동합니다.', conditions: [], weight: 7, once: false, category: 'mana', tags: ['daily', 'mana'],
    choices: [
      { id: 'extract', text: '조심스럽게 떼어낸다', effects: [{ type: 'addResource', resourceId: 'mana', amount: 9 }, { type: 'changeCoreHp', amount: -2 }, { type: 'addLog', category: 'warning', message: '마력은 얻었지만 코어가 잠시 흔들렸습니다. [마력 +9, 코어 HP -2]' }] },
      { id: 'mage', text: '마도사에게 안정화를 맡긴다', conditions: [{ type: 'npcJoined', npcId: 'npc_mage', value: true }], effects: [{ type: 'addResource', resourceId: 'mana', amount: 13 }, { type: 'setFlag', flag: 'arcane_samples_catalogued', value: true }, { type: 'addLog', category: 'resource', message: '마도사가 결정을 안전하게 추출했습니다. [마력 +13]' }] },
      { id: 'seal', text: '자재로 틈을 막는다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 3 }], effects: [{ type: 'addResource', resourceId: 'material', amount: -3 }, { type: 'addLog', category: 'event', message: '불안정한 틈을 봉인했습니다. [자재 -3]' }] },
    ],
  },
  {
    id: 'event_food_dispute', title: '주민 간 식량 분쟁', text: '배식량을 두고 주민들이 거칠게 다투기 시작했습니다.', conditions: [{ type: 'populationAtLeast', amount: 6 }], weight: 8, once: false, category: 'population', tags: ['daily', 'population'],
    choices: [
      { id: 'extra', text: '추가 배식을 한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'food', amount: 7 }], effects: [{ type: 'addResource', resourceId: 'food', amount: -7 }, { type: 'addLog', category: 'event', message: '추가 배식으로 분쟁을 잠재웠습니다. [식량 -7]' }] },
      { id: 'tavern', text: '펍 주인에게 중재를 맡긴다', conditions: [{ type: 'npcJoined', npcId: 'npc_tavern_keeper', value: true }], effects: [{ type: 'addResource', resourceId: 'gold', amount: 4 }, { type: 'addLog', category: 'resource', message: '펍 주인이 내기 시합으로 다툼을 풀고 매상도 남겼습니다. [골드 +4]' }] },
      { id: 'healer', text: '치료사에게 배식 기준을 맡긴다', conditions: [{ type: 'npcJoined', npcId: 'npc_healer', value: true }], effects: [{ type: 'addResource', resourceId: 'food', amount: -3 }, { type: 'addLog', category: 'event', message: '치료사가 필요한 주민부터 배식해 분쟁을 끝냈습니다. [식량 -3]' }] },
      { id: 'ration', text: '남은 식량을 공평하게 나눈다', effects: [{ type: 'addLog', category: 'warning', message: '배식량을 줄여 분쟁을 잠재웠습니다.' }] },
    ],
  },
  {
    id: 'event_strange_vibration', title: '시설의 이상 진동', text: '시설 기초에서 규칙적인 진동과 금속음이 울립니다.', conditions: [{ type: 'roomCountAtLeast', amount: 5 }], weight: 7, once: false, category: 'damage', tags: ['daily', 'facility'],
    choices: [
      { id: 'brace', text: '자재로 기초를 보강한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 8 }], effects: [{ type: 'addResource', resourceId: 'material', amount: -8 }, { type: 'addLog', category: 'event', message: '기초를 보강해 진동을 멈췄습니다. [자재 -8]' }] },
      { id: 'blacksmith', text: '대장장이에게 진단을 맡긴다 · 골드 4', conditions: [{ type: 'npcJoined', npcId: 'npc_blacksmith', value: true }, { type: 'resourceAtLeast', resourceId: 'gold', amount: 4 }], effects: [{ type: 'addResource', resourceId: 'gold', amount: -4 }, { type: 'repairRandomRoom' }, { type: 'addLog', category: 'event', message: '대장장이가 진동 원인을 고치고 손상 시설도 정비했습니다. [골드 -4]' }] },
      { id: 'wait', text: '일단 지켜본다', effects: [{ type: 'damageRandomRoom' }, { type: 'addLog', category: 'warning', message: '진동이 커져 시설 하나가 손상되었습니다.' }] },
    ],
  },
  {
    id: 'event_unknown_footprints', title: '낯선 발자국', text: '던전 입구에 주민 누구의 것도 아닌 발자국이 남아 있습니다.', conditions: [{ type: 'dayAtLeast', day: 5 }], weight: 8, once: false, category: 'external', tags: ['daily', 'invasion'],
    choices: [
      { id: 'erase', text: '흔적을 지우고 입구를 위장한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 4 }], effects: [{ type: 'addResource', resourceId: 'material', amount: -4 }, { type: 'changeFame', amount: -3 }, { type: 'addLog', category: 'invasion', message: '입구를 위장해 던전의 소문을 잠재웠습니다. [자재 -4, 명성 -3]' }] },
      { id: 'informant', text: '정보상에게 추적을 맡긴다', conditions: [{ type: 'npcJoined', npcId: 'npc_informant', value: true }], effects: [{ type: 'revealInvasionIntel', intelType: 'invaderCategory' }, { type: 'changeFame', amount: -2 }, { type: 'addLog', category: 'invasion', message: '정보상이 발자국의 주인과 이동 방향을 밝혀 소문을 차단했습니다. [명성 -2]' }] },
      { id: 'follow', text: '역으로 추적한다', effects: [{ type: 'setFlag', flag: 'intelligence_network_seed', value: true }, { type: 'changeFame', amount: 3 }, { type: 'addLog', category: 'invasion', message: '외부 연락망의 흔적을 확보했고 대담한 던전이라는 소문이 퍼졌습니다. [명성 +3]' }] },
    ],
  },
  {
    id: 'event_tainted_groundwater', title: '지하수 오염', text: '식수로 쓰던 지하수에 이상한 냄새가 섞였습니다.', conditions: [{ type: 'populationAtLeast', amount: 5 }], weight: 7, once: false, category: 'health', tags: ['daily', 'food'],
    choices: [
      { id: 'discard', text: '비축 식량과 물을 일부 버린다', effects: [{ type: 'addResource', resourceId: 'food', amount: -7 }, { type: 'addLog', category: 'warning', message: '오염된 비축분을 폐기했습니다. [식량 -7]' }] },
      { id: 'healer', text: '치료사에게 정화를 맡긴다 · 골드 3', conditions: [{ type: 'npcJoined', npcId: 'npc_healer', value: true }, { type: 'resourceAtLeast', resourceId: 'gold', amount: 3 }], effects: [{ type: 'addResource', resourceId: 'gold', amount: -3 }, { type: 'addResource', resourceId: 'food', amount: 2 }, { type: 'addLog', category: 'resource', message: '치료사가 물을 정화해 비축분을 지켰습니다. [골드 -3, 식량 +2]' }] },
      { id: 'boil', text: '마력으로 끓여 정화한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'mana', amount: 5 }], effects: [{ type: 'addResource', resourceId: 'mana', amount: -5 }, { type: 'addLog', category: 'event', message: '마력으로 물을 정화했습니다. [마력 -5]' }] },
    ],
  },
  {
    id: 'event_minor_mana_surge', title: '작은 마력 폭주', text: '마력실에서 제어되지 않은 불꽃이 튀기 시작했습니다.', conditions: [{ type: 'hasRoom', facilityId: 'mana_chamber' }], weight: 7, once: false, category: 'mana', tags: ['daily', 'hazard'],
    choices: [
      { id: 'vent', text: '마력을 외부로 흘려보낸다', effects: [{ type: 'addResource', resourceId: 'mana', amount: -6 }, { type: 'addLog', category: 'event', message: '마력을 소모해 폭주를 잠재웠습니다. [마력 -6]' }] },
      { id: 'mage', text: '마도사가 폭주를 수확한다', conditions: [{ type: 'npcJoined', npcId: 'npc_mage', value: true }], effects: [{ type: 'addResource', resourceId: 'mana', amount: 10 }, { type: 'setFlag', flag: 'arcane_surge_mastered', value: true }, { type: 'addLog', category: 'resource', message: '마도사가 폭주의 힘을 안전하게 저장했습니다. [마력 +10]' }] },
      { id: 'endure', text: '시설이 버티길 바란다', effects: [{ type: 'damageRandomRoom' }, { type: 'addResource', resourceId: 'mana', amount: 5 }, { type: 'addLog', category: 'warning', message: '마력은 남았지만 시설 하나가 손상되었습니다. [마력 +5]' }] },
    ],
  },
  {
    id: 'event_guard_abandoned_gear', title: '경비 중 발견한 장비', text: '경비대가 던전 바깥에서 버려진 방패와 도구를 회수했습니다.', conditions: [{ type: 'hasRoom', facilityId: 'guard_post' }], weight: 7, once: false, category: 'external', tags: ['daily', 'resource'],
    choices: [
      { id: 'salvage', text: '자재로 분해한다', effects: [{ type: 'addResource', resourceId: 'material', amount: 10 }, { type: 'changeFame', amount: 1 }, { type: 'addLog', category: 'resource', message: '장비를 분해한 흔적이 발견되었습니다. [자재 +10, 명성 +1]' }] },
      { id: 'blacksmith', text: '대장장이가 장비를 복원한다', conditions: [{ type: 'npcJoined', npcId: 'npc_blacksmith', value: true }], effects: [{ type: 'addResource', resourceId: 'gold', amount: 14 }, { type: 'addLog', category: 'resource', message: '복원한 장비를 좋은 값에 팔았습니다. [골드 +14]' }] },
      { id: 'bait', text: '가짜 흔적으로 활용한다', effects: [{ type: 'changeFame', amount: -2 }, { type: 'addLog', category: 'invasion', message: '장비를 미끼로 두어 던전에 관한 소문을 다른 길로 돌렸습니다. [명성 -2]' }] },
    ],
  },
  {
    id: 'event_outside_rumor', title: '외부에서 흘러온 소문', text: '지나가는 행상인들이 인간 원정대에 관한 엇갈린 소문을 전합니다.', conditions: [{ type: 'dayAtLeast', day: 7 }], weight: 7, once: false, category: 'external', tags: ['daily', 'rumor'],
    choices: [
      { id: 'pay', text: '골드를 내고 자세히 듣는다', conditions: [{ type: 'resourceAtLeast', resourceId: 'gold', amount: 5 }], effects: [{ type: 'addResource', resourceId: 'gold', amount: -5 }, { type: 'revealInvasionIntel', intelType: 'arrivalEstimate' }, { type: 'addLog', category: 'invasion', message: '원정대의 예상 도착 시점을 파악했습니다. [골드 -5]' }] },
      { id: 'tavern', text: '펍 주인이 소문의 출처를 대조한다', conditions: [{ type: 'npcJoined', npcId: 'npc_tavern_keeper', value: true }], effects: [{ type: 'changeFame', amount: -2 }, { type: 'addResource', resourceId: 'gold', amount: 3 }, { type: 'addLog', category: 'resource', message: '거짓 소문을 걸러내고 정보값도 챙겼습니다. [명성 -2, 골드 +3]' }] },
      { id: 'informant', text: '정보망으로 진위를 확인한다', conditions: [{ type: 'npcJoined', npcId: 'npc_informant', value: true }], effects: [{ type: 'revealInvasionIntel', intelType: 'powerRange' }, { type: 'revealInvasionIntel', intelType: 'arrivalEstimate' }, { type: 'addLog', category: 'invasion', message: '정보상이 소문의 진위를 가려 침입 정보를 갱신했습니다.' }] },
      { id: 'dismiss', text: '확인되지 않은 소문은 흘려듣는다', effects: [{ type: 'addLog', category: 'event', message: '확실한 정보가 아니라고 판단했습니다.' }] },
    ],
  },
  {
    id: 'event_abandoned_cart', title: '버려진 짐마차', text: '길목에 물자가 가득한 짐마차가 주인 없이 남겨져 있습니다.', conditions: [{ type: 'flagEquals', flag: 'merchant_trail_followed', value: false }, { type: 'flagEquals', flag: 'merchant_goods_taken', value: false }], weight: 9, once: true, category: 'npc_precursor', tags: ['daily', 'chain', 'merchant'],
    choices: [
      { id: 'take', text: '물자를 가져간다', effects: [{ type: 'addResource', resourceId: 'food', amount: 10 }, { type: 'addResource', resourceId: 'material', amount: 8 }, { type: 'setFlag', flag: 'merchant_goods_taken', value: true }, { type: 'addLog', category: 'warning', message: '마차 물자를 가져왔습니다. 누군가 돌려받으러 올 수 있습니다. [식량 +10, 자재 +8]' }] },
      { id: 'track', text: '자재를 써서 주인의 흔적을 찾는다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 4 }], effects: [{ type: 'addResource', resourceId: 'material', amount: -4 }, { type: 'setFlag', flag: 'merchant_trail_followed', value: true }, { type: 'addLog', category: 'event', message: '마차 주인의 이동 경로를 찾아 물자를 돌려주었습니다. [자재 -4]' }] },
      { id: 'ignore', text: '건드리지 않는다', effects: [{ type: 'addLog', category: 'event', message: '수상한 마차를 그대로 두었습니다.' }] },
    ],
  },
  {
    id: 'event_familiar_peddler', title: '낯익은 행상인', text: '짐마차의 주인으로 보이는 행상인이 던전 주변을 살핍니다.', conditions: [{ type: 'flagEquals', flag: 'merchant_trail_followed', value: true }], weight: 16, once: true, category: 'npc_precursor', tags: ['daily', 'chain', 'merchant'],
    choices: [
      { id: 'greet', text: '안전한 거래처를 제안한다', effects: [{ type: 'addResource', resourceId: 'gold', amount: 6 }, { type: 'addLog', category: 'resource', message: '행상인이 감사의 거래금을 남겼습니다. [골드 +6]' }] },
      { id: 'supplies', text: '식량을 할인 구매한다 · 골드 6', conditions: [{ type: 'resourceAtLeast', resourceId: 'gold', amount: 6 }], effects: [{ type: 'addResource', resourceId: 'gold', amount: -6 }, { type: 'addResource', resourceId: 'food', amount: 13 }, { type: 'addLog', category: 'resource', message: '행상인에게 식량을 할인받았습니다. [골드 -6, 식량 +13]' }] },
    ],
  },
  {
    id: 'event_broken_forge_tools', title: '부서진 대장간 도구', text: '이름이 새겨진 망치와 집게가 통로에 흩어져 있습니다.', conditions: [{ type: 'flagEquals', flag: 'forge_tools_kept', value: false }, { type: 'flagEquals', flag: 'forge_tools_scrapped', value: false }], weight: 9, once: true, category: 'npc_precursor', tags: ['daily', 'chain', 'blacksmith'],
    choices: [
      { id: 'scrap', text: '자재로 분해한다', effects: [{ type: 'addResource', resourceId: 'material', amount: 12 }, { type: 'setFlag', flag: 'forge_tools_scrapped', value: true }, { type: 'addLog', category: 'resource', message: '도구를 분해해 자재를 얻었습니다. [자재 +12]' }] },
      { id: 'keep', text: '주인이 찾을 수 있게 보관한다', effects: [{ type: 'setFlag', flag: 'forge_tools_kept', value: true }, { type: 'addLog', category: 'event', message: '부서진 도구를 손질해 보관했습니다.' }] },
    ],
  },
  {
    id: 'event_tools_owner', title: '도구의 주인', text: '거대한 가방을 멘 장인이 잃어버린 도구의 행방을 묻습니다.', conditions: [{ type: 'flagEquals', flag: 'forge_tools_kept', value: true }], weight: 16, once: true, category: 'npc_precursor', tags: ['daily', 'chain', 'blacksmith'],
    choices: [
      { id: 'return', text: '보관한 도구를 돌려준다', effects: [{ type: 'repairRandomRoom' }, { type: 'addLog', category: 'event', message: '장인이 답례로 손상 시설 하나를 고쳐 주었습니다.' }] },
      { id: 'trade', text: '자재와 교환한다', effects: [{ type: 'addResource', resourceId: 'material', amount: 8 }, { type: 'addLog', category: 'resource', message: '도구를 돌려주고 자재를 받았습니다. [자재 +8]' }] },
    ],
  },
  {
    id: 'event_wandering_mercenaries', title: '떠돌이 용병단', text: '지친 용병들이 하룻밤 묵을 곳을 찾습니다.', conditions: [{ type: 'tierAtLeast', level: 2 }], weight: 9, once: true, category: 'npc_precursor', tags: ['daily', 'chain', 'tavern'],
    choices: [
      { id: 'welcome', text: '식량을 제공한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'food', amount: 10 }], effects: [{ type: 'addResource', resourceId: 'food', amount: -10 }, { type: 'setFlag', flag: 'mercenaries_welcomed', value: true }, { type: 'addTimedModifier', modifierType: 'flatDefense', value: 8, durationDays: 2 }, { type: 'addLog', category: 'event', message: '용병들이 소문을 퍼뜨리고 이틀간 경계를 돕습니다. [식량 -10, 방어 +8]' }] },
      { id: 'charge', text: '숙박비를 받는다', effects: [{ type: 'addResource', resourceId: 'gold', amount: 12 }, { type: 'changeFame', amount: 5 }, { type: 'addLog', category: 'warning', message: '숙박비를 받았고 떠들썩한 던전의 소문이 퍼졌습니다. [골드 +12, 명성 +5]' }] },
      { id: 'expel', text: '쫓아낸다', effects: [{ type: 'addLog', category: 'event', message: '용병단을 던전 밖으로 돌려보냈습니다.' }] },
    ],
  },
  {
    id: 'event_mercenary_tales', title: '용병들이 남긴 소문', text: '환대받은 용병들이 믿을 만한 중개인 이야기를 남겼습니다.', conditions: [{ type: 'flagEquals', flag: 'mercenaries_welcomed', value: true }], weight: 16, once: true, category: 'npc_precursor', tags: ['daily', 'chain', 'tavern'],
    choices: [
      { id: 'listen', text: '연락 방법을 기록한다', effects: [{ type: 'addResource', resourceId: 'gold', amount: 5 }, { type: 'addLog', category: 'resource', message: '용병들의 남은 회비를 운영비로 받았습니다. [골드 +5]' }] },
      { id: 'prepare', text: '빈 공간을 접객 장소로 정리한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 5 }], effects: [{ type: 'addResource', resourceId: 'material', amount: -5 }, { type: 'addLog', category: 'event', message: '새 방문자를 맞을 자리를 마련했습니다. [자재 -5]' }] },
    ],
  },
  {
    id: 'event_arcane_mark', title: '마법 표식', text: '안정화한 마력의 흐름 위로 누군가 남긴 관측 표식이 떠오릅니다.', conditions: [{ type: 'flagEquals', flag: 'mana_stabilized', value: true }], weight: 15, once: true, category: 'npc_precursor', tags: ['daily', 'chain', 'mage'],
    choices: [
      { id: 'answer', text: '마력으로 응답한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'mana', amount: 5 }], effects: [{ type: 'addResource', resourceId: 'mana', amount: -5 }, { type: 'setFlag', flag: 'mage_contact_answered', value: true }, { type: 'addLog', category: 'event', message: '표식 너머의 관찰자에게 응답을 보냈습니다. [마력 -5]' }] },
      { id: 'study', text: '표식의 잔류 마력을 수거한다', effects: [{ type: 'addResource', resourceId: 'mana', amount: 7 }, { type: 'addLog', category: 'resource', message: '표식에서 잔류 마력을 수거했습니다. [마력 +7]' }] },
    ],
  },
  {
    id: 'event_wounded_traveler', title: '쓰러진 여행자', text: '던전 입구에서 심하게 다친 여행자가 도움을 청합니다.', conditions: [{ type: 'flagEquals', flag: 'compassionate_dungeon', value: false }], weight: 9, once: true, category: 'npc_precursor', tags: ['daily', 'chain', 'healer'],
    choices: [
      { id: 'treat', text: '식량과 붕대를 내어준다', conditions: [{ type: 'resourceAtLeast', resourceId: 'food', amount: 8 }], effects: [{ type: 'addResource', resourceId: 'food', amount: -8 }, { type: 'setFlag', flag: 'compassionate_dungeon', value: true }, { type: 'changeFame', amount: 2 }, { type: 'addLog', category: 'event', message: '여행자를 치료해 돌려보내 선행이 알려졌습니다. [식량 -8, 명성 +2]' }] },
      { id: 'search', text: '소지품만 챙겨 내보낸다', effects: [{ type: 'addResource', resourceId: 'gold', amount: 10 }, { type: 'changeFame', amount: 5 }, { type: 'addLog', category: 'warning', message: '소지품을 챙긴 던전에 관한 좋지 않은 소문이 퍼졌습니다. [골드 +10, 명성 +5]' }] },
    ],
  },
  {
    id: 'event_healers_rumor', title: '치유의 소문', text: '도움을 받은 여행자가 던전의 선행을 외부에 전했습니다.', conditions: [{ type: 'flagEquals', flag: 'compassionate_dungeon', value: true }], weight: 15, once: true, category: 'npc_precursor', tags: ['daily', 'chain', 'healer'],
    choices: [
      { id: 'accept', text: '답례 물자를 받는다', effects: [{ type: 'addResource', resourceId: 'food', amount: 9 }, { type: 'addLog', category: 'resource', message: '여행자들의 답례 물자를 받았습니다. [식량 +9]' }] },
      { id: 'clinic', text: '치료 공간을 미리 정돈한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 5 }], effects: [{ type: 'addResource', resourceId: 'material', amount: -5 }, { type: 'addLog', category: 'event', message: '방문 치료사를 맞을 공간을 정돈했습니다. [자재 -5]' }] },
    ],
  },
  {
    id: 'event_coded_scout_note', title: '암호화된 정찰 문서', text: '인간 정찰대가 떨어뜨린 문서에 여러 이동 경로가 암호로 적혀 있습니다.', conditions: [{ type: 'flagEquals', flag: 'adventurer_scouted', value: true }, { type: 'flagEquals', flag: 'intelligence_network_seed', value: false }], weight: 15, once: true, category: 'npc_precursor', tags: ['daily', 'chain', 'informant'],
    choices: [
      { id: 'decode', text: '마력을 써서 숨은 글자를 드러낸다', conditions: [{ type: 'resourceAtLeast', resourceId: 'mana', amount: 6 }], effects: [{ type: 'addResource', resourceId: 'mana', amount: -6 }, { type: 'setFlag', flag: 'intelligence_network_seed', value: true }, { type: 'revealInvasionIntel', intelType: 'powerRange' }, { type: 'addLog', category: 'invasion', message: '연락망의 암호와 침입 전력을 해독했습니다. [마력 -6]' }] },
      { id: 'sell', text: '장물아비에게 넘긴다', effects: [{ type: 'addResource', resourceId: 'gold', amount: 9 }, { type: 'changeFame', amount: 3 }, { type: 'addLog', category: 'warning', message: '문서를 팔아 던전의 정보가 퍼졌습니다. [골드 +9, 명성 +3]' }] },
    ],
  },
  {
    id: 'event_supply_shortage', title: '시설 보수 물자 부족', text: '여러 시설에서 동시에 작은 보수 요청이 올라왔습니다.', conditions: [{ type: 'roomCountAtLeast', amount: 7 }], weight: 7, once: false, category: 'economy', tags: ['daily', 'gold'],
    choices: [
      { id: 'material', text: '비축 자재로 일괄 보수한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 10 }], effects: [{ type: 'addResource', resourceId: 'material', amount: -10 }, { type: 'repairRandomRoom' }, { type: 'addLog', category: 'event', message: '비축 자재로 시설을 보수했습니다. [자재 -10]' }] },
      { id: 'merchant', text: '상인에게 급히 자재를 주문한다 · 골드 8', conditions: [{ type: 'npcJoined', npcId: 'npc_merchant', value: true }, { type: 'resourceAtLeast', resourceId: 'gold', amount: 8 }], effects: [{ type: 'addResource', resourceId: 'gold', amount: -8 }, { type: 'addResource', resourceId: 'material', amount: 11 }, { type: 'addLog', category: 'resource', message: '상인이 긴급 자재를 공급했습니다. [골드 -8, 자재 +11]' }] },
      { id: 'blacksmith', text: '대장장이에게 응급 보수를 맡긴다 · 골드 5', conditions: [{ type: 'npcJoined', npcId: 'npc_blacksmith', value: true }, { type: 'resourceAtLeast', resourceId: 'gold', amount: 5 }], effects: [{ type: 'addResource', resourceId: 'gold', amount: -5 }, { type: 'repairRandomRoom' }, { type: 'addLog', category: 'event', message: '대장장이가 적은 비용으로 응급 보수를 끝냈습니다. [골드 -5]' }] },
      { id: 'defer', text: '급한 곳만 임시로 막는다', effects: [{ type: 'damageRandomRoom' }, { type: 'addLog', category: 'warning', message: '물자가 부족해 시설 하나의 손상을 막지 못했습니다.' }] },
    ],
  },
]
