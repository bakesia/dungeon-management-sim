import { discoveryDefinitions, discoveryDefinitionById } from '../../content/discoveries/discoveries'
import type { Coordinate } from '../../types/game'
import type { DiscoveryId, PersistentNodeType } from '../../types/content'
import { defaultRandomSource, type RandomSource } from '../random'

export interface LatentTileResult {
  discoveryId: DiscoveryId
  variant: number
  persistentNodeType?: PersistentNodeType
}

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

export function createWorldSeed(randomSource: RandomSource = defaultRandomSource): string {
  const segments = Array.from({ length: 4 }, () => {
    const value = Math.min(Math.max(randomSource.next(), 0), 0.999999999)
    return Math.floor(value * 0x100000000).toString(16).padStart(8, '0')
  })
  return segments.join('-')
}

export function getLatentTileResult(
  worldSeed: string,
  worldGenerationVersion: number,
  coordinate: Coordinate,
): LatentTileResult {
  if (!worldSeed.trim()) throw new Error('World seed must not be empty.')
  if (!Number.isInteger(worldGenerationVersion) || worldGenerationVersion <= 0) {
    throw new Error(`Invalid worldGenerationVersion "${worldGenerationVersion}".`)
  }
  if (!Number.isInteger(coordinate.x) || !Number.isInteger(coordinate.y) || !Number.isInteger(coordinate.floor ?? 0)) {
    throw new Error('World generation requires integer coordinates.')
  }
  if (worldGenerationVersion !== 1) {
    throw new Error(`Unsupported world generation version "${worldGenerationVersion}".`)
  }

  const key = `${worldGenerationVersion}:${worldSeed}:${coordinate.floor ?? 0}:${coordinate.x}:${coordinate.y}`
  const hash = hashText(key)
  const totalWeight = discoveryDefinitions.reduce((total, definition) => total + definition.generationWeight, 0)
  let cursor = hash % totalWeight
  const selected = discoveryDefinitions.find((definition) => {
    cursor -= definition.generationWeight
    return cursor < 0
  }) ?? discoveryDefinitionById.empty

  return {
    discoveryId: selected.id,
    variant: hashText(`variant:${key}`),
    persistentNodeType: selected.persistentNodeType,
  }
}
