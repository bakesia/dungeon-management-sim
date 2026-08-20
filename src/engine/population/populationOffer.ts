import type { GameState, PopulationJoinRuntimeState } from '../../types/game'

type PendingOffer = NonNullable<PopulationJoinRuntimeState['pending']>

export function queuePopulationOffer(state: GameState, pending: PendingOffer, now = new Date()): GameState {
  if (state.populationJoin.pending) throw new Error('다른 주민 합류 결정이 진행 중입니다.')
  const incoming = pending.incoming.filter((entry) => Number.isInteger(entry.count) && entry.count > 0)
  if (incoming.length === 0) return state
  return { ...state, populationJoin: { pending: { ...pending, incoming } }, metadata: { ...state.metadata, updatedAt: now.toISOString() } }
}
