import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { raceDefinitions } from '../../content/races/races'
import { getAssignedResidents, getAssignedResidentsByRace } from '../../engine/population/assignWorkers'
import { getIdlePopulation, getPopulationByRace, getPopulationCapacity, getPopulationTotal } from '../../engine/population/populationMetrics'
import type { GameState } from '../../types/game'
import { RaceIcon } from './RaceIcon'
import { compareRoomsForDisplay, getRoomDisplayName } from '../facilities/roomDisplay'

function formatTraits(race: (typeof raceDefinitions)[number]): string[] {
  return [...race.modifiers.map((modifier) => {
    const percent = Math.round((modifier.value - 1) * 100)
    const sign = percent >= 0 ? '+' : ''
    if (modifier.type === 'combatMultiplier') return `전투 ${sign}${percent}%`
    const label = modifier.targetTag === 'mana' ? '마력 시설' : modifier.targetTag === 'labor' ? '노동 시설' : modifier.targetTag
    return `${label} ${sign}${percent}%`
  }), `식량 ${race.foodConsumption}/DAY`]
}

export function PopulationOverview({ state }: { state: GameState }) {
  const [expandedId, setExpandedId] = useState<string | null>('goblin')
  return <div className="population-overview">
    <div className="population-summary-grid">
      <p><span>주민</span><strong>{getPopulationTotal(state)} / {getPopulationCapacity(state)}</strong></p>
      <p><span>시설 배치</span><strong>{getAssignedResidents(state)}</strong></p>
      <p><span>대기 인원</span><strong>{getIdlePopulation(state)}</strong></p>
    </div>
    <div className="population-tree population-tree--races">
      {raceDefinitions.map((race) => {
        const expanded = expandedId === race.id
        const placements = Object.values(state.dungeon.rooms).flatMap((room) => {
          const count = room.residentAssignments.find((assignment) => assignment.raceId === race.id)?.count ?? 0
          return count > 0 ? [{ room, count }] : []
        })
        placements.sort((first, second) => compareRoomsForDisplay(first.room, second.room))
        return <section key={race.id}>
          <button className="population-tree__row" type="button" onClick={() => setExpandedId(expanded ? null : race.id)} aria-expanded={expanded}>
            <span>{expanded ? <ChevronDown /> : <ChevronRight />}<RaceIcon iconId={race.iconId} name={race.name} /><b>{race.name}</b></span>
            <strong>{getPopulationByRace(state, race.id)}명 · 배치 {getAssignedResidentsByRace(state, race.id)}</strong>
          </button>
          {expanded && <div className="population-tree__details">
            <p className="race-traits">{formatTraits(race).join(' · ')}</p>
            {placements.map(({ room, count }) => <p key={room.instanceId}><span>{getRoomDisplayName(state, room)}</span><strong>{count}명</strong></p>)}
            <p><span>대기</span><strong>{Math.max(0, getPopulationByRace(state, race.id) - getAssignedResidentsByRace(state, race.id))}명</strong></p>
          </div>}
        </section>
      })}
    </div>
  </div>
}
