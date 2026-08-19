import { useState } from 'react'
import { facilityDefinitionById } from '../../content/facilities/facilities'
import { npcDefinitions } from '../../content/npcs/npcs'
import { mercenaryDefinitionById, npcServiceDefinitions, shopItemDefinitionById } from '../../content/npcs/services'
import { getDailyThreatGain, getEligibleInvaders } from '../../engine/invasion/processInvasion'
import { isFeatureUnlocked } from '../../engine/npcs/npcServices'
import { canAfford, formatResourceCost } from '../../engine/resources/resourceCosts'
import type { FeatureId } from '../../types/content'
import type { GameState } from '../../types/game'

interface NpcHubProps {
  state: GameState
  onPurchase: (itemId: string) => boolean
  onHire: (contractId: string) => boolean
  onService: (serviceId: string) => boolean
  onRepair: (instanceId: string) => boolean
}

const featureNames: Record<FeatureId, string> = { shop: '상점', blacksmith: '대장간', tavern: '주점', mage: '마력 지원', healer: '치료 지원', informant: '정보망' }

export function NpcHub({ state, onPurchase, onHire, onService, onRepair }: NpcHubProps) {
  const firstUnlocked = npcDefinitions.find((npc) => isFeatureUnlocked(state, npc.featureId))?.featureId ?? null
  const [feature, setFeature] = useState<FeatureId | null>(firstUnlocked)
  const eligibleInvaders = getEligibleInvaders(state)
  const damagedRooms = Object.values(state.dungeon.rooms).filter((room) => room.condition === 'damaged' && facilityDefinitionById[room.definitionId]?.buildable)
  return <div className="npc-hub">
    <div className="npc-roster">
      {npcDefinitions.map((npc) => {
        const joined = Boolean(state.npcs[npc.id]?.joined)
        return <button key={npc.id} type="button" className={feature === npc.featureId ? 'is-active' : ''} disabled={!joined} onClick={() => setFeature(npc.featureId)}>
          <span className="npc-token" aria-hidden="true">{joined ? '◆' : '?'}</span><span><strong>{joined ? npc.displayName : '???'}</strong><small>{joined ? `${featureNames[npc.featureId]} 이용 가능` : '???'}</small></span>
        </button>
      })}
    </div>
    {feature && isFeatureUnlocked(state, feature) && <section className="npc-feature">
      <h3>{featureNames[feature]}</h3>
      {feature === 'shop' && <div className="service-list">{state.shop.offerings.map((offering) => { const item = shopItemDefinitionById[offering.itemId]; if (!item) return null; return <button key={item.id} type="button" disabled={offering.stock <= 0 || !canAfford(state, item.cost)} onClick={() => onPurchase(item.id)}><span><strong>{item.name}</strong><small>{item.description} · 재고 {offering.stock}</small></span><em>{formatResourceCost(item.cost)}</em></button> })}</div>}
      {feature === 'tavern' && <div className="service-list">{state.tavern.offers.map((id) => { const contract = mercenaryDefinitionById[id]; if (!contract) return null; const active = state.activeMercenaries.some((entry) => entry.contractId === id && state.day < entry.expiresOnDay); return <button key={id} type="button" disabled={active || !canAfford(state, contract.cost)} onClick={() => onHire(id)}><span><strong>{contract.name}</strong><small>방어 +{contract.combatPower} · {contract.durationDays} DAY{active ? ' · 고용 중' : ''}</small></span><em>{formatResourceCost(contract.cost)}</em></button> })}</div>}
      {feature === 'blacksmith' && <div className="service-list">{damagedRooms.length === 0 ? <p>현재 손상된 시설이 없습니다.</p> : damagedRooms.map((room) => <button key={room.instanceId} type="button" onClick={() => onRepair(room.instanceId)}><span><strong>{facilityDefinitionById[room.definitionId]?.name ?? room.definitionId}</strong><small>일반 수리보다 15% 저렴합니다.</small></span><em>수리</em></button>)}{npcServiceDefinitions.filter((service) => service.featureId === feature).map((service) => <button key={service.id} type="button" disabled={!canAfford(state, service.cost)} onClick={() => onService(service.id)}><span><strong>{service.name}</strong><small>{service.description}</small></span><em>{formatResourceCost(service.cost)}</em></button>)}</div>}
      {(feature === 'mage' || feature === 'healer') && <div className="service-list">{npcServiceDefinitions.filter((service) => service.featureId === feature).map((service) => <button key={service.id} type="button" disabled={!canAfford(state, service.cost)} onClick={() => onService(service.id)}><span><strong>{service.name}</strong><small>{service.description}</small></span><em>{formatResourceCost(service.cost)}</em></button>)}</div>}
      {feature === 'informant' && <><div className="invasion-intel"><p><span>현재 위협</span><strong>{state.invasion.threat}/100</strong></p>{state.invasion.intel.powerRange && <p><span>예상 전투력</span><strong>{Math.min(...eligibleInvaders.map((item) => item.combatPower))}–{Math.max(...eligibleInvaders.map((item) => item.combatPower))}</strong></p>}{state.invasion.intel.invaderCategory && <p><span>후보</span><strong>{eligibleInvaders.map((item) => item.name).join(', ')}</strong></p>}{state.invasion.intel.arrivalEstimate && <p><span>강제 침입까지</span><strong>최대 {Math.ceil((100 - state.invasion.threat) / getDailyThreatGain(state))} DAY</strong></p>}</div><div className="service-list">{npcServiceDefinitions.filter((service) => service.featureId === feature).map((service) => <button key={service.id} type="button" disabled={!canAfford(state, service.cost) || state.invasion.intel[service.id === 'intel_power' ? 'powerRange' : service.id === 'intel_category' ? 'invaderCategory' : 'arrivalEstimate']} onClick={() => onService(service.id)}><span><strong>{service.name}</strong><small>{service.description}</small></span><em>{formatResourceCost(service.cost)}</em></button>)}</div></>}
    </section>}
  </div>
}
