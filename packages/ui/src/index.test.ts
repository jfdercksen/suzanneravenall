import { describe, it, expect } from 'vitest'

describe('barrel export — index.ts', () => {
  it('exports Logo', async () => {
    const module = await import('./index')
    expect(module.Logo).toBeDefined()
    expect(typeof module.Logo).toBe('function')
  })

  it('exports colors token', async () => {
    const module = await import('./index')
    expect(module.colors).toBeDefined()
    expect(typeof module.colors).toBe('object')
  })
})
