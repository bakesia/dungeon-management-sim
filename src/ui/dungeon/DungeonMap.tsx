import { useMemo, useState, type CSSProperties } from 'react'
import { facilityDefinitionById } from '../../content/facilities/facilities'
import { gameRules } from '../../content/gameRules'
import { resourceDefinitionById } from '../../content/resources/resources'
import { tierDefinitionById } from '../../content/tiers/tiers'
import { canUpgradeFacility } from '../../engine/construction/facilities'
import { canRepairFacility, getRepairCost } from '../../engine/construction/repairFacility'
import { getRoomConditionEfficiency } from '../../engine/construction/roomCondition'
import { canDigTile } from '../../engine/dungeon/digTile'
import { calculateFacilityProductionMultiplier, getFacilityLevel, getRoomAssignmentCount } from '../../engine/population/assignWorkers'
import { formatResourceCost } from '../../engine/resources/resourceCosts'
import type { EffectDefinition } from '../../types/content'
import type { DungeonTile, FacilityInstance, GameState } from '../../types/game'
import { getRoomGoldMaintenance } from '../../engine/day/processMaintenance'
import { previewResourceChange } from '../../engine/resources/resourceCapacity'
import { GameIcon } from '../icons/GameIcon'
import { RaceIcon } from '../population/RaceIcon'
import { raceDefinitionById } from '../../content/races/races'
import { QuickAccess } from '../game/QuickAccess'

interface DungeonMapProps {
  state: GameState
  buildModeFacilityId: string | null
  actionError: string | null
  onCancelBuild: () => void
  onOpenBuildMenu: (tileId?: string) => void
  onDig: (tileId: string) => boolean
  onBuild: (facilityId: string, tileId: string) => boolean
  onUpgrade: (instanceId: string) => boolean
  onRepair: (instanceId: string) => boolean
  onDemolish: (instanceId: string) => boolean
  onOpenAssignment: (instanceId: string) => void
  onOpenNpcMenu: () => void
}

const statusNames: Record<DungeonTile['status'], string> = {
  undiscovered: '미확인 구역', diggable: '굴착 가능한 암반', empty: '빈 공간', occupied: '시설 구역',
}

function getRoom(state: GameState, tile: DungeonTile): FacilityInstance | undefined {
  return tile.facilityInstanceId ? state.dungeon.rooms[tile.facilityInstanceId] : undefined
}

function getTileLabel(tile: DungeonTile): string {
  if (tile.status === 'empty') return '빈 공간'
  if (tile.status === 'diggable') return '암반'
  return '·'
}

function describeEffects(effects: EffectDefinition[], efficiency = 1): string {
  const descriptions = effects.flatMap((effect) => {
    if (effect.type !== 'addResource') return []
    const amount = effect.amount >= 0
      ? Math.floor(effect.amount * efficiency)
      : Math.ceil(effect.amount * efficiency)
    return [`${resourceDefinitionById[effect.resourceId]?.name ?? effect.resourceId} ${amount >= 0 ? '+' : ''}${amount}`]
  })
  return descriptions.length > 0 ? descriptions.join(' · ') : '없음'
}

export function DungeonMap({
  state,
  buildModeFacilityId,
  actionError,
  onCancelBuild,
  onOpenBuildMenu,
  onDig,
  onBuild,
  onUpgrade,
  onRepair,
  onDemolish,
  onOpenAssignment,
  onOpenNpcMenu,
}: DungeonMapProps) {
  const tiles = useMemo(
    () => Object.values(state.dungeon.tiles).sort((a, b) => a.coordinate.y - b.coordinate.y || a.coordinate.x - b.coordinate.x),
    [state.dungeon.tiles],
  )
  const [selectedTileId, setSelectedTileId] = useState('0:0:0')
  const selectedTile = state.dungeon.tiles[selectedTileId] ?? tiles[0]
  const minX = Math.min(...tiles.map((tile) => tile.coordinate.x))
  const maxX = Math.max(...tiles.map((tile) => tile.coordinate.x))
  const selectedRoom = selectedTile ? getRoom(state, selectedTile) : undefined
  const selectedFacility = selectedRoom ? facilityDefinitionById[selectedRoom.definitionId] : undefined
  const selectedLevel = selectedRoom ? getFacilityLevel(selectedRoom) : undefined
  const buildFacility = buildModeFacilityId ? facilityDefinitionById[buildModeFacilityId] : undefined
  const selectedEfficiency = selectedRoom
    ? calculateFacilityProductionMultiplier(state, selectedRoom) * getRoomConditionEfficiency(selectedRoom)
    : 1
  const gridStyle = { '--map-columns': maxX - minX + 1 } as CSSProperties
  const capacityWarnings = selectedLevel?.dailyEffects.flatMap((effect) => {
    if (effect.type !== 'addResource' || effect.amount <= 0) return []
    const expected = Math.floor(effect.amount * selectedEfficiency)
    if (expected <= 0) return []
    const preview = previewResourceChange(state, effect.resourceId, expected)
    if (preview.overflow <= 0 && preview.current < preview.capacity * 0.9) return []
    const name = resourceDefinitionById[effect.resourceId]?.name ?? effect.resourceId
    return [`${name} ${preview.current}/${preview.capacity} · 다음 생산 +${preview.applied}${preview.overflow > 0 ? ` · 예상 초과 ${preview.overflow}` : ''}`]
  }) ?? []

  const selectTile = (tile: DungeonTile) => {
    setSelectedTileId(tile.id)
    if (buildModeFacilityId && tile.status === 'empty' && onBuild(buildModeFacilityId, tile.id)) onCancelBuild()
  }

  return (
    <section className="dungeon-panel" aria-labelledby="dungeon-map-title">
      <div className="panel-heading">
        <div><p className="eyebrow">FLOOR 01 · CENTRAL CAVERN</p><h2 id="dungeon-map-title">던전 지도</h2></div>
        <div className="panel-heading__actions">
          <QuickAccess state={state} onOpenAll={onOpenNpcMenu} />
          {buildFacility && (
            <div className="build-mode-banner"><span>건설 모드 · {buildFacility.name}</span><button type="button" onClick={onCancelBuild}>ESC 취소</button></div>
          )}
        </div>
      </div>

      <div className="map-stage">
        <div className="dungeon-grid" style={gridStyle}>
          {tiles.map((tile) => {
            const isSelected = selectedTile && tile.id === selectedTile.id
            const room = getRoom(state, tile)
            const facility = room ? facilityDefinitionById[room.definitionId] : undefined
            const isBuildTarget = Boolean(buildModeFacilityId && tile.status === 'empty')
            return (
              <button
                className={`dungeon-tile dungeon-tile--${tile.status}${room?.condition === 'damaged' ? ' is-damaged' : ''}${isSelected ? ' is-selected' : ''}${isBuildTarget ? ' is-build-target' : ''}`}
                type="button"
                key={tile.id}
                onClick={() => selectTile(tile)}
                aria-pressed={isSelected}
                aria-label={`${tile.coordinate.x}, ${tile.coordinate.y}: ${facility?.name ?? statusNames[tile.status]}`}
                title={facility?.name ?? statusNames[tile.status]}
              >
                {facility && room ? <>
                  <GameIcon iconId={facility.iconId} size={38} />
                  {facility.category !== 'core' && <span className="dungeon-tile__level">LV.{room.level}</span>}
                </> : <span className="dungeon-tile__name">{getTileLabel(tile)}</span>}
                {room?.condition === 'damaged' && <span className="dungeon-tile__condition">손상</span>}
              </button>
            )
          })}
        </div>
        <span className="map-coordinate map-coordinate--top">N</span>
      </div>

      {selectedTile && <aside className="tile-inspector" aria-live="polite">
        <div className="tile-inspector__title">
          {selectedFacility
            ? <GameIcon iconId={selectedFacility.iconId} label={selectedFacility.name} size={42} className="tile-inspector__icon" />
            : <span className={`status-gem status-gem--${selectedTile.status}`} />}
          <div>
            <p>{selectedFacility?.name ?? statusNames[selectedTile.status]}{selectedRoom ? ` · Lv.${selectedRoom.level}` : ''}</p>
            <span>좌표 {selectedTile.coordinate.x}, {selectedTile.coordinate.y}</span>
          </div>
        </div>
        <div className="tile-inspector__content">
          <p>{selectedFacility?.description ?? (selectedTile.status === 'diggable' ? '단단한 암반 너머로 확장할 수 있습니다.' : selectedTile.status === 'empty' ? '건설 메뉴에서 시설을 선택한 뒤 이 공간을 클릭하십시오.' : '아직 내부를 확인할 수 없는 구역입니다.')}</p>
          {selectedTile.status === 'diggable' && <span className="cost-label">굴착 비용 · {formatResourceCost(gameRules.excavation.cost)}</span>}
          {selectedRoom && selectedLevel && (
            <div className="facility-stats">
              <span>상태 · {selectedRoom.condition === 'damaged' ? '손상 (효과 50%)' : '정상'}</span>
              <span>생산 · {describeEffects(selectedLevel.dailyEffects, selectedEfficiency)}</span>
              <span>유지비 · 골드 {getRoomGoldMaintenance(selectedRoom)} / DAY{selectedLevel.maintenanceEffects?.length ? ` · ${describeEffects(selectedLevel.maintenanceEffects)}` : ''}</span>
              {selectedLevel.populationCapacity && <span>인구 수용 · +{selectedLevel.populationCapacity}</span>}
              {selectedLevel.defense && <span>방어력 · {selectedLevel.defense}</span>}
              <span>가동 효율 · {Math.round(selectedEfficiency * 100)}%</span>
              {capacityWarnings.map((warning) => <span className="capacity-warning" key={warning}>{warning}</span>)}
            </div>
          )}
          {selectedRoom && selectedLevel && Boolean(selectedLevel.staffSlots) && <div className="worker-control">
            <div className="worker-control__summary">
              <span>배치 인원 {getRoomAssignmentCount(selectedRoom)} / {selectedLevel.staffSlots}</span>
              <div className="worker-control__races">
                {selectedRoom.residentAssignments.length > 0
                  ? selectedRoom.residentAssignments.map((assignment) => {
                    const race = raceDefinitionById[assignment.raceId]
                    return <span key={assignment.raceId}><RaceIcon iconId={race?.iconId ?? ''} name={race?.name ?? assignment.raceId} size={24} />{race?.name ?? assignment.raceId} {assignment.count}</span>
                  })
                  : <span>미배치</span>}
              </div>
            </div>
            <button type="button" onClick={() => onOpenAssignment(selectedRoom.instanceId)}>인원 변경</button>
          </div>}
          {selectedFacility?.category === 'core' && <span className="cost-label">CORE HP {state.core.hp} / {state.core.maxHp} · TIER {tierDefinitionById[state.currentTierId]?.level ?? 1} {tierDefinitionById[state.currentTierId]?.name}</span>}
          {actionError && <span className="action-error">{actionError}</span>}
        </div>
        <div className="inspector-actions">
          {selectedTile.status === 'diggable' && (
            <button className="primary-button" type="button" disabled={!canDigTile(state, selectedTile.id).allowed} onClick={() => onDig(selectedTile.id)}>굴착</button>
          )}
          {selectedTile.status === 'empty' && <button className="primary-button" type="button" onClick={() => onOpenBuildMenu(selectedTile.id)}>건설 메뉴 열기</button>}
          {selectedRoom && selectedFacility?.buildable && (
            <>
              {selectedRoom.condition === 'damaged' && (
                <button className="primary-button repair-button" type="button" disabled={!canRepairFacility(state, selectedRoom.instanceId).allowed} onClick={() => onRepair(selectedRoom.instanceId)}>
                  수리 · {formatResourceCost(getRepairCost(state, selectedRoom.instanceId))}
                </button>
              )}
              <button className="primary-button" type="button" disabled={!canUpgradeFacility(state, selectedRoom.instanceId).allowed} onClick={() => onUpgrade(selectedRoom.instanceId)}>
                {selectedLevel?.upgradeCost ? `업그레이드 · ${formatResourceCost(selectedLevel.upgradeCost)}` : '최대 레벨'}
              </button>
              <button className="secondary-button secondary-button--danger" type="button" onClick={() => onDemolish(selectedRoom.instanceId)}>철거</button>
            </>
          )}
        </div>
      </aside>}
    </section>
  )
}
