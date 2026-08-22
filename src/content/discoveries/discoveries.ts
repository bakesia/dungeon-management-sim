import type { DiscoveryDefinition, DiscoveryId } from '../../types/content'

export const discoveryDefinitions: DiscoveryDefinition[] = [
  { id: 'empty', name: '빈 암반층', description: '특별한 발견 없이 공간만 확보했습니다.', resolution: 'none', generationWeight: 55 },
  { id: 'material_cache', name: '자재 저장 흔적', description: '매몰된 건축 자재 일부를 회수할 수 있습니다.', resolution: 'one_shot', generationWeight: 12 },
  { id: 'cavern', name: '공동', description: '연결된 작은 공동이 열려 주변 공간을 무료로 확보합니다.', resolution: 'one_shot', generationWeight: 12 },
  { id: 'loot', name: '낡은 탐험가 상자', description: '상인에게 판매할 수 있는 전리품이 남아 있습니다.', resolution: 'one_shot', generationWeight: 8 },
  { id: 'hazard', name: '불안정 지층', description: '가벼운 붕괴나 마력 누출 위험이 도사립니다.', resolution: 'one_shot', generationWeight: 7 },
  { id: 'gold_vein', name: '금맥', description: '금광을 건설할 수 있는 영구 자원 노드입니다.', resolution: 'persistent', persistentNodeType: 'gold_vein', revealWhenAdjacentFloor: true, generationWeight: 5 },
  { id: 'artifact', name: '고대 유물', description: '희귀한 유물이 묻혀 있습니다.', resolution: 'one_shot', generationWeight: 2 },
  { id: 'special_event', name: '수상한 공간', description: '선택이 필요한 특수 발견입니다.', resolution: 'one_shot', generationWeight: 1 },
]

export const discoveryDefinitionById = Object.fromEntries(
  discoveryDefinitions.map((definition) => [definition.id, definition]),
) as Record<DiscoveryId, DiscoveryDefinition>
