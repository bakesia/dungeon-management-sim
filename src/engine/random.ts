export interface RandomSource {
  next(): number
}

export const defaultRandomSource: RandomSource = {
  next: () => Math.random(),
}
