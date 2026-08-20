import { useState } from 'react'
import { facilityDefinitionById } from '../../content/facilities/facilities'
import { npcDefinitions } from '../../content/npcs/npcs'
import { mercenaryDefinitionById, npcServiceDefinitions, recruitmentOfferDefinitionById, shopItemDefinitionById } from '../../content/npcs/services'
import { resourceDefinitionById } from '../../content/resources/resources'
import { raceDefinitionById } from '../../content/races/races'
import { getEligibleInvaders, getFameInvasionChance, getFameLevel, getRaidProximity } from '../../engine/invasion/processInvasion'
import { isFeatureUnlocked } from '../../engine/npcs/npcServices'
import { getPopulationCapacity, getPopulationSpace, getPopulationTotal } from '../../engine/population/populationMetrics'
import { previewResourceChange } from '../../engine/resources/resourceCapacity'
import { canAfford, formatResourceCost } from '../../engine/resources/resourceCosts'
import type { FeatureId } from '../../types/content'
import type { GameState } from '../../types/game'
import { RaceIcon } from '../population/RaceIcon'

interface NpcHubProps {
  state: GameState
  onPurchase: (itemId: string) => boolean
  onHire: (contractId: string) => boolean
  onRecruit: (offerId: string) => boolean
  onService: (serviceId: string) => boolean
  onRepair: (instanceId: string) => boolean
  initialFeature?: FeatureId | null
}

const featureNames: Record<FeatureId, string> = {
  shop: '상점', blacksmith: '대장간', tavern: '주점', mage: '마력 지원', healer: '치료 지원', informant: '정보망',
}

export function NpcHub({ state, onPurchase, onHire, onRecruit, onService, onRepair, initialFeature = null }: NpcHubProps) {
  const firstUnlocked = npcDefinitions.find((npc) => isFeatureUnlocked(state, npc.featureId))?.featureId ?? null
  const [feature, setFeature] = useState<FeatureId | null>(initialFeature && isFeatureUnlocked(state, initialFeature) ? initialFeature : firstUnlocked)
  const [tavernView, setTavernView] = useState<'mercenary' | 'recruitment'>('mercenary')
  const eligibleInvaders = getEligibleInvaders(state)
  const raidProximity = getRaidProximity(state)
  const population = getPopulationTotal(state)
  const populationCapacity = getPopulationCapacity(state)
  const damagedRooms = Object.values(state.dungeon.rooms).filter((room) => room.condition === 'damaged' && facilityDefinitionById[room.definitionId]?.buildable)
  const getCapacityStatus = (itemId: string) => {
    const item = shopItemDefinitionById[itemId]
    const previews = item?.effects.flatMap((effect) => effect.type === 'addResource' && effect.amount > 0 ? [previewResourceChange(state, effect.resourceId, effect.amount)] : []) ?? []
    return {
      blocked: previews.length > 0 && previews.every((preview) => preview.applied === 0),
      text: previews.map((preview) => `${resourceDefinitionById[preview.resourceId]?.name ?? preview.resourceId} 저장 +${preview.applied}/${preview.requested}`).join(' · '),
    }
  }

  return <div className="npc-hub">
    <div className="npc-roster">
      {npcDefinitions.map((npc) => {
        const runtime = state.npcs[npc.id]
        const joined = Boolean(runtime?.joined)
        const hint = runtime?.eligible ? '방문을 기다리는 중' : npc.unlockHint
        return <button key={npc.id} type="button" className={feature === npc.featureId ? 'is-active' : ''} disabled={!joined} onClick={() => setFeature(npc.featureId)}>
          <span className="npc-token" aria-hidden="true">{joined ? '◆' : '?'}</span>
          <span><strong>{joined ? npc.displayName : '???'}</strong><small>{joined ? `${featureNames[npc.featureId]} 이용 가능` : hint}</small></span>
        </button>
      })}
    </div>

    {feature && isFeatureUnlocked(state, feature) && <section className="npc-feature">
      <h3>{featureNames[feature]}</h3>
      {feature === 'shop' && <div className="service-list">{state.shop.offerings.map((offering) => {
        const item = shopItemDefinitionById[offering.itemId]
        if (!item) return null
        const capacity = getCapacityStatus(item.id)
        return <button key={item.id} type="button" disabled={offering.stock <= 0 || !canAfford(state, item.cost) || capacity.blocked} onClick={() => onPurchase(item.id)}><span><strong>{item.name}</strong><small>{item.description} · 재고 {offering.stock}</small>{capacity.text && <small className={capacity.blocked ? 'capacity-warning' : ''}>{capacity.blocked ? '저장 공간 부족 · ' : ''}{capacity.text}</small>}</span><em>{formatResourceCost(item.cost)}</em></button>
      })}</div>}

      {feature === 'tavern' && <>
        <div className="npc-feature-tabs"><button type="button" className={tavernView === 'mercenary' ? 'is-active' : ''} onClick={() => setTavernView('mercenary')}>용병</button><button type="button" className={tavernView === 'recruitment' ? 'is-active' : ''} onClick={() => setTavernView('recruitment')}>주민 모집</button></div>
        {tavernView === 'mercenary'
          ? <div className="service-list">{state.tavern.offers.map((id) => {
            const contract = mercenaryDefinitionById[id]
            if (!contract) return null
            const active = state.activeMercenaries.some((entry) => entry.contractId === id && state.day < entry.expiresOnDay)
            return <button key={id} type="button" disabled={active || !canAfford(state, contract.cost)} onClick={() => onHire(id)}><span><strong>{contract.name}</strong><small>방어 +{contract.combatPower} · {contract.durationDays} DAY{active ? ' · 고용 중' : ''}</small></span><em>{formatResourceCost(contract.cost)}</em></button>
          })}</div>
          : <div className="service-list recruitment-list">
            <p className="recruitment-capacity">현재 인구 {population} / {populationCapacity} · 빈 공간 {getPopulationSpace(state)}</p>
            {state.tavern.recruitmentOffers.map((offer) => {
              const definition = recruitmentOfferDefinitionById[offer.offerId]
              if (!definition) return null
              const race = raceDefinitionById[definition.raceId]
              const capacityBlocked = getPopulationSpace(state) < definition.count
              return <button key={offer.offerId} type="button" disabled={offer.remaining <= 0 || capacityBlocked || !canAfford(state, definition.cost)} onClick={() => onRecruit(offer.offerId)}>
                <RaceIcon iconId={race?.iconId ?? ''} name={race?.name ?? definition.raceId} size={34} />
                <span><strong>{definition.name}</strong><small>{definition.description}</small><small>인구 {population}/{populationCapacity} · 합류 +{definition.count} → {population + definition.count}/{populationCapacity}</small><small>{capacityBlocked ? `숙소 부족 · 빈 공간 ${definition.count} 필요` : `남은 모집 ${offer.remaining}회 · 영구 합류`}</small></span>
                <em>{formatResourceCost(definition.cost)}</em>
              </button>
            })}
          </div>}
      </>}

      {feature === 'blacksmith' && <div className="service-list">{damagedRooms.length === 0 ? <p>현재 손상된 시설이 없습니다.</p> : damagedRooms.map((room) => <button key={room.instanceId} type="button" onClick={() => onRepair(room.instanceId)}><span><strong>{facilityDefinitionById[room.definitionId]?.name ?? room.definitionId}</strong><small>일반 수리보다 15% 저렴합니다.</small></span><em>수리</em></button>)}{npcServiceDefinitions.filter((service) => service.featureId === feature).map((service) => <button key={service.id} type="button" disabled={!canAfford(state, service.cost)} onClick={() => onService(service.id)}><span><strong>{service.name}</strong><small>{service.description}</small></span><em>{formatResourceCost(service.cost)}</em></button>)}</div>}
      {(feature === 'mage' || feature === 'healer') && <div className="service-list">{npcServiceDefinitions.filter((service) => service.featureId === feature).map((service) => <button key={service.id} type="button" disabled={!canAfford(state, service.cost)} onClick={() => onService(service.id)}><span><strong>{service.name}</strong><small>{service.description}</small></span><em>{formatResourceCost(service.cost)}</em></button>)}</div>}
      {feature === 'informant' && <><div className="invasion-intel"><p><span>던전 악명</span><strong>{state.invasion.fame} · {getFameLevel(state.invasion.fame)}</strong></p><p><span>현재 공략 가능성</span><strong>{Math.round(getFameInvasionChance(state) * 100)}%</strong></p>{state.invasion.intel.powerRange && eligibleInvaders.length > 0 && <p><span>예상 전투력</span><strong>{Math.min(...eligibleInvaders.map((item) => item.powerRange.min))}–{Math.max(...eligibleInvaders.map((item) => item.powerRange.max))}</strong></p>}{state.invasion.intel.invaderCategory && <p><span>후보</span><strong>{eligibleInvaders.map((item) => item.name).join(', ')}</strong></p>}{state.invasion.intel.arrivalEstimate && <p><span>공략대 근접도</span><strong>{raidProximity.label} · 최대 {raidProximity.maximumDays} DAY</strong></p>}</div><div className="service-list">{npcServiceDefinitions.filter((service) => service.featureId === feature).map((service) => { const intelKey = service.id === 'intel_power' ? 'powerRange' : service.id === 'intel_category' ? 'invaderCategory' : 'arrivalEstimate'; return <button key={service.id} type="button" disabled={!canAfford(state, service.cost) || state.invasion.intel[intelKey]} onClick={() => onService(service.id)}><span><strong>{service.name}</strong><small>{service.description}</small></span><em>{formatResourceCost(service.cost)}</em></button> })}</div></>}
    </section>}
  </div>
}
