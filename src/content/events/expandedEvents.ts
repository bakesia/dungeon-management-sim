import type { EventDefinition } from '../../types/content'

// v0.1.4의 운영 이벤트 묶음. 후속 이벤트는 flag 조건만으로 연결해
// 이벤트 엔진에 콘텐츠별 분기를 만들지 않는다.
export const expandedEventDefinitions: EventDefinition[] = [
  {
    id: 'event_unstable_vein', title: '불안정한 광맥', text: '풍부한 광맥 위로 금이 간 천장이 위태롭게 흔들립니다.',
    conditions: [{ type: 'dayAtLeast', day: 4 }], weight: 7, once: false, tags: ['resource', 'hazard'],
    choices: [
      { id: 'careful', text: '지지대를 세우고 채굴한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 5 }], effects: [{ type: 'addResource', resourceId: 'material', amount: 11 }, { type: 'addResource', resourceId: 'gold', amount: -3 }, { type: 'addLog', category: 'resource', message: '안전하게 광맥을 캤습니다. [자재 +11, 골드 -3]' }] },
      { id: 'rush', text: '무리해서 한꺼번에 캐낸다', effects: [{ type: 'addResource', resourceId: 'material', amount: 18 }, { type: 'damageRandomRoom' }, { type: 'addLog', category: 'warning', message: '많은 자재를 얻었지만 진동으로 시설 하나가 손상되었습니다. [자재 +18]' }] },
    ],
  },
  {
    id: 'event_old_storehouse', title: '폐쇄된 저장고', text: '막힌 통로 뒤에서 오래된 보급품 상자를 발견했습니다.',
    conditions: [], weight: 6, once: true, tags: ['discovery', 'resource'],
    choices: [
      { id: 'open', text: '상자를 연다', effects: [{ type: 'addResource', resourceId: 'food', amount: 12 }, { type: 'addResource', resourceId: 'material', amount: 7 }, { type: 'addLog', category: 'resource', message: '쓸 만한 보급품을 건졌습니다. [식량 +12, 자재 +7]' }] },
      { id: 'sell', text: '상자째 상인에게 넘긴다', effects: [{ type: 'addResource', resourceId: 'gold', amount: 14 }, { type: 'addLog', category: 'resource', message: '낡은 상자를 골드로 바꾸었습니다. [골드 +14]' }] },
    ],
  },
  {
    id: 'event_mana_crystal_cluster', title: '마력 결정 군락', text: '희미한 빛을 내는 결정이 암벽 전체에 번져 있습니다.',
    conditions: [{ type: 'tierAtLeast', level: 2 }], weight: 6, once: false, tags: ['mana', 'resource'],
    choices: [
      { id: 'extract', text: '결정을 떼어낸다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 4 }], effects: [{ type: 'addResource', resourceId: 'mana', amount: 13 }, { type: 'addResource', resourceId: 'material', amount: -4 }, { type: 'addLog', category: 'resource', message: '채굴 도구를 소모해 마력 결정을 얻었습니다. [마력 +13, 자재 -4]' }] },
      { id: 'stabilize', text: '주변 마력 흐름을 안정시킨다', effects: [{ type: 'changeCoreHp', amount: 8 }, { type: 'addLog', category: 'event', message: '결정의 기운이 코어를 보강했습니다. [코어 HP +8]' }] },
    ],
  },
  {
    id: 'event_deep_salt', title: '깊은 암염층', text: '식량 보존에 쓸 수 있는 암염층이 드러났습니다.',
    conditions: [{ type: 'hasRoom', facilityId: 'mine' }], weight: 6, once: true, tags: ['food', 'resource'],
    choices: [
      { id: 'preserve', text: '식량 보존에 사용한다', effects: [{ type: 'addResource', resourceId: 'food', amount: 16 }, { type: 'addLog', category: 'resource', message: '암염으로 비축 식량의 손실을 줄였습니다. [식량 +16]' }] },
      { id: 'trade', text: '희귀 광물로 판매한다', effects: [{ type: 'addResource', resourceId: 'gold', amount: 12 }, { type: 'addLog', category: 'resource', message: '암염을 판매했습니다. [골드 +12]' }] },
    ],
  },
  {
    id: 'event_hungry_goblins', title: '굶주린 고블린 무리', text: '떠돌이 고블린들이 먹을 것을 대가로 정착을 청합니다.',
    conditions: [{ type: 'populationSpaceAtLeast', amount: 2 }, { type: 'resourceAtLeast', resourceId: 'food', amount: 8 }], weight: 7, once: false, tags: ['population'],
    choices: [
      { id: 'accept', text: '식량을 내주고 받아들인다', effects: [{ type: 'addResource', resourceId: 'food', amount: -8 }, { type: 'addPopulation', raceId: 'goblin', jobId: 'worker', amount: 2 }, { type: 'addLog', category: 'event', message: '고블린 노동자 2명이 합류했습니다. [식량 -8]' }] },
      { id: 'hire_one', text: '한 명만 고용한다', effects: [{ type: 'addResource', resourceId: 'gold', amount: -5 }, { type: 'addPopulation', raceId: 'goblin', jobId: 'worker', amount: 1 }, { type: 'addLog', category: 'event', message: '고블린 노동자 1명을 고용했습니다. [골드 -5]' }] },
      { id: 'refuse', text: '돌려보낸다', effects: [{ type: 'addLog', category: 'event', message: '무리는 다른 은신처를 찾아 떠났습니다.' }] },
    ],
  },
  {
    id: 'event_guard_dispute', title: '경비 교대 갈등', text: '긴 교대 시간 때문에 경비병과 노동자 사이에 언쟁이 벌어졌습니다.',
    conditions: [{ type: 'populationAtLeast', amount: 6 }], weight: 6, once: false, tags: ['population', 'internal'],
    choices: [
      { id: 'bonus', text: '경비병에게 수당을 지급한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'gold', amount: 7 }], effects: [{ type: 'addResource', resourceId: 'gold', amount: -7 }, { type: 'addLog', category: 'event', message: '수당을 지급해 교대 갈등을 잠재웠습니다. [골드 -7]' }] },
      { id: 'rations', text: '모두에게 추가 배식을 한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'food', amount: 6 }], effects: [{ type: 'addResource', resourceId: 'food', amount: -6 }, { type: 'addLog', category: 'event', message: '따뜻한 식사가 불만을 누그러뜨렸습니다. [식량 -6]' }] },
      { id: 'ignore', text: '각자 해결하게 둔다', effects: [{ type: 'addLog', category: 'warning', message: '불만은 남았지만 당장의 업무는 계속됩니다.' }] },
    ],
  },
  {
    id: 'event_wounded_orc', title: '부상당한 오크', text: '던전 입구에 홀로 쓰러진 오크 전사가 발견되었습니다.',
    conditions: [{ type: 'dayAtLeast', day: 5 }, { type: 'flagEquals', flag: 'wounded_orc_helped', value: false }], weight: 7, once: true, tags: ['population', 'chain'],
    choices: [
      { id: 'help', text: '식량과 약재를 건넨다', conditions: [{ type: 'resourceAtLeast', resourceId: 'food', amount: 7 }], effects: [{ type: 'addResource', resourceId: 'food', amount: -7 }, { type: 'setFlag', flag: 'wounded_orc_helped', value: true }, { type: 'addLog', category: 'event', message: '오크는 은혜를 잊지 않겠다며 떠났습니다. [식량 -7]' }] },
      { id: 'rob', text: '장비를 빼앗아 내쫓는다', effects: [{ type: 'addResource', resourceId: 'material', amount: 9 }, { type: 'setFlag', flag: 'wounded_orc_helped', value: false }, { type: 'addLog', category: 'warning', message: '오크의 장비를 자재로 회수했습니다. [자재 +9]' }] },
    ],
  },
  {
    id: 'event_orc_returns', title: '돌아온 오크', text: '도움을 받았던 오크가 동료 한 명과 함께 던전으로 돌아왔습니다.',
    conditions: [{ type: 'flagEquals', flag: 'wounded_orc_helped', value: true }, { type: 'populationSpaceAtLeast', amount: 2 }], weight: 16, once: true, tags: ['population', 'chain'],
    choices: [
      { id: 'guards', text: '경비병으로 맞이한다', effects: [{ type: 'addPopulation', raceId: 'orc', jobId: 'guard', amount: 2 }, { type: 'addLog', category: 'event', message: '오크 경비병 2명이 은혜를 갚기 위해 합류했습니다.' }] },
      { id: 'gift', text: '정착 대신 보급품을 받는다', effects: [{ type: 'addResource', resourceId: 'gold', amount: 18 }, { type: 'addResource', resourceId: 'food', amount: 8 }, { type: 'addLog', category: 'resource', message: '오크의 보급품을 받았습니다. [골드 +18, 식량 +8]' }] },
    ],
  },
  {
    id: 'event_lost_imp', title: '길 잃은 임프', text: '마력 냄새를 따라온 어린 임프가 통로에서 서성입니다.',
    conditions: [{ type: 'populationSpaceAtLeast', amount: 1 }, { type: 'tierAtLeast', level: 2 }], weight: 6, once: false, tags: ['population', 'mana'],
    choices: [
      { id: 'welcome', text: '마력을 나누고 받아들인다', conditions: [{ type: 'resourceAtLeast', resourceId: 'mana', amount: 6 }], effects: [{ type: 'addResource', resourceId: 'mana', amount: -6 }, { type: 'addPopulation', raceId: 'imp', jobId: 'worker', amount: 1 }, { type: 'addLog', category: 'event', message: '임프 노동자 1명이 합류했습니다. [마력 -6]' }] },
      { id: 'directions', text: '지상으로 나가는 길을 알려준다', effects: [{ type: 'addLog', category: 'event', message: '임프는 연신 고개를 숙이며 떠났습니다.' }] },
    ],
  },
  {
    id: 'event_fungal_overgrowth', title: '균사 과증식', text: '균사가 통로를 넘어 인접 시설까지 번지기 시작했습니다.',
    conditions: [{ type: 'hasRoom', facilityId: 'fungus_farm' }], weight: 7, once: false, tags: ['internal', 'food'],
    choices: [
      { id: 'prune', text: '자재를 써서 번진 균사를 걷어낸다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 5 }], effects: [{ type: 'addResource', resourceId: 'material', amount: -5 }, { type: 'addResource', resourceId: 'food', amount: 7 }, { type: 'addLog', category: 'resource', message: '통로를 정리하며 식용 균사를 수확했습니다. [자재 -5, 식량 +7]' }] },
      { id: 'harvest_all', text: '전부 수확한다', effects: [{ type: 'addResource', resourceId: 'food', amount: 16 }, { type: 'damageRandomRoom' }, { type: 'addLog', category: 'warning', message: '식량은 늘었지만 뿌리를 뜯는 과정에서 시설 하나가 손상되었습니다. [식량 +16]' }] },
    ],
  },
  {
    id: 'event_facility_leak', title: '시설 누수', text: '천장에서 스며든 물이 시설 기초를 약하게 만들고 있습니다.',
    conditions: [{ type: 'roomCountAtLeast', amount: 5 }], weight: 7, once: false, tags: ['internal', 'damage'],
    choices: [
      { id: 'patch', text: '즉시 보수한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 8 }], effects: [{ type: 'addResource', resourceId: 'material', amount: -8 }, { type: 'repairRandomRoom' }, { type: 'addLog', category: 'event', message: '누수를 막고 손상된 시설도 함께 정비했습니다. [자재 -8]' }] },
      { id: 'bucket', text: '임시로 물받이만 둔다', effects: [{ type: 'damageRandomRoom' }, { type: 'addLog', category: 'warning', message: '임시 조치가 버티지 못해 시설 하나가 손상되었습니다.' }] },
    ],
  },
  {
    id: 'event_underground_tremor', title: '지하 진동', text: '낮고 긴 굉음과 함께 던전 전체가 흔들립니다.',
    conditions: [{ type: 'tierAtLeast', level: 2 }], weight: 5, once: false, tags: ['internal', 'damage'],
    choices: [
      { id: 'brace', text: '긴급 지지대를 설치한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 10 }], effects: [{ type: 'addResource', resourceId: 'material', amount: -10 }, { type: 'addLog', category: 'event', message: '지지대가 시설의 붕괴를 막았습니다. [자재 -10]' }] },
      { id: 'evacuate', text: '주민부터 대피시킨다', effects: [{ type: 'damageRandomRoom' }, { type: 'addLog', category: 'warning', message: '주민은 무사하지만 시설 하나가 손상되었습니다.' }] },
    ],
  },
  {
    id: 'event_vermin_nest', title: '지하 해충 둥지', text: '비축 식량 근처에서 커다란 해충의 흔적이 발견되었습니다.',
    conditions: [{ type: 'resourceAtLeast', resourceId: 'food', amount: 12 }], weight: 7, once: false, tags: ['internal', 'food'],
    choices: [
      { id: 'trap', text: '자재로 덫을 놓는다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 4 }], effects: [{ type: 'addResource', resourceId: 'material', amount: -4 }, { type: 'addResource', resourceId: 'food', amount: 3 }, { type: 'addLog', category: 'resource', message: '해충을 잡아 식량 손실을 막았습니다. [자재 -4, 식량 +3]' }] },
      { id: 'discard', text: '오염된 식량을 버린다', effects: [{ type: 'addResource', resourceId: 'food', amount: -8 }, { type: 'addLog', category: 'warning', message: '오염된 식량을 폐기했습니다. [식량 -8]' }] },
    ],
  },
  {
    id: 'event_suspicious_merchant', title: '수상한 장물아비', text: '얼굴을 가린 장물아비가 출처를 묻지 말라며 거래를 제안합니다.',
    conditions: [{ type: 'tierAtLeast', level: 2 }], weight: 6, once: false, tags: ['trade', 'external'],
    choices: [
      { id: 'buy_material', text: '자재 묶음을 산다', conditions: [{ type: 'resourceAtLeast', resourceId: 'gold', amount: 12 }], effects: [{ type: 'addResource', resourceId: 'gold', amount: -12 }, { type: 'addResource', resourceId: 'material', amount: 22 }, { type: 'addLog', category: 'resource', message: '수상하지만 쓸 만한 자재를 샀습니다. [골드 -12, 자재 +22]' }] },
      { id: 'seize', text: '물건을 압수하고 쫓아낸다', effects: [{ type: 'addResource', resourceId: 'material', amount: 8 }, { type: 'changeCoreHp', amount: -3 }, { type: 'addLog', category: 'warning', message: '장물아비가 도주하며 코어 통로를 훼손했습니다. [자재 +8, 코어 HP -3]' }] },
      { id: 'decline', text: '거래하지 않는다', effects: [{ type: 'addLog', category: 'event', message: '장물아비는 어둠 속으로 사라졌습니다.' }] },
    ],
  },
  {
    id: 'event_adventurer_camp', title: '인간 정찰 야영지', text: '입구 바깥에 소규모 정찰대의 야영 흔적이 보입니다.',
    conditions: [{ type: 'dayAtLeast', day: 7 }, { type: 'flagEquals', flag: 'scout_camp_investigated', value: false }], weight: 7, once: true, tags: ['external', 'chain'],
    choices: [
      { id: 'observe', text: '멀리서 이동 경로를 관찰한다', effects: [{ type: 'setFlag', flag: 'scout_camp_investigated', value: true }, { type: 'addLog', category: 'invasion', message: '정찰대의 이동 경로와 교대 시간을 파악했습니다.' }] },
      { id: 'raid', text: '빈 야영지를 급습한다', effects: [{ type: 'addResource', resourceId: 'gold', amount: 13 }, { type: 'addResource', resourceId: 'food', amount: 9 }, { type: 'setFlag', flag: 'scout_camp_raided', value: true }, { type: 'addLog', category: 'resource', message: '야영지의 보급품을 가져왔습니다. [골드 +13, 식량 +9]' }] },
    ],
  },
  {
    id: 'event_scouts_return', title: '정찰대의 귀환', text: '관찰했던 정찰대가 보급품을 짊어진 채 같은 경로로 돌아옵니다.',
    conditions: [{ type: 'flagEquals', flag: 'scout_camp_investigated', value: true }], weight: 15, once: true, tags: ['external', 'chain'],
    choices: [
      { id: 'ambush', text: '약점을 이용해 매복한다', effects: [{ type: 'addResource', resourceId: 'gold', amount: 20 }, { type: 'addResource', resourceId: 'material', amount: 10 }, { type: 'addLog', category: 'invasion', message: '정찰대를 몰아내고 보급품을 확보했습니다. [골드 +20, 자재 +10]' }] },
      { id: 'mislead', text: '가짜 흔적으로 다른 길로 유도한다', effects: [{ type: 'addLog', category: 'invasion', message: '정찰대가 엉뚱한 계곡으로 향했습니다.' }] },
    ],
  },
  {
    id: 'event_mana_vortex', title: '작은 마력 소용돌이', text: '빈 공간에 불안정한 마력 소용돌이가 생겨났습니다.',
    conditions: [{ type: 'tierAtLeast', level: 2 }, { type: 'flagEquals', flag: 'mana_vortex_harvested', value: false }], weight: 6, once: true, tags: ['mana', 'chain'],
    choices: [
      { id: 'harvest', text: '마력을 추출한다', effects: [{ type: 'addResource', resourceId: 'mana', amount: 18 }, { type: 'changeCoreHp', amount: -4 }, { type: 'setFlag', flag: 'mana_vortex_harvested', value: true }, { type: 'addLog', category: 'warning', message: '소용돌이를 흡수해 마력을 얻었지만 코어가 흔들렸습니다. [마력 +18, 코어 HP -4]' }] },
      { id: 'seal', text: '자재로 봉인한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 6 }], effects: [{ type: 'addResource', resourceId: 'material', amount: -6 }, { type: 'addLog', category: 'event', message: '소용돌이를 안전하게 봉인했습니다. [자재 -6]' }] },
    ],
  },
  {
    id: 'event_residual_mana', title: '남겨진 마력 잔향', text: '소용돌이를 흡수한 자리에 작은 마력 결정들이 자라났습니다.',
    conditions: [{ type: 'flagEquals', flag: 'mana_vortex_harvested', value: true }], weight: 14, once: true, tags: ['mana', 'chain'],
    choices: [
      { id: 'collect', text: '결정을 수거한다', effects: [{ type: 'addResource', resourceId: 'mana', amount: 12 }, { type: 'addLog', category: 'resource', message: '잔향에서 마력 결정을 수거했습니다. [마력 +12]' }] },
      { id: 'repair', text: '결정의 힘으로 시설을 복구한다', effects: [{ type: 'repairRandomRoom' }, { type: 'addLog', category: 'event', message: '마력 잔향이 손상된 시설 하나를 복구했습니다.' }] },
    ],
  },
  {
    id: 'event_strange_egg', title: '정체불명의 알', text: '따뜻한 암반 틈에서 단단한 회색 알 하나를 발견했습니다.',
    conditions: [{ type: 'flagEquals', flag: 'strange_egg_kept', value: false }], weight: 6, once: true, tags: ['mystery', 'chain'],
    choices: [
      { id: 'keep', text: '보온하며 지켜본다', conditions: [{ type: 'resourceAtLeast', resourceId: 'food', amount: 4 }], effects: [{ type: 'addResource', resourceId: 'food', amount: -4 }, { type: 'setFlag', flag: 'strange_egg_kept', value: true }, { type: 'addLog', category: 'event', message: '알을 숙소 한편에 보관했습니다. [식량 -4]' }] },
      { id: 'sell', text: '희귀품으로 판매한다', effects: [{ type: 'addResource', resourceId: 'gold', amount: 16 }, { type: 'addLog', category: 'resource', message: '정체불명의 알을 판매했습니다. [골드 +16]' }] },
    ],
  },
  {
    id: 'event_egg_hatches', title: '알에서 깨어난 것', text: '회색 알이 갈라지고 온순한 지하 도마뱀이 모습을 드러냈습니다.',
    conditions: [{ type: 'flagEquals', flag: 'strange_egg_kept', value: true }], weight: 15, once: true, tags: ['mystery', 'chain'],
    choices: [
      { id: 'raise', text: '던전 짐꾼으로 기른다', effects: [{ type: 'addResource', resourceId: 'material', amount: 15 }, { type: 'addLog', category: 'resource', message: '도마뱀이 무거운 돌을 나르기 시작했습니다. [자재 +15]' }] },
      { id: 'release', text: '깊은 동굴로 돌려보낸다', effects: [{ type: 'addResource', resourceId: 'mana', amount: 8 }, { type: 'addLog', category: 'event', message: '도마뱀이 떠난 자리에서 마력 결정이 발견되었습니다. [마력 +8]' }] },
    ],
  },
  {
    id: 'event_sealed_stone_gate', title: '봉인된 석문', text: '고대 문양이 새겨진 석문이 굴착로 끝에서 모습을 드러냈습니다.',
    conditions: [{ type: 'tierAtLeast', level: 3 }, { type: 'flagEquals', flag: 'stone_gate_unsealed', value: false }], weight: 5, once: true, tags: ['mystery', 'chain'],
    choices: [
      { id: 'unseal', text: '마력을 주입해 봉인을 푼다', conditions: [{ type: 'resourceAtLeast', resourceId: 'mana', amount: 12 }], effects: [{ type: 'addResource', resourceId: 'mana', amount: -12 }, { type: 'setFlag', flag: 'stone_gate_unsealed', value: true }, { type: 'addLog', category: 'event', message: '석문의 봉인이 천천히 풀리기 시작했습니다. [마력 -12]' }] },
      { id: 'chip', text: '표면의 장식을 떼어낸다', effects: [{ type: 'addResource', resourceId: 'gold', amount: 15 }, { type: 'addLog', category: 'resource', message: '석문의 장식을 팔았습니다. [골드 +15]' }] },
    ],
  },
  {
    id: 'event_stone_gate_opens', title: '석문 너머의 제단', text: '봉인이 풀린 석문 뒤에서 온전한 지하 제단이 발견되었습니다.',
    conditions: [{ type: 'flagEquals', flag: 'stone_gate_unsealed', value: true }], weight: 14, once: true, tags: ['mystery', 'chain'],
    choices: [
      { id: 'drain', text: '제단의 마력을 흡수한다', effects: [{ type: 'addResource', resourceId: 'mana', amount: 28 }, { type: 'damageRandomRoom' }, { type: 'addLog', category: 'warning', message: '강한 마력을 얻었지만 역류로 시설 하나가 손상되었습니다. [마력 +28]' }] },
      { id: 'salvage', text: '제단을 해체해 자재로 쓴다', effects: [{ type: 'addResource', resourceId: 'material', amount: 24 }, { type: 'addResource', resourceId: 'gold', amount: 8 }, { type: 'addLog', category: 'resource', message: '제단을 안전하게 해체했습니다. [자재 +24, 골드 +8]' }] },
    ],
  },
  {
    id: 'event_old_passage', title: '오래된 우회로', text: '무너진 벽 너머로 던전 내부를 잇는 좁은 우회로가 보입니다.',
    conditions: [{ type: 'roomCountAtLeast', amount: 7 }], weight: 5, once: true, tags: ['internal'],
    choices: [
      { id: 'reinforce', text: '통로를 보강한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 9 }], effects: [{ type: 'addResource', resourceId: 'material', amount: -9 }, { type: 'repairRandomRoom' }, { type: 'addLog', category: 'event', message: '우회로와 주변 시설을 함께 보강했습니다. [자재 -9]' }] },
      { id: 'strip', text: '버팀목만 회수한다', effects: [{ type: 'addResource', resourceId: 'material', amount: 10 }, { type: 'addLog', category: 'resource', message: '낡은 버팀목을 자재로 회수했습니다. [자재 +10]' }] },
    ],
  },
  {
    id: 'event_red_mist', title: '붉은 안개', text: '입구 쪽 통로로 정체를 알 수 없는 붉은 안개가 스며듭니다.',
    conditions: [{ type: 'tierAtLeast', level: 3 }], weight: 5, once: false, tags: ['hazard', 'mana'],
    choices: [
      { id: 'dispel', text: '마력으로 안개를 밀어낸다', conditions: [{ type: 'resourceAtLeast', resourceId: 'mana', amount: 9 }], effects: [{ type: 'addResource', resourceId: 'mana', amount: -9 }, { type: 'addLog', category: 'event', message: '붉은 안개를 던전 밖으로 밀어냈습니다. [마력 -9]' }] },
      { id: 'seal_rooms', text: '시설 문을 닫고 지나가길 기다린다', conditions: [{ type: 'resourceAtLeast', resourceId: 'food', amount: 6 }], effects: [{ type: 'addResource', resourceId: 'food', amount: -6 }, { type: 'damageRandomRoom' }, { type: 'addLog', category: 'warning', message: '긴 대피로 식량을 소모했고 시설 하나가 부식되었습니다. [식량 -6]' }] },
    ],
  },
  {
    id: 'event_abandoned_gear', title: '버려진 모험가 장비', text: '녹슨 검과 찢어진 배낭이 통로 구석에 놓여 있습니다.',
    conditions: [{ type: 'dayAtLeast', day: 6 }], weight: 7, once: false, tags: ['external', 'resource'],
    choices: [
      { id: 'salvage', text: '금속을 자재로 회수한다', effects: [{ type: 'addResource', resourceId: 'material', amount: 9 }, { type: 'addLog', category: 'resource', message: '장비를 해체해 자재를 얻었습니다. [자재 +9]' }] },
      { id: 'sell', text: '상인에게 되판다', effects: [{ type: 'addResource', resourceId: 'gold', amount: 8 }, { type: 'addLog', category: 'resource', message: '쓸 만한 장비를 골드로 바꿨습니다. [골드 +8]' }] },
    ],
  },
  {
    id: 'event_infirmary_volunteers', title: '의무실 자원봉사', text: '주민들이 자발적으로 낡은 치료 도구를 정비하겠다고 나섰습니다.',
    conditions: [{ type: 'hasRoom', facilityId: 'infirmary' }], weight: 6, once: false, tags: ['internal', 'repair'],
    choices: [
      { id: 'fund', text: '정비 비용을 지원한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'gold', amount: 8 }], effects: [{ type: 'addResource', resourceId: 'gold', amount: -8 }, { type: 'repairRandomRoom' }, { type: 'addLog', category: 'event', message: '치료대와 함께 손상 시설 하나를 정비했습니다. [골드 -8]' }] },
      { id: 'thank', text: '노고만 치하한다', effects: [{ type: 'addLog', category: 'event', message: '주민들이 가능한 범위에서 치료 도구를 손봤습니다.' }] },
    ],
  },
  {
    id: 'event_watch_signal', title: '감시 초소의 신호', text: '감시병이 먼 산길에서 수상한 횃불 행렬을 발견했습니다.',
    conditions: [{ type: 'hasRoom', facilityId: 'watch_post' }], weight: 6, once: false, tags: ['external', 'defense'],
    choices: [
      { id: 'prepare', text: '방어 물자를 미리 배치한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'material', amount: 6 }], effects: [{ type: 'addResource', resourceId: 'material', amount: -6 }, { type: 'addLog', category: 'invasion', message: '감시 신호에 따라 방어 물자를 배치했습니다. [자재 -6]' }] },
      { id: 'trade', text: '행렬에 은밀히 접근해 거래한다', conditions: [{ type: 'resourceAtLeast', resourceId: 'gold', amount: 10 }], effects: [{ type: 'addResource', resourceId: 'gold', amount: -10 }, { type: 'addResource', resourceId: 'food', amount: 18 }, { type: 'addLog', category: 'resource', message: '여행자들과 식량을 거래했습니다. [골드 -10, 식량 +18]' }] },
    ],
  },
]
