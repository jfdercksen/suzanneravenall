import { describe, expect, it } from 'vitest'
import { computeResult } from './scoring'
import type { Quiz } from '@/app/explore/quizzes/types'

const baseQuiz: Quiz = {
  slug: 'test-quiz',
  title: 'Test Quiz',
  subtitle: '',
  intro: '',
  questions: [
    { id: 1, text: 'q1', category: 'a' },
    { id: 2, text: 'q2', category: 'a' },
    { id: 3, text: 'q3', category: 'b' },
    { id: 4, text: 'q4', category: 'c' },
  ],
  categories: ['a', 'b', 'c'],
  results: {
    a: { title: '', subtitle: '', mirror: '', mechanism: '', impact: [], shift: [], cta: '' },
    b: { title: '', subtitle: '', mirror: '', mechanism: '', impact: [], shift: [], cta: '' },
    c: { title: '', subtitle: '', mirror: '', mechanism: '', impact: [], shift: [], cta: '' },
  },
}

describe('computeResult', () => {
  it('returns the category with the highest summed score', () => {
    const result = computeResult(baseQuiz, { 1: 4, 2: 4, 3: 1, 4: 1 })
    expect(result).toBe('a')
  })

  it('resolves ties to the last category in declaration order', () => {
    // a: q1+q2 = 2, b: q3 = 2, c: q4 = 2 — all tied, 'c' declared last wins.
    const result = computeResult(baseQuiz, { 1: 1, 2: 1, 3: 2, 4: 2 })
    expect(result).toBe('c')
  })

  it('falls through to the last-declared category when every answer is zero', () => {
    const result = computeResult(baseQuiz, { 1: 0, 2: 0, 3: 0, 4: 0 })
    expect(result).toBe('c')
  })

  it('treats missing answers as zero', () => {
    const result = computeResult(baseQuiz, { 1: 3 })
    expect(result).toBe('a')
  })

  it('matches the original nervous-system quiz tie-break behavior for its declared category order', () => {
    // fight/flight/freeze/mixed — mixed declared last, so it wins ties,
    // including the documented all-zero → "Regulated Responder" case.
    const nsQuiz: Quiz = {
      ...baseQuiz,
      categories: ['fight', 'flight', 'freeze', 'mixed'],
      results: {
        // Non-null: baseQuiz.results.a is a hardcoded fixture defined above,
        // always present — `Record<QuizCategory, QuizResult>`'s generic index
        // signature is what makes TS treat the read as possibly undefined.
        fight: baseQuiz.results.a!,
        flight: baseQuiz.results.a!,
        freeze: baseQuiz.results.a!,
        mixed: baseQuiz.results.a!,
      },
    }
    expect(computeResult(nsQuiz, {})).toBe('mixed')
  })

  it('documents a known behavior difference from the original bespoke tie-break: a category tying the max via a lopsided score no longer preserves the old fight/flight/freeze-trio-spread rule', () => {
    // Old algorithm: fight=10, flight=0, freeze=0, mixed=10 -> 'fight' wins
    // because the fight/flight/freeze trio spread (10) exceeds the old
    // allWithin2 threshold, so 'mixed' could not win despite tying the max.
    // New generic algorithm has no concept of a "trio" — it just picks the
    // last category tying the overall max, so 'mixed' wins here instead.
    const nsQuiz: Quiz = {
      ...baseQuiz,
      questions: [
        { id: 1, text: 'q1', category: 'fight' },
        { id: 2, text: 'q2', category: 'mixed' },
      ],
      categories: ['fight', 'flight', 'freeze', 'mixed'],
      results: {
        // Non-null: baseQuiz.results.a is a hardcoded fixture defined above,
        // always present — `Record<QuizCategory, QuizResult>`'s generic index
        // signature is what makes TS treat the read as possibly undefined.
        fight: baseQuiz.results.a!,
        flight: baseQuiz.results.a!,
        freeze: baseQuiz.results.a!,
        mixed: baseQuiz.results.a!,
      },
    }
    expect(computeResult(nsQuiz, { 1: 4, 2: 4 })).toBe('mixed')
  })
})
