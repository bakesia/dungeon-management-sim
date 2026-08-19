import { useMemo, useState, type CSSProperties } from 'react'
import { facilityDefinitionById } from '../../content/facilities/facilities'
import { gameRules } from '../../content/gameRules'
import { resourceDefinitionById } from '../../content/resources/resources'
import type { ResourceCost } from '../../types/content'
import type { DungeonTile, GameState } from '../../types/game'

interface DungeonMapProps { state: GameState }

const statusNames: Record<DungeonTile['status'], string> = {
  undiscovered: '미확인 구역', diggable: '굴착 가능한 암반', empty: '빈 공간', occupied: '시설 구역',
}

function formatCost(cost: ResourceCost): string {
  return Object.entries(cost)
    .map(([resourceId, amount]) => `${resourceDefinitionById[resourceId]?.name ?? resourceId} ${amount}`)
    .join(' · ')
}

function getTileLabel(tile: DungeonTile): string {
  if (tile.facility) return facilityDefinitionById[tile.facility.definitionId]?.shortName ?? '시설'
  if (tile.status === 'empty') return '빈 공간'
  if (tile.status === 'diggable') return '암반'
  return '·'
}

export function DungeonMap({ state }: DungeonMapProps) {
  const tiles = useMemo(
    () => Object.values(state.dungeon.tiles).sort((a, b) => a.coordinate.y - b.coordinate.y || a.coordinate.x - b.coordinate.x),
    [state.dungeon.tiles],
  )
  const [selectedTileId, setSelectedTileId] = useState('0:0:0')
  const selectedTile = state.dungeon.tiles[selectedTileId] ?? tiles[0]
  const minX = Math.min(...tiles.map((tile) => tile.coordinate.x))
  const maxX = Math.max(...tiles.map((tile) => tile.coordinate.x))
  const selectedFacility = selectedTile.facility ? facilityDefinitionById[selectedTile.facility.definitionId] : undefined
  const gridStyle = { '--map-columns': maxX - minX + 1 } as CSSProperties

  return (
    <section className="dungeon-panel" aria-labelledby="dungeon-map-title">
      <div className="panel-heading">
        <div><p className="eyebrow">FLOOR 01 · CENTRAL CAVERN</p><h2 id="dungeon-map-title">던전 지도</h2></div>
        <div className="map-legend" aria-label="지도 범례">
          <span><i className="legend-box legend-box--room" />확보</span>
          <span><i className="legend-box legend-box--rock" />굴착 가능</span>
        </div>
      </div>

      <div className="map-stage">
        <div className="dungeon-grid" style={gridStyle}>
          {tiles.map((tile) => {
            const isSelected = tile.id === selectedTile.id
            const facility = tile.facility ? facilityDefinitionById[tile.facility.definitionId] : undefined
            return (
              <button
                className={`dungeon-tile dungeon-tile--${tile.status}${isSelected ? ' is-selected' : ''}`}
                type="button"
                key={tile.id}
                onClick={() => setSelectedTileId(tile.id)}
                aria-pressed={isSelected}
                aria-label={`${tile.coordinate.x}, ${tile.coordinate.y}: ${facility?.name ?? statusNames[tile.status]}`}
              >
                {facility?.category === 'core' && <span className="tile-core" aria-hidden="true">◆</span>}
                <span className="dungeon-tile__name">{getTileLabel(tile)}</span>
                {tile.facility && <span className="dungeon-tile__level">LV.{tile.facility.level}</span>}
              </button>
            )
          })}
        </div>
        <span className="map-coordinate map-coordinate--top">N</span>
      </div>

      <aside className="tile-inspector" aria-live="polite">
        <div className="tile-inspector__title">
          <span className={`status-gem status-gem--${selectedTile.status}`} />
          <div><p>{selectedFacility?.name ?? statusNames[selectedTile.status]}</p><span>좌표 {selectedTile.coordinate.x}, {selectedTile.coordinate.y}</span></div>
        </div>
        <div className="tile-inspector__content">
          <p>{selectedFacility?.description ?? (selectedTile.status === 'diggable' ? '단단한 암반 너머로 확장할 수 있습니다.' : selectedTile.status === 'empty' ? '시설을 건설할 수 있는 확보된 공간입니다.' : '아직 내부를 확인할 수 없는 구역입니다.')}</p>
          {selectedTile.status === 'diggable' && <span className="cost-label">굴착 비용 · {formatCost(gameRules.excavation.cost)}</span>}
          {selectedFacility && <span className="cost-label">내구도 · {selectedTile.facility?.durability}%</span>}
        </div>
        <button className="secondary-button" type="button" disabled title="굴착 및 건설 엔진은 다음 단계에서 구현됩니다.">
          {selectedTile.status === 'diggable' ? '굴착 준비 중' : '관리 기능 준비 중'}
        </button>
      </aside>
    </section>
  )
}
