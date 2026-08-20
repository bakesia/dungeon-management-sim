import { useState } from 'react'
import { itemDefinitionById } from '../../content/items/items'
import type { GameState } from '../../types/game'
import { getInventoryEntriesForTab, type InventoryTab } from './inventoryView'

const categoryName = { loot: '전리품', artifact: '유물', consumable: '소모품', special: '특수품' }

export function InventoryPanel({ state }: { state: GameState }) {
  const [tab, setTab] = useState<InventoryTab>('normal')
  if (state.inventory.length === 0) return <p className="inventory-empty">보유한 아이템이 없습니다. 침입을 막거나 탐색 이벤트를 처리하면 전리품을 얻을 수 있습니다.</p>
  const entries = getInventoryEntriesForTab(state.inventory, tab)
  return <>
    <div className="inventory-tabs" role="tablist" aria-label="인벤토리 분류">
      <button className={tab === 'normal' ? 'is-active' : ''} type="button" role="tab" aria-selected={tab === 'normal'} onClick={() => setTab('normal')}>일반 아이템</button>
      <button className={tab === 'artifact' ? 'is-active' : ''} type="button" role="tab" aria-selected={tab === 'artifact'} onClick={() => setTab('artifact')}>유물</button>
    </div>
    {entries.length === 0 && <p className="inventory-empty">이 분류에 보유한 아이템이 없습니다.</p>}
    <div className="inventory-grid">{entries.map((entry) => {
    const item = itemDefinitionById[entry.itemId]
    if (!item) return null
    return <article className={`inventory-card inventory-card--${item.category}`} key={entry.itemId}>
      <span className="inventory-token" aria-hidden="true">{item.category === 'artifact' ? '✦' : '◆'}</span>
      <div><small>{categoryName[item.category]}{item.category === 'artifact' ? ' · 활성 중' : ''}</small><strong>{item.name} ×{entry.quantity}</strong><p>{item.description}</p><em>판매가 {item.sellValue}G / 개</em></div>
    </article>
  })}</div></>
}
