import { describe, it, expect } from 'vitest'
import { colors, primaryScale, accentScale, neutralScale, fontWeight, spacing, layout } from './tokens'

const HEX_PATTERN = /^#[0-9A-Fa-f]{3,8}$/

describe('colors', () => {
  const requiredKeys = [
    'primary',
    'accent',
    'accentHover',
    'amber',
    'black',
    'white',
    'textDark',
    'textMuted',
    'border',
    'backgroundLight',
  ] as const

  it.each(requiredKeys)('has key "%s"', (key) => {
    expect(colors).toHaveProperty(key)
  })

  it.each(requiredKeys)('color "%s" is a valid hex string', (key) => {
    expect(colors[key]).toMatch(HEX_PATTERN)
  })

  it('primary is the confirmed navy brand colour', () => {
    expect(colors.primary).toBe('#012B43')
  })

  it('accent is the confirmed electric blue brand colour', () => {
    expect(colors.accent).toBe('#1719F4')
  })

  it('accentHover is the confirmed hover colour', () => {
    expect(colors.accentHover).toBe('#0E11C2')
  })
})

describe('primaryScale', () => {
  const steps = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const

  it.each(steps)('has step %s', (step) => {
    expect(primaryScale).toHaveProperty(String(step))
  })

  it.each(steps)('step %s is a valid hex string', (step) => {
    expect(primaryScale[step]).toMatch(HEX_PATTERN)
  })

  it('step 900 is the confirmed brand navy colour', () => {
    expect(primaryScale[900]).toBe('#012B43')
  })
})

describe('accentScale', () => {
  const steps = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const

  it.each(steps)('has step %s', (step) => {
    expect(accentScale).toHaveProperty(String(step))
  })

  it.each(steps)('step %s is a valid hex string', (step) => {
    expect(accentScale[step]).toMatch(HEX_PATTERN)
  })

  it('step 600 is the confirmed CTA colour', () => {
    expect(accentScale[600]).toBe('#1719F4')
  })

  it('step 700 is the confirmed hover colour', () => {
    expect(accentScale[700]).toBe('#0E11C2')
  })
})

describe('neutralScale', () => {
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const

  it.each(steps)('has step %s', (step) => {
    expect(neutralScale).toHaveProperty(String(step))
  })

  it.each(steps)('step %s is a valid hex string', (step) => {
    expect(neutralScale[step]).toMatch(HEX_PATTERN)
  })
})

describe('fontWeight', () => {
  it('display is 200 — for hero display headings', () => {
    expect(fontWeight.display).toBe(200)
  })

  it('regular is 400', () => {
    expect(fontWeight.regular).toBe(400)
  })

  it('medium is 500', () => {
    expect(fontWeight.medium).toBe(500)
  })

  it('semibold is 600', () => {
    expect(fontWeight.semibold).toBe(600)
  })

  it('bold is 700', () => {
    expect(fontWeight.bold).toBe(700)
  })

  it('all values are numbers, not strings', () => {
    for (const value of Object.values(fontWeight)) {
      expect(typeof value).toBe('number')
    }
  })
})

describe('spacing', () => {
  it('contentWidth is 80rem — equals max-w-7xl', () => {
    expect(spacing.contentWidth).toBe('80rem')
  })

  it('sectionY is a string ending in "rem"', () => {
    expect(typeof spacing.sectionY).toBe('string')
    expect(spacing.sectionY.endsWith('rem')).toBe(true)
  })
})

describe('layout', () => {
  it('container string includes max-w-7xl', () => {
    expect(layout.container).toContain('max-w-7xl')
  })

  it('cardGrid includes sm:grid-cols-2 and lg:grid-cols-3', () => {
    expect(layout.cardGrid).toContain('sm:grid-cols-2')
    expect(layout.cardGrid).toContain('lg:grid-cols-3')
  })
})

describe('ColorToken type', () => {
  it('covers all keys of colors object at runtime', () => {
    const allKeys = Object.keys(colors)
    expect(allKeys.length).toBeGreaterThan(0)
    for (const key of allKeys) {
      expect(typeof key).toBe('string')
    }
  })
})
