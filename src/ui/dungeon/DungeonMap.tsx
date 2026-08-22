import { useMemo, useState, type CSSProperties } from 'react'
import { facilityDefinitionById } from '../../content/facilities/facilities'
import { resourceDefinitionById } from '../../content/resources/resources'
import { tierDefinitionById } from '../../content/tiers/tiers'
import { canBuildFacility, canUpgradeFacility } from '../../engine/construction/facilities'
import { canRepairFacility, getRepairCost } from '../../engine/construction/repairFacility'
import { getRoomConditionEfficiency } from '../../engine/construction/roomCondition'
import { canExcavate, getExcavationCapacity, getExcavationCost, getTileMapState, type TileMapState } from '../../engine/dungeon/excavation'
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
import { getRoomDisplayName } from '../facilities/roomDisplay'

interface DungeonMapProps {
  state: GameState
  buildModeFacilityId: string | null
  actionError: string | null
  onCancelBuild: () => void
  onOpenBuildMenu: (tileId?: string) => void
  onExcavate: (tileId: string) => boolean
  onBuild: (facilityId: string, tileId: string) => boolean
  onUpgrade: (instanceId: string) => boolean
  onRepair: (instanceId: string) => boolean
  onDemolish: (instanceId: string) => boolean
  onOpenAssignment: (instanceId: string) => void
  onOpenInventory: () => void
  onOpenStatistics: () => void
  onOpenNpcManagement: () => void
}

const statusNames: Record<TileMapState, string> = {
  'unrevealed-rock': '미공개 암반',
  'excavatable-rock': '굴착 가능한 암반',
  'revealed-floor': '공개된 빈 바닥',
  occupied: '시설 구역',
}

function getRoom(state: GameState, tile: DungeonTile): FacilityInstance | undefined {
  return tile.facilityInstanceId ? state.dungeon.rooms[tile.facilityInstanceId] : undefined
}

function getTileLabel(mapState: TileMapState): string {
  if (mapState === 'revealed-floor') return '빈 공간'
  if (mapState === 'excavatable-rock') return '암반'
  return '·'
}

function isBuildableFloor(tile: DungeonTile): boolean {
  return tile.terrain === 'floor' && tile.revealed && !tile.facilityInstanceId
}

function isFacilityBuildTarget(tile: DungeonTile, facility?: { requiredNodeType?: string }): boolean {
  if (!isBuildableFloor(tile)) return false
  if (facility?.requiredNodeType) return tile.persistentNode?.type === facility.requiredNodeType
  return !tile.persistentNode
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
  onExcavate,
  onBuild,
  onUpgrade,
  onRepair,
  onDemolish,
  onOpenAssignment,
  onOpenInventory,
  onOpenStatistics,
  onOpenNpcManagement,
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
  const selectedMapState = selectedTile ? getTileMapState(state, selectedTile) : undefined
  const selectedExcavationCheck = selectedTile ? canExcavate(state, selectedTile.id) : undefined
  const selectedFacility = selectedRoom ? facilityDefinitionById[selectedRoom.definitionId] : undefined
  const selectedHasGoldVein = selectedTile?.persistentNode?.type === 'gold_vein' || selectedTile?.discovery?.discoveryId === 'gold_vein'
  const selectedLevel = selectedRoom ? getFacilityLevel(selectedRoom) : undefined
  const buildFacility = buildModeFacilityId ? facilityDefinitionById[buildModeFacilityId] : undefined
  const goldMineBuildCheck = selectedTile?.persistentNode?.type === 'gold_vein' && !selectedRoom
    ? canBuildFacility(state, 'gold_mine', selectedTile.id)
    : undefined
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
    if (buildModeFacilityId && isFacilityBuildTarget(tile, buildFacility) && onBuild(buildModeFacilityId, tile.id)) onCancelBuild()
  }

  return (
    <section className="dungeon-panel" aria-labelledby="dungeon-map-title">
      <div className="panel-heading">
        <div><p className="eyebrow">FLOOR 01 · CENTRAL CAVERN</p><h2 id="dungeon-map-title">던전 지도</h2><span className="excavation-counter">굴착 {state.excavation.actionsRemaining} / {getExcavationCapacity()}</span></div>
        <div className="panel-heading__actions">
          <QuickAccess state={state} onOpenInventory={onOpenInventory} onOpenStatistics={onOpenStatistics} onOpenNpcManagement={onOpenNpcManagement} />
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
            const facilityName = room ? getRoomDisplayName(state, room) : undefined
            const mapState = getTileMapState(state, tile)
            const isBuildTarget = Boolean(buildModeFacilityId && isFacilityBuildTarget(tile, buildFacility))
            const hasGoldVein = tile.persistentNode?.type === 'gold_vein' || tile.discovery?.discoveryId === 'gold_vein'
            const cavernReveal = tile.discovery?.source === 'cavern'
            const tileName = facilityName ?? (hasGoldVein ? tile.terrain === 'rock' ? '금맥 암반' : '금맥' : statusNames[mapState])
            return (
              <button
                className={`dungeon-tile dungeon-tile--${mapState}${room?.condition === 'damaged' ? ' is-damaged' : ''}${isSelected ? ' is-selected' : ''}${isBuildTarget ? ' is-build-target' : ''}${hasGoldVein ? ' has-gold-vein' : ''}${cavernReveal ? ' is-cavern-reveal' : ''}`}
                style={cavernReveal ? { '--reveal-delay': `${tile.discovery!.variant % 4 * 45}ms` } as CSSProperties : undefined}
                type="button"
                key={tile.id}
                onClick={() => selectTile(tile)}
                aria-pressed={isSelected}
                aria-label={`${tile.coordinate.x}, ${tile.coordinate.y}: ${tileName}`}
                title={tileName}
              >
                {facility && room ? <>
                  <GameIcon iconId={facility.iconId} size={38} />
                  {facility.category !== 'core' && facility.showLevel !== false && <span className="dungeon-tile__level">LV.{room.level}</span>}
                </> : hasGoldVein
                  ? <GameIcon iconId="node_gold_vein" label="금맥" size={38} />
                  : <span className="dungeon-tile__name">{getTileLabel(mapState)}</span>}
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
            : <span className={`status-gem status-gem--${selectedMapState}`} />}
          <div>
            <p>{selectedRoom ? getRoomDisplayName(state, selectedRoom) : selectedHasGoldVein ? selectedTile.terrain === 'rock' ? '금맥 암반' : '금맥' : selectedFacility?.name ?? (selectedMapState ? statusNames[selectedMapState] : '알 수 없는 타일')}{selectedRoom && selectedFacility?.showLevel !== false ? ` · Lv.${selectedRoom.level}` : ''}</p>
            <span>좌표 {selectedTile.coordinate.x}, {selectedTile.coordinate.y}</span>
          </div>
        </div>
        <div className="tile-inspector__content">
          <p>{selectedFacility?.description ?? (selectedHasGoldVein ? selectedTile.terrain === 'rock' ? '금맥이 드러난 암반입니다. 실제로 굴착해야 금광을 건설할 수 있습니다.' : '금광을 건설할 수 있는 영구 금맥입니다. 일반 시설은 건설할 수 없습니다.' : selectedMapState === 'excavatable-rock' ? '공개된 바닥과 연결된 암반입니다. 굴착 명령으로 공간을 확보할 수 있습니다.' : selectedMapState === 'revealed-floor' ? '건설 메뉴에서 시설을 선택한 뒤 이 공간을 클릭하십시오.' : '아직 접근 경로가 확보되지 않은 암반입니다.')}</p>
          {selectedTile.terrain === 'rock' && <span className="cost-label">굴착 비용 · {formatResourceCost(getExcavationCost(selectedTile.coordinate))} · 오늘 남은 굴착 {state.excavation.actionsRemaining}</span>}
          {selectedTile.terrain === 'rock' && !selectedExcavationCheck?.allowed && <span className="excavation-reason">{selectedExcavationCheck?.reason}</span>}
          {selectedRoom && selectedLevel && (
            <div className="facility-stats">
              <span>상태 · {selectedRoom.condition === 'damaged' ? '손상 (효과 50%)' : '정상'}</span>
              <span>기본 생산 · {describeEffects(selectedLevel.dailyEffects)}</span>
              <span>실제 예상 · {describeEffects(selectedLevel.dailyEffects, selectedEfficiency)} / DAY</span>
              <span>유지비 · 골드 {getRoomGoldMaintenance(selectedRoom)} / DAY{selectedLevel.maintenanceEffects?.length ? ` · ${describeEffects(selectedLevel.maintenanceEffects)}` : ''}</span>
              {selectedLevel.populationCapacity && <span>인구 수용 · +{selectedLevel.populationCapacity}</span>}
              {selectedLevel.defense && <span>방어력 · {selectedLevel.defense}</span>}
              {Boolean(selectedLevel.staffSlots) && <span>현재 배치 · {getRoomAssignmentCount(selectedRoom)} / {selectedLevel.staffSlots}</span>}
              {selectedFacility?.requiredNodeType && <span>특수 시설 · 금맥 위에 건설</span>}
              <span>배치·종족·상태 보정 · {Math.round(selectedEfficiency * 100)}%</span>
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
          {selectedTile.terrain === 'rock' && (
            <button className="primary-button" type="button" disabled={!selectedExcavationCheck?.allowed} onClick={() => onExcavate(selectedTile.id)}>굴착</button>
          )}
          {isBuildableFloor(selectedTile) && !selectedTile.persistentNode && <button className="primary-button" type="button" onClick={() => onOpenBuildMenu(selectedTile.id)}>건설 메뉴 열기</button>}
          {goldMineBuildCheck && <button className="primary-button" type="button" disabled={!goldMineBuildCheck.allowed} onClick={() => onBuild('gold_mine', selectedTile.id)}>
            금광 건설 · {formatResourceCost(facilityDefinitionById.gold_mine.buildCost)}
          </button>}
          {selectedRoom && selectedFacility?.buildable && (
            <>
              {selectedRoom.condition === 'damaged' && (
                <button className="primary-button repair-button" type="button" disabled={!canRepairFacility(state, selectedRoom.instanceId).allowed} onClick={() => onRepair(selectedRoom.instanceId)}>
                  수리 · {formatResourceCost(getRepairCost(state, selectedRoom.instanceId))}
                </button>
              )}
              {selectedFacility.showLevel !== false && <button className="primary-button" type="button" disabled={!canUpgradeFacility(state, selectedRoom.instanceId).allowed} onClick={() => onUpgrade(selectedRoom.instanceId)}>
                {selectedLevel?.upgradeCost ? `업그레이드 · ${formatResourceCost(selectedLevel.upgradeCost)}` : '최대 레벨'}
              </button>}
              <button className="secondary-button secondary-button--danger" type="button" onClick={() => onDemolish(selectedRoom.instanceId)}>철거</button>
            </>
          )}
        </div>
      </aside>}
    </section>
  )
}
