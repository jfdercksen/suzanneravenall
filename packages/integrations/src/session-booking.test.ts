// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { bookerName, sessionBookingUrl, sessionDurationMinutes } from './session-booking'

// KI079: the session length for every private-session variant on sale, read
// from the 15 Oct purchase list, and the Cal.com link it books on.
const PURCHASE_LIST = fileURLToPath(
  new URL('../../../docs/testing/results/purchase-list-2026-10-15-07-16.csv', import.meta.url)
)

// The private-session products (category private-sessions and its children).
const SESSION_PRODUCTS = [
  'Executive Coaching Session',
  'Exploring the Alpha Mind',
  'Rapid Repatterning Session',
  'Resonance Repatterning / Coaching Session',
  'Transformation Coaching Session',
  'Akashic Coaching / Clearing Session',
  'Group Family Coaching',
  'Rapid Transformation Therapy Session',
  'Energetic Clearing',
  'Coaching Support Package',
]

// "Product / Variant" -> minutes, written out by hand from the catalogue so a
// change to the rules shows up here as a failing row, not a silent shift.
const EXPECTED: ReadonlyArray<[string, number]> = [
  ['Rapid Repatterning Session / 90 min online', 90],
  ['Rapid Repatterning Session / 90 min in-person', 90],
  ['Rapid Repatterning Session / Package of 04 (60 min online)', 60],
  ['Rapid Repatterning Session / Package of 08 (60 min online)', 60],
  ['Rapid Repatterning Session / Package of 12 (60 min online)', 60],
  ['Rapid Repatterning Session / Package of 16 (60 min online)', 60],
  ['Rapid Repatterning Session / Package of 04 (90 min online)', 90],
  ['Rapid Repatterning Session / Package of 08 (90 min online)', 90],
  ['Rapid Repatterning Session / Package of 12 (90 min online)', 90],
  ['Rapid Repatterning Session / Package of 16 (90 min online)', 90],
  ['Rapid Repatterning Session / 60 min in-person', 60],
  ['Rapid Repatterning Session / 60 min online', 60],
  ['Resonance Repatterning / Coaching Session / 60 min online', 60],
  ['Resonance Repatterning / Coaching Session / 90 min online', 90],
  ['Resonance Repatterning / Coaching Session / Package of 04 (60 min)', 60],
  ['Resonance Repatterning / Coaching Session / Package of 08 (60 min)', 60],
  ['Resonance Repatterning / Coaching Session / Package of 12 (60 min)', 60],
  ['Resonance Repatterning / Coaching Session / Package of 16 (60 min)', 60],
  ['Resonance Repatterning / Coaching Session / Package of 04 (90 min)', 90],
  ['Resonance Repatterning / Coaching Session / Package of 08 (90 min)', 90],
  ['Resonance Repatterning / Coaching Session / Package of 16 (90 min)', 90],
  ['Resonance Repatterning / Coaching Session / Package of 12 (90 min)', 90],
  ['Transformation Coaching Session / 60 min', 60],
  ['Transformation Coaching Session / 90 min', 90],
  ['Transformation Coaching Session / Package of 04', 60],
  ['Transformation Coaching Session / Package of 08', 60],
  ['Transformation Coaching Session / Package of 12', 60],
  ['Transformation Coaching Session / Package of 16', 60],
  ['Executive Coaching Session / 30 min', 30],
  ['Executive Coaching Session / 60 min', 60],
  ['Executive Coaching Session / Package of 04', 60],
  ['Executive Coaching Session / Package of 08', 60],
  ['Executive Coaching Session / Package of 12', 60],
  ['Executive Coaching Session / Package of 16', 60],
  ['Akashic Coaching / Clearing Session / 60 min', 60],
  ['Akashic Coaching / Clearing Session / 90 min', 90],
  ['Akashic Coaching / Clearing Session / Package of 04', 60],
  ['Akashic Coaching / Clearing Session / Package of 08', 60],
  ['Akashic Coaching / Clearing Session / Package of 12', 60],
  ['Group Family Coaching / Single session', 60],
  ['Group Family Coaching / Package of 04', 60],
  ['Group Family Coaching / Package of 08', 60],
  ['Exploring the Alpha Mind / Single session (45 min)', 45],
  ['Exploring the Alpha Mind / Package of 05', 45],
  ['Exploring the Alpha Mind / Package of 08', 45],
  ['Rapid Transformation Therapy Session / 1 hypnosis session + recording', 60],
  ['Rapid Transformation Therapy Session / 1 hypnosis session + recording + 2 coaching sessions', 60],
  ['Energetic Clearing / Single session', 60],
  ['Energetic Clearing / Package of 04', 60],
  ['Energetic Clearing / Package of 08', 60],
  ['Energetic Clearing / Package of 12', 60],
  ['Coaching Support Package / Per session', 60],
]

// One CSV line into cells: quoted fields may hold commas and "" for a quote.
function csvCells(line: string): string[] {
  const cells: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') {
        quoted = false
      } else {
        cell += ch
      }
    } else if (ch === '"') {
      quoted = true
    } else if (ch === ',') {
      cells.push(cell)
      cell = ''
    } else {
      cell += ch
    }
  }
  cells.push(cell)
  return cells
}

function readPurchaseList(): Array<{ product: string; handle: string; variant: string }> {
  const [header, ...lines] = readFileSync(PURCHASE_LIST, 'utf8').split(/\r?\n/).filter(Boolean)
  const cols = csvCells(header)
  const at = (name: string) => cols.indexOf(name)
  return lines.map((line) => {
    const cells = csvCells(line)
    const combined = cells[at('page_or_product')]
    const variant = cells[at('variant')]
    return {
      product: combined.slice(0, combined.length - variant.length - 3),
      handle: cells[at('link')].split('/shop/')[1] ?? '',
      variant,
    }
  })
}

const sessionRows = readPurchaseList().filter((row) => SESSION_PRODUCTS.includes(row.product))

describe('sessionDurationMinutes on the purchase list', () => {
  it('finds every session variant the expectations cover', () => {
    expect(sessionRows.map((r) => `${r.product} / ${r.variant}`).sort()).toEqual(EXPECTED.map(([key]) => key).sort())
  })

  it.each(sessionRows.map((r) => [`${r.product} / ${r.variant}`, r] as const))('%s', (key, row) => {
    const expected = EXPECTED.find(([k]) => k === key)?.[1]
    expect(
      sessionDurationMinutes({ productTitle: row.product, productHandle: row.handle, variantTitle: row.variant })
    ).toBe(expected)
  })
})

describe('sessionDurationMinutes rules', () => {
  it('reads the minutes from the variant title', () => {
    expect(sessionDurationMinutes({ variantTitle: '30 min' })).toBe(30)
    expect(sessionDurationMinutes({ variantTitle: 'Package of 04 (90 min online)' })).toBe(90)
  })

  it('gives an Alpha Mind package the 45 minutes of its single session', () => {
    expect(sessionDurationMinutes({ productHandle: 'exploring-the-alpha-mind-45-minutes', variantTitle: 'Package of 08' })).toBe(45)
  })

  it('falls back to 60 for a length it has no event for', () => {
    expect(sessionDurationMinutes({ variantTitle: '120 min' })).toBe(60)
    expect(sessionDurationMinutes({})).toBe(60)
  })

  it('ignores the 30 in the Executive Coaching handle for a package', () => {
    expect(sessionDurationMinutes({ productHandle: 'executive-coaching-30-mins', variantTitle: 'Package of 04' })).toBe(60)
  })
})

describe('sessionBookingUrl', () => {
  const base = 'http://169.239.180.49:3002/suzanneravenall'

  it('builds the event URL with the buyer prefilled', () => {
    expect(
      sessionBookingUrl(base, { variantTitle: '45 min' }, { name: 'Johan QA Test', email: 'johan@aiautomations.co.za' })
    ).toBe(`${base}/session-45?name=Johan+QA+Test&email=johan%40aiautomations.co.za`)
  })

  it('drops a trailing slash on the base and leaves out empty prefill', () => {
    expect(sessionBookingUrl(`${base}/`, { variantTitle: '90 min' }, { name: ' ', email: null })).toBe(`${base}/session-90`)
  })

  it('encodes characters that would break the query', () => {
    expect(sessionBookingUrl(base, {}, { name: 'A&B', email: 'a+b@example.com' })).toBe(
      `${base}/session-60?name=A%26B&email=a%2Bb%40example.com`
    )
  })
})

describe('bookerName', () => {
  it('joins first and last name', () => {
    expect(bookerName('Johan', 'QA Test')).toBe('Johan QA Test')
  })

  it('returns null when both parts are empty', () => {
    expect(bookerName(' ', null)).toBeNull()
  })
})
