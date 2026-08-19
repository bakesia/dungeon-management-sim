import type { ConditionDefinition, EffectDefinition, EventChoiceDefinition, EventDefinition, ResourceCost } from '../../types/content'
import { npcDefinitionById, npcDefinitions } from '../npcs/npcs'

interface JoinChoice {
  id: string
  text: string
  conditions: ConditionDefinition[]
  cost: ResourceCost
}

const joinChoicesByNpc: Record<string, JoinChoice[]> = {
  npc_merchant: [
    { id: 'discount', text: '거래소를 맡긴다 · 골드 15', conditions: [{ type: 'flagEquals', flag: 'merchant_trail_followed', value: true }, { type: 'flagEquals', flag: 'merchant_goods_taken', value: false }], cost: { gold: 15 } },
    { id: 'surcharge', text: '배상하고 거래소를 맡긴다 · 골드 45', conditions: [{ type: 'flagEquals', flag: 'merchant_goods_taken', value: true }], cost: { gold: 45 } },
    { id: 'standard', text: '거래소를 맡긴다 · 골드 30', conditions: [{ type: 'flagEquals', flag: 'merchant_trail_followed', value: false }, { type: 'flagEquals', flag: 'merchant_goods_taken', value: false }], cost: { gold: 30 } },
  ],
  npc_blacksmith: [
    { id: 'discount', text: '작업장을 내준다 · 골드 10 / 자재 15', conditions: [{ type: 'flagEquals', flag: 'forge_tools_kept', value: true }, { type: 'flagEquals', flag: 'forge_tools_scrapped', value: false }], cost: { gold: 10, material: 15 } },
    { id: 'surcharge', text: '도구값을 치르고 맡긴다 · 골드 30 / 자재 40', conditions: [{ type: 'flagEquals', flag: 'forge_tools_scrapped', value: true }], cost: { gold: 30, material: 40 } },
    { id: 'standard', text: '작업장을 내준다 · 골드 20 / 자재 30', conditions: [{ type: 'flagEquals', flag: 'forge_tools_kept', value: false }, { type: 'flagEquals', flag: 'forge_tools_scrapped', value: false }], cost: { gold: 20, material: 30 } },
  ],
  npc_tavern_keeper: [
    { id: 'discount', text: '주점을 열게 한다 · 골드 20 / 식량 10', conditions: [{ type: 'flagEquals', flag: 'mercenaries_welcomed', value: true }], cost: { gold: 20, food: 10 } },
    { id: 'standard', text: '주점을 열게 한다 · 골드 40 / 식량 15', conditions: [{ type: 'flagEquals', flag: 'mercenaries_welcomed', value: false }], cost: { gold: 40, food: 15 } },
  ],
  npc_mage: [
    { id: 'discount', text: '연구를 허가한다 · 마력 15', conditions: [{ type: 'flagEquals', flag: 'mana_stabilized', value: true }], cost: { mana: 15 } },
    { id: 'standard', text: '연구를 허가한다 · 마력 30', conditions: [{ type: 'flagEquals', flag: 'mana_stabilized', value: false }], cost: { mana: 30 } },
  ],
  npc_healer: [
    { id: 'discount', text: '치료소를 맡긴다 · 골드 15 / 식량 10', conditions: [{ type: 'flagEquals', flag: 'compassionate_dungeon', value: true }], cost: { gold: 15, food: 10 } },
    { id: 'standard', text: '치료소를 맡긴다 · 골드 25 / 식량 20', conditions: [{ type: 'flagEquals', flag: 'compassionate_dungeon', value: false }], cost: { gold: 25, food: 20 } },
  ],
  npc_informant: [
    { id: 'discount', text: '정보망을 받아들인다 · 골드 20', conditions: [{ type: 'flagEquals', flag: 'intelligence_network_seed', value: true }], cost: { gold: 20 } },
    { id: 'standard', text: '정보망을 받아들인다 · 골드 35', conditions: [{ type: 'flagEquals', flag: 'intelligence_network_seed', value: false }], cost: { gold: 35 } },
  ],
}

function createJoinEffects(npcId: string, cost: ResourceCost): EffectDefinition[] {
  return [
    ...Object.entries(cost).map(([resourceId, amount]) => ({ type: 'addResource' as const, resourceId, amount: -amount })),
    { type: 'joinNpc', npcId },
    { type: 'addLog', category: 'progression', message: `${npcDefinitionById[npcId]?.displayName ?? npcId}가 합류했습니다.` },
  ]
}

function createJoinChoices(npcId: string): EventChoiceDefinition[] {
  return [
    ...(joinChoicesByNpc[npcId] ?? []).map((choice) => ({
      id: choice.id,
      text: choice.text,
      conditions: [
        ...choice.conditions,
        ...Object.entries(choice.cost).map(([resourceId, amount]) => ({ type: 'resourceAtLeast' as const, resourceId, amount })),
      ],
      effects: createJoinEffects(npcId, choice.cost),
    })),
    {
      id: 'decline',
      text: '지금은 거절한다',
      effects: [{ type: 'addLog', category: 'event' as const, message: `${npcDefinitionById[npcId]?.displayName ?? '방문자'}의 제안을 거절했습니다. 며칠 뒤 다시 찾아올 수 있습니다.` }],
    },
  ]
}

export const npcEventDefinitions: EventDefinition[] = npcDefinitions.map((npc) => ({
  id: npc.joinEventId,
  title: '특별 방문자',
  text: npc.visitorText,
  conditions: [...npc.unlockConditions, { type: 'npcJoined', npcId: npc.id, value: false }],
  weight: 7,
  once: false,
  cooldownDays: 8,
  category: 'npc',
  tags: ['npc_join', 'chain', npc.role],
  choices: createJoinChoices(npc.id),
}))
