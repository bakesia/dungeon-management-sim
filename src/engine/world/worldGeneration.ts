import { discoveryDefinitions, discoveryDefinitionById } from '../../content/discoveries/discoveries'
import type { DiscoveryId, PersistentNodeType } from '../../types/content'
import type { Coordinate } from '../../types/game'
import { defaultRandomSource, type RandomSource } from '../random'

export interface LatentTileResult {
  discoveryId: DiscoveryId
  variant: number
  persistentNodeType?: PersistentNodeType
}

const neighborOffsets = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }]
const guaranteedGoldCandidates: Coordinate[] = [
  { x: -2, y: -1 }, { x: -1, y: -2 }, { x: 1, y: -2 }, { x: 2, y: -1 },
  { x: 2, y: 1 }, { x: 1, y: 2 }, { x: -1, y: 2 }, { x: -2, y: 1 },
  { x: -3, y: -1 }, { x: -2, y: -2 }, { x: -1, y: -3 }, { x: 1, y: -3 },
  { x: 2, y: -2 }, { x: 3, y: -1 }, { x: 3, y: 1 }, { x: 2, y: 2 },
  { x: 1, y: 3 }, { x: -1, y: 3 }, { x: -2, y: 2 }, { x: -3, y: 1 },
]
const cavernTemplates: Coordinate[][] = [
  [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
  [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 1 }],
  [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: -1, y: 1 }],
  [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }],
]

function hashText(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  hash ^= hash >>> 16
  hash = Math.imul(hash, 2246822507)
  hash ^= hash >>> 13
  hash = Math.imul(hash, 3266489909)
  return (hash ^ (hash >>> 16)) >>> 0
}

function coordinateKey(coordinate: Coordinate): string {
  return `${coordinate.floor ?? 0}:${coordinate.x}:${coordinate.y}`
}

function worldKey(seed: string, version: number, coordinate: Coordinate): string {
  return `${version}:${seed}:${coordinateKey(coordinate)}`
}

function selectWeighted(entries: Array<{ id: DiscoveryId; weight: number }>, roll: number): DiscoveryId {
  const available = entries.filter((entry) => entry.weight > 0)
  const totalWeight = available.reduce((total, entry) => total + entry.weight, 0)
  let cursor = (roll / 0x100000000) * totalWeight
  for (const entry of available) {
    cursor -= entry.weight
    if (cursor < 0) return entry.id
  }
  return available.at(-1)?.id ?? 'empty'
}

function getVersionOneResult(key: string): LatentTileResult {
  const discoveryId = selectWeighted([
    { id: 'empty', weight: 72 }, { id: 'material_cache', weight: 10 },
    { id: 'cavern', weight: 5 }, { id: 'loot', weight: 4 },
    { id: 'hazard', weight: 3 }, { id: 'gold_vein', weight: 3 },
    { id: 'artifact', weight: 2 }, { id: 'special_event', weight: 1 },
  ], hashText(key))
  return { discoveryId, variant: hashText(`variant:${key}`), persistentNodeType: discoveryDefinitionById[discoveryId].persistentNodeType }
}

function getRawVersionTwoDiscovery(seed: string, coordinate: Coordinate): DiscoveryId {
  const distance = Math.abs(coordinate.x) + Math.abs(coordinate.y)
  const rareMultiplier = distance <= 3 ? 0.7 : distance <= 7 ? 1 : 1.2
  const rareIds = new Set<DiscoveryId>(['loot', 'gold_vein', 'artifact', 'special_event'])
  return selectWeighted(discoveryDefinitions.map((definition) => {
    let weight = definition.generationWeight * (rareIds.has(definition.id) ? rareMultiplier : 1)
    if (distance <= 2 && ['hazard', 'artifact', 'special_event'].includes(definition.id)) weight = 0
    if (distance <= 2 && definition.id === 'gold_vein') weight = 0
    return { id: definition.id, weight }
  }), hashText(worldKey(seed, 2, coordinate)))
}

function hasLowerPriorityNeighbor(seed: string, coordinate: Coordinate, ids: Set<DiscoveryId>): boolean {
  const ownPriority = hashText(`cluster:${seed}:${coordinateKey(coordinate)}`)
  return neighborOffsets.some((offset) => {
    const neighbor = { x: coordinate.x + offset.x, y: coordinate.y + offset.y, floor: coordinate.floor ?? 0 }
    return ids.has(getRawVersionTwoDiscovery(seed, neighbor))
      && hashText(`cluster:${seed}:${coordinateKey(neighbor)}`) < ownPriority
  })
}

export function getGuaranteedGoldCoordinate(worldSeed: string): Coordinate {
  return guaranteedGoldCandidates[hashText(`guaranteed-gold:${worldSeed}`) % guaranteedGoldCandidates.length]!
}

function getVersionTwoResult(seed: string, coordinate: Coordinate): LatentTileResult {
  const key = worldKey(seed, 2, coordinate)
  const guaranteedGold = getGuaranteedGoldCoordinate(seed)
  if (coordinate.x === guaranteedGold.x && coordinate.y === guaranteedGold.y && (coordinate.floor ?? 0) === 0) {
    return { discoveryId: 'gold_vein', variant: hashText(`variant:${key}`), persistentNodeType: 'gold_vein' }
  }

  let discoveryId = getRawVersionTwoDiscovery(seed, coordinate)
  const distanceToGuaranteedGold = Math.abs(coordinate.x - guaranteedGold.x) + Math.abs(coordinate.y - guaranteedGold.y)
  if (discoveryId === 'gold_vein' && distanceToGuaranteedGold <= 2) discoveryId = 'empty'
  if (discoveryId === 'gold_vein' && hasLowerPriorityNeighbor(seed, coordinate, new Set(['gold_vein']))) discoveryId = 'material_cache'
  if (discoveryId === 'cavern' && hasLowerPriorityNeighbor(seed, coordinate, new Set(['cavern']))) discoveryId = 'empty'
  if ((discoveryId === 'artifact' || discoveryId === 'special_event')
    && hasLowerPriorityNeighbor(seed, coordinate, new Set(['artifact', 'special_event']))) discoveryId = 'loot'
  return { discoveryId, variant: hashText(`variant:${key}`), persistentNodeType: discoveryDefinitionById[discoveryId].persistentNodeType }
}

export function createWorldSeed(randomSource: RandomSource = defaultRandomSource): string {
  const segments = Array.from({ length: 4 }, () => {
    const value = Math.min(Math.max(randomSource.next(), 0), 0.999999999)
    return Math.floor(value * 0x100000000).toString(16).padStart(8, '0')
  })
  return segments.join('-')
}

export function getLatentTileResult(worldSeed: string, worldGenerationVersion: number, coordinate: Coordinate): LatentTileResult {
  if (!worldSeed.trim()) throw new Error('World seed must not be empty.')
  if (!Number.isInteger(worldGenerationVersion) || worldGenerationVersion <= 0) throw new Error(`Invalid worldGenerationVersion "${worldGenerationVersion}".`)
  if (!Number.isInteger(coordinate.x) || !Number.isInteger(coordinate.y) || !Number.isInteger(coordinate.floor ?? 0)) throw new Error('World generation requires integer coordinates.')
  const key = worldKey(worldSeed, worldGenerationVersion, coordinate)
  if (worldGenerationVersion === 1) return getVersionOneResult(key)
  if (worldGenerationVersion === 2) return getVersionTwoResult(worldSeed, coordinate)
  throw new Error(`Unsupported world generation version "${worldGenerationVersion}".`)
}

export function getCavernShape(variant: number): { additionalTiles: number; offsets: Coordinate[] } {
  const additionalTiles = variant % 10 < 6 ? 3 : 4
  const template = cavernTemplates[Math.floor(variant / 10) % cavernTemplates.length]!
  const rotation = Math.floor(variant / 100) % 4
  const offsets = template.map((offset) => {
    if (rotation === 1) return { x: -offset.y, y: offset.x }
    if (rotation === 2) return { x: -offset.x, y: -offset.y }
    if (rotation === 3) return { x: offset.y, y: -offset.x }
    return { ...offset }
  })
  return { additionalTiles, offsets }
}

export function getCavernTileResult(worldSeed: string, worldGenerationVersion: number, cavernCoordinate: Coordinate, coordinate: Coordinate): LatentTileResult {
  const key = `cavern:${worldGenerationVersion}:${worldSeed}:${coordinateKey(cavernCoordinate)}:${coordinateKey(coordinate)}`
  const discoveryId = selectWeighted([
    { id: 'empty', weight: 65 }, { id: 'loot', weight: 15 }, { id: 'material_cache', weight: 10 },
    { id: 'hazard', weight: 7 }, { id: 'artifact', weight: 3 },
  ], hashText(key))
  return { discoveryId, variant: hashText(`variant:${key}`) }
}
