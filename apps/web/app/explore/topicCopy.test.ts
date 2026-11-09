import { describe, it, expect } from 'vitest'
import { topicCopy, topicCopyText } from './topicCopy'
import { topics } from './topics'

const REWRITTEN = [
  'emotional-nervous-system-mastery',
  'relationships-attachment-patterns',
  'next-level-health-vitality-longevity',
  'identity-purpose-activation',
  'leadership-high-performance',
  'intuition-as-patterned-intelligence',
] as const

describe('topicCopy (Suzanne, 8 Nov 2026)', () => {
  it('covers the six pages she rewrote, and only real topics', () => {
    expect(Object.keys(topicCopy).sort()).toEqual([...REWRITTEN].sort())
    const slugs = new Set<string>(topics.map((t) => t.slug))
    for (const slug of Object.keys(topicCopy)) expect(slugs.has(slug)).toBe(true)
  })

  it('gives every page six What Shifts items and a closing line', () => {
    for (const slug of REWRITTEN) {
      const shifts = topicCopy[slug]!.shifts
      expect(shifts.items, slug).toHaveLength(6)
      expect(shifts.closing, slug).toMatch(/^Decode the pattern\./)
    }
  })

  it('carries no em dash and no leftover list numbering in any line', () => {
    for (const slug of REWRITTEN) {
      for (const line of topicCopyText(topicCopy[slug]!)) {
        expect(line, `${slug}: ${line}`).not.toContain('—')
        expect(line, `${slug}: ${line}`).not.toMatch(/^0\d ·/)
        expect(line.trim(), slug).toBe(line)
        expect(line.length, slug).toBeGreaterThan(0)
      }
    }
  })

  it('names all four survival responses, fawn included, on emotional mastery', () => {
    const cards = topicCopy['emotional-nervous-system-mastery']!.pattern.blocks.find(
      (b) => b.kind === 'cards',
    )
    expect(cards?.kind === 'cards' && cards.cards.map((c) => c.title)).toEqual([
      'Fight',
      'Flight',
      'Freeze',
      'Fawn',
    ])
  })

  it('gives every comparison row two cells', () => {
    for (const slug of REWRITTEN) {
      for (const block of topicCopy[slug]!.pattern.blocks) {
        if (block.kind !== 'compare') continue
        for (const row of block.rows) expect(row.every((cell) => cell.length > 0)).toBe(true)
      }
    }
  })
})
