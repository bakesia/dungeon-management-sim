import type { DiscoveryDefinition, DiscoveryId } from '../../types/content'

export const discoveryDefinitions: DiscoveryDefinition[] = [
  { id: 'empty', name: '빈 암반층', description: '특별한 발견 없이 공간만 확보했습니다.', resolution: 'none', generationWeight: 72 },
  { id: 'material_cache', name: '자재 흔적', description: '향후 일회성 자재 발견으로 확장할 자리입니다.', resolution: 'one_shot', generationWeight: 10 },
  { id: 'cavern', name: '공동 흔적', description: '향후 공동 형태 확장에 사용될 발견입니다.', resolution: 'one_shot', generationWeight: 5 },
  { id: 'loot', name: '매몰 전리품', description: '향후 Loot table과 연결될 발견입니다.', resolution: 'one_shot', generationWeight: 4 },
  { id: 'hazard', name: '불안정 지층', description: '향후 굴착 위험과 연결될 발견입니다.', resolution: 'one_shot', generationWeight: 3 },
  { id: 'gold_vein', name: '금맥', description: '지도에 남아 향후 금광 건설 조건으로 사용될 영구 노드입니다.', resolution: 'persistent', persistentNodeType: 'gold_vein', generationWeight: 3 },
  { id: 'artifact', name: '고대 유물 흔적', description: '향후 Artifact 획득과 연결될 발견입니다.', resolution: 'one_shot', generationWeight: 2 },
  { id: 'special_event', name: '수상한 공간', description: '향후 특수 굴착 이벤트와 연결될 발견입니다.', resolution: 'one_shot', generationWeight: 1 },
]

export const discoveryDefinitionById = Object.fromEntries(
  discoveryDefinitions.map((definition) => [definition.id, definition]),
) as Record<DiscoveryId, DiscoveryDefinition>
