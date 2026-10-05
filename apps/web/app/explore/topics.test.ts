import { describe, it, expect } from 'vitest'
import { topics, topicBySlug, topicPanelSubline } from './topics'

const norm = (s: string) =>
  s.toLowerCase().replace(/n[’']t\b/g, ' not').replace(/[^a-z0-9]+/g, ' ').trim()

describe('topicPanelSubline', () => {
  // Site check C9: the /explore hub panel repeated its heading as the sub-line
  it('never repeats the panel heading for any topic', () => {
    for (const topic of topics) {
      expect(norm(topicPanelSubline(topic)), topic.slug).not.toBe(norm(topic.heroHeadline))
    }
  })

  it('keeps shortDescription when it already differs from the heading', () => {
    const topic = topicBySlug('emotional-nervous-system-mastery')!
    expect(topicPanelSubline(topic)).toBe(topic.shortDescription)
  })

  it('falls back to the opening question when the two match', () => {
    const topic = topicBySlug('relationships-attachment-patterns')!
    expect(topicPanelSubline(topic)).toBe(topic.openingQuestion)
  })

  it('treats "isn’t" and "Is Not" as the same sentence', () => {
    const topic = topicBySlug('intuition-as-patterned-intelligence')!
    expect(topicPanelSubline(topic)).toBe(topic.openingQuestion)
  })
})
