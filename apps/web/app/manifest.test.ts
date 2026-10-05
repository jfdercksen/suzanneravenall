import { describe, it, expect } from 'vitest'
import { existsSync } from 'fs'
import { join } from 'path'
import manifest from './manifest'

describe('web manifest (site check M3)', () => {
  it('names the site and declares 192 and 512 icons', () => {
    const m = manifest()
    expect(m.name).toBe('Dr. Suzanne Ravenall')
    expect(m.icons?.map((i) => i.sizes)).toEqual(['192x192', '512x512'])
  })

  it('points every icon at a file that exists in public/', () => {
    for (const icon of manifest().icons ?? []) {
      expect(existsSync(join(__dirname, '..', 'public', icon.src))).toBe(true)
    }
  })
})
