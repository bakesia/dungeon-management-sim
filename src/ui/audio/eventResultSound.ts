import type { EffectDefinition } from '../../types/content'
import type { SoundId } from './soundManager'

export function getEventResultSound(effects: EffectDefinition[]): SoundId {
  let positive = false
  let negative = false
  effects.forEach((effect) => {
    if (effect.type === 'addResource' || effect.type === 'changeCoreHp') {
      positive ||= effect.amount > 0
      negative ||= effect.amount < 0
    }
    if (effect.type === 'addPopulation' || effect.type === 'repairRoom' || effect.type === 'repairRandomRoom') positive = true
    if (effect.type === 'removePopulation' || effect.type === 'damageRoom' || effect.type === 'damageRandomRoom') negative = true
  })
  if (positive && negative) return 'event_mixed'
  if (negative) return 'event_negative'
  return positive ? 'event_positive' : 'event_neutral'
}
