import { discoveryDefinitionById } from '../../content/discoveries/discoveries'
import { gameRules } from '../../content/gameRules'
import { itemDefinitionById } from '../../content/items/items'
import type { DiscoveryId, EffectDefinition, ItemId } from '../../types/content'
import type { DungeonTile, GameState } from '../../types/game'
import { applyEffect, applyEffects } from '../effects/applyEffects'
import { tileId } from '../game/createInitialGameState'
import { getCavernShape, getCavernTileResult } from '../world/worldGeneration'
import { revealAdjacentDiscoveries } from './revealAdjacentDiscoveries'

const neighborOffsets = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }]
const lootPool: ItemId[] = ['loot_broken_blade', 'loot_adventurer_pack', 'loot_armor_scrap', 'loot_silver_trinket', 'loot_arcane_fragment', 'loot_quality_supplies']
const artifactPool: ItemId[] = ['artifact_hoard_stone', 'artifact_ward_rune', 'artifact_mana_lens', 'artifact_command_banner']
const specialEventIds = ['event_excavation_sealed_door', 'event_excavation_old_altar', 'event_excavation_locked_storage', 'event_excavation_unknown_tracks']

function revealAdjacentRocks(tiles: Record<string, DungeonTile>, floorTiles: DungeonTile[]): Record<string, DungeonTile> {
  const nextTiles = { ...tiles }
  floorTiles.forEach((floorTile) => neighborOffsets.forEach((offset) => {
    const id = tileId(floorTile.coordinate.x + offset.x, floorTile.coordinate.y + offset.y, floorTile.coordinate.floor ?? 0)
    const neighbor = nextTiles[id]
    if (neighbor?.terrain === 'rock' && !neighbor.revealed) nextTiles[id] = { ...neighbor, revealed: true }
  }))
  return nextTiles
}

function queueEvent(state: GameState, eventId: string, now: Date): GameState {
  const events = state.events.currentEventId
    ? { ...state.events, pendingEventIds: [...state.events.pendingEventIds, eventId] }
    : { ...state.events, currentEventId: eventId }
  return applyEffect({
    ...state,
    events: {
      ...events,
      history: [...events.history, { eventId, day: state.day }].slice(-gameRules.events.historyLimit),
    },
  }, {
    type: 'addLog', category: 'event', message: '[굴착 이벤트] 발견한 공간을 어떻게 처리할지 선택해야 합니다.',
    presentationGroupId: `excavation-event-${state.day}-${eventId}`, presentationSequence: 1, presentationPriority: 85,
  }, now)
}

function resolveMaterialCache(state: GameState, variant: number, now: Date): GameState {
  const roll = variant % 100
  const amount = roll < 45 ? 15 : roll < 80 ? 20 : 25
  return applyEffects(state, [
    { type: 'addResource', resourceId: 'material', amount },
    { type: 'addLog', category: 'resource', message: `[발견] 자재 저장 흔적 · 자재 +${amount}`, sound: 'event_positive' },
  ], now)
}

function resolveLoot(state: GameState, variant: number, now: Date): GameState {
  const first = lootPool[variant % lootPool.length]!
  const itemIds = variant % 100 < 35
    ? [first, lootPool[Math.floor(variant / lootPool.length) % lootPool.length]!]
    : [first]
  const effects: EffectDefinition[] = itemIds.map((itemId) => ({ type: 'addItem', itemId, quantity: 1 }))
  const names = itemIds.map((itemId) => itemDefinitionById[itemId]?.name ?? itemId).join(' · ')
  return applyEffects(state, [
    { type: 'addLog', category: 'resource', message: `[발견] 낡은 탐험가 상자 · ${names}`, sound: 'event_positive' },
    ...effects,
  ], now)
}

function resolveArtifact(state: GameState, variant: number, now: Date): GameState {
  const itemId = artifactPool[variant % artifactPool.length]!
  return applyEffects(state, [
    { type: 'addLog', category: 'progression', message: `[희귀 발견] ${itemDefinitionById[itemId]?.name ?? itemId}`, presentation: 'typewriter', sound: 'event_positive' },
    { type: 'addItem', itemId, quantity: 1 },
  ], now)
}

function resolveHazard(state: GameState, variant: number, now: Date): GameState {
  const hazard = variant % 3
  if (hazard === 0) {
    const amount = 8 + (Math.floor(variant / 3) % 8)
    return applyEffects(state, [
      { type: 'addResource', resourceId: 'material', amount: -amount },
      { type: 'addLog', category: 'warning', message: `[위험] 작은 붕괴 · 자재 -${amount}`, sound: 'event_negative' },
    ], now)
  }
  if (hazard === 1) {
    const amount = 6 + (Math.floor(variant / 3) % 7)
    return applyEffects(state, [
      { type: 'addResource', resourceId: 'mana', amount: -amount },
      { type: 'addLog', category: 'warning', message: `[위험] 마력 누출 · 마력 -${amount}`, sound: 'event_negative' },
    ], now)
  }
  return queueEvent(state, 'event_excavation_old_trap', now)
}

function resolveSingleDiscovery(state: GameState, discoveryId: DiscoveryId, variant: number, now: Date): GameState {
  if (discoveryId === 'empty') return state
  if (discoveryId === 'material_cache') return resolveMaterialCache(state, variant, now)
  if (discoveryId === 'loot') return resolveLoot(state, variant, now)
  if (discoveryId === 'artifact') return resolveArtifact(state, variant, now)
  if (discoveryId === 'hazard') return resolveHazard(state, variant, now)
  if (discoveryId === 'gold_vein') {
    return applyEffect(state, { type: 'addLog', category: 'progression', message: '[발견]\n금맥\n이 타일에 금광을 건설할 수 있습니다.', presentation: 'typewriter', sound: 'event_positive' }, now)
  }
  if (discoveryId === 'special_event') return queueEvent(state, specialEventIds[variant % specialEventIds.length]!, now)
  return state
}

function getCavernCandidates(state: GameState, origin: DungeonTile, variant: number): DungeonTile[] {
  const shape = getCavernShape(variant)
  const preferred = shape.offsets.flatMap((offset) => {
    const candidate = state.dungeon.tiles[tileId(origin.coordinate.x + offset.x, origin.coordinate.y + offset.y, origin.coordinate.floor ?? 0)]
    return candidate?.terrain === 'rock' ? [candidate] : []
  })
  const fallback = Object.values(state.dungeon.tiles)
    .filter((tile) => tile.terrain === 'rock' && Math.abs(tile.coordinate.x - origin.coordinate.x) + Math.abs(tile.coordinate.y - origin.coordinate.y) <= 2)
    .sort((first, second) => (((first.coordinate.x + 11) * 31 + (first.coordinate.y + 11) * 17 + variant) >>> 0)
      - (((second.coordinate.x + 11) * 31 + (second.coordinate.y + 11) * 17 + variant) >>> 0))
  return [...new Map([...preferred, ...fallback].map((tile) => [tile.id, tile])).values()].slice(0, shape.additionalTiles)
}

function resolveCavern(state: GameState, origin: DungeonTile, variant: number, now: Date): GameState {
  const candidates = getCavernCandidates(state, origin, variant)
  let tiles = { ...state.dungeon.tiles }
  const revealedTiles: DungeonTile[] = []
  candidates.forEach((candidate) => {
    let latent = getCavernTileResult(state.world.seed, state.world.generationVersion, origin.coordinate, candidate.coordinate)
    if (state.excavation.totalCompleted <= gameRules.excavation.safeExcavations && latent.discoveryId === 'hazard') {
      latent = { ...latent, discoveryId: 'empty' }
    }
    const revealed: DungeonTile = {
      ...candidate,
      terrain: 'floor',
      revealed: true,
      discovery: { discoveryId: latent.discoveryId, variant: latent.variant, resolved: true, source: 'cavern' },
    }
    tiles[candidate.id] = revealed
    revealedTiles.push(revealed)
  })
  tiles = revealAdjacentRocks(tiles, revealedTiles)
  let nextState: GameState = { ...state, dungeon: { ...state.dungeon, tiles } }
  nextState = applyEffect(nextState, {
    type: 'addLog', category: 'progression', message: `[발견] 공동 · 추가 공간 ${revealedTiles.length}칸 무료 공개`, sound: 'event_positive',
  }, now)
  nextState = revealAdjacentDiscoveries(nextState, revealedTiles.map((tile) => tile.id), now)
  revealedTiles.forEach((tile) => {
    const discovery = tile.discovery
    if (discovery) nextState = resolveSingleDiscovery(nextState, discovery.discoveryId, discovery.variant, now)
  })
  return nextState
}

export function resolveExcavationDiscovery(state: GameState, targetTileId: string, now = new Date()): GameState {
  const tile = state.dungeon.tiles[targetTileId]
  const discovery = tile?.discovery
  if (!tile || !discovery || !discovery.resolved) return state
  if (discovery.discoveryId === 'cavern') return resolveCavern(state, tile, discovery.variant, now)
  return resolveSingleDiscovery(state, discovery.discoveryId, discovery.variant, now)
}

export function getDiscoveryName(discoveryId: DiscoveryId): string {
  return discoveryDefinitionById[discoveryId]?.name ?? discoveryId
}
