import { describe, expect, it } from 'vitest'
import { validateContent } from './validateContent'

describe('validateContent', () => {
  it('accepts the bundled v0.1.8 content definitions', () => {
    expect(() => validateContent()).not.toThrow()
  })
})
