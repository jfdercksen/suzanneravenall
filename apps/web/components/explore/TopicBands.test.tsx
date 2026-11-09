import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { topicBySlug } from '@/app/explore/topics'
import { topicCopy } from '@/app/explore/topicCopy'
import { TOPIC_DOCUMENTS } from '@/lib/search/siteSearch'
import TopicRecognition from './TopicRecognition'
import TopicOverview from './TopicOverview'
import TopicDiscover from './TopicDiscover'

// Covers the three top bands of an Explore topic page together: each renders
// Suzanne's 8 Nov copy where topicCopy has it, the older fields otherwise.

vi.mock('framer-motion', () => {
  const MOTION_PROPS = ['initial', 'animate', 'exit', 'transition', 'variants', 'whileInView', 'viewport', 'whileHover', 'whileTap']
  const make = (tag: string) =>
    function MotionStub(props: Record<string, unknown> & { children?: React.ReactNode }) {
      const rest = Object.fromEntries(Object.entries(props).filter(([k]) => !MOTION_PROPS.includes(k)))
      return React.createElement(tag, rest, props.children)
    }
  return { motion: new Proxy({}, { get: (_t, tag: string) => make(tag) }) }
})

const emotional = topicBySlug('emotional-nervous-system-mastery')!
const relationships = topicBySlug('relationships-attachment-patterns')!
const transitions = topicBySlug('life-transitions-reinvention')!

describe('TopicRecognition', () => {
  it('renders her grouped list and closing line', () => {
    render(<TopicRecognition topic={emotional} />)
    expect(screen.getByRole('heading', { level: 2, name: 'You might recognise this…' })).toBeInTheDocument()
    for (const heading of ['In the moment', 'Underneath it all', 'Over time']) {
      expect(screen.getByRole('heading', { level: 3, name: heading })).toBeInTheDocument()
    }
    expect(screen.getByText('Living in fight, flight, freeze or fawn without realising it')).toBeInTheDocument()
    expect(screen.getByText('This isn’t your personality. It’s your patterning.')).toBeInTheDocument()
  })

  it('shows the note line where she wrote one', () => {
    render(<TopicRecognition topic={relationships} />)
    expect(screen.getByText(/And it’s not only romance\./)).toBeInTheDocument()
  })

  it('keeps the older flat list for a topic she has not rewritten', () => {
    render(<TopicRecognition topic={transitions} />)
    for (const item of transitions.recognitionItems) expect(screen.getByText(item)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull()
  })
})

describe('TopicOverview', () => {
  it('renders her headline, the four survival pattern cards and the closing statement', () => {
    render(<TopicOverview topic={emotional} />)
    expect(
      screen.getByRole('heading', { level: 2, name: 'Your emotions aren’t the problem. They’re the evidence.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'The four survival patterns' })).toBeInTheDocument()
    for (const title of ['Fight', 'Flight', 'Freeze', 'Fawn']) {
      expect(screen.getByRole('heading', { level: 4, name: title })).toBeInTheDocument()
    }
    expect(screen.getByText('Protect by pleasing.')).toBeInTheDocument()
    expect(screen.getByText('You have to change the system.')).toBeInTheDocument()
  })

  it('renders a comparison as a table with column headers', () => {
    render(<TopicOverview topic={relationships} />)
    const table = screen.getByRole('table')
    expect(within(table).getByRole('columnheader', { name: 'Familiar' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Safe' })).toBeInTheDocument()
    expect(within(table).getAllByRole('row')).toHaveLength(6)
    expect(within(table).getByText('Love that doesn’t need to be earned')).toBeInTheDocument()
  })

  it('keeps the older layout for a topic she has not rewritten', () => {
    render(<TopicOverview topic={transitions} />)
    expect(screen.getByRole('heading', { level: 2, name: transitions.corePrinciple })).toBeInTheDocument()
    expect(screen.getByText(transitions.overview[0]!)).toBeInTheDocument()
  })
})

describe('TopicDiscover', () => {
  it('renders her six shifts, the intro and the closing line', () => {
    render(<TopicDiscover topic={relationships} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Relationships after repatterning' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(6)
    expect(screen.getByText(/When your system learns that closeness is safe/)).toBeInTheDocument()
    expect(screen.getByText('Decode the pattern. Love differently.')).toBeInTheDocument()
  })

  it('keeps the older cards for a topic she has not rewritten', () => {
    render(<TopicDiscover topic={transitions} />)
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(transitions.discover.length)
  })
})

describe('every rewritten topic', () => {
  for (const slug of Object.keys(topicCopy) as (keyof typeof topicCopy)[]) {
    it(`renders all three bands for ${slug}, card titles at h4 only under a block h3`, () => {
      const topic = topicBySlug(slug)!
      const { container } = render(
        <>
          <TopicRecognition topic={topic} />
          <TopicOverview topic={topic} />
          <TopicDiscover topic={topic} />
        </>,
      )
      expect(container.querySelectorAll('section')).toHaveLength(3)
      expect(screen.getByText(topicCopy[slug]!.shifts.closing)).toBeInTheDocument()
      for (const h4 of container.querySelectorAll('h4')) {
        const block = h4.closest('ul')?.parentElement
        expect(block?.querySelector('h3')).not.toBeNull()
      }
    })
  }
})

describe('site search over the rewritten topics', () => {
  it('indexes her new copy and drops the old flat list', () => {
    const doc = TOPIC_DOCUMENTS.find((d) => d.url === '/explore/emotional-nervous-system-mastery')!
    const body = doc.body.join(' ')
    expect(body).toContain('Protect by pleasing.')
    expect(body).not.toContain('Living in fight, flight or freeze')
  })
})
