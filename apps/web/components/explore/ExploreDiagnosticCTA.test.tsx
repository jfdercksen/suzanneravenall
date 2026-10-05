import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ExploreDiagnosticCTA from './ExploreDiagnosticCTA'
import { getQuizTopicSlug } from './topicQuizMap'
import { patternQuizzes } from '@/data/patternQuizzes'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => <a href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>{children}</a>,
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      initial,
      animate,
      transition,
      whileInView,
      viewport,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
      <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    ),
  },
}))

describe('getQuizTopicSlug', () => {
  it('maps every quiz in the catalogue back to an explore topic', () => {
    for (const quiz of patternQuizzes) {
      expect(getQuizTopicSlug(quiz.slug), quiz.slug).toBeDefined()
    }
  })

  it('returns undefined for an unknown quiz', () => {
    expect(getQuizTopicSlug('not-a-quiz')).toBeUndefined()
  })
})

describe('ExploreDiagnosticCTA', () => {
  it('links each teaser card to its topic quiz', () => {
    render(<ExploreDiagnosticCTA />)
    const expected: Array<[string, string]> = [
      ['nervous-system', '/explore/emotional-nervous-system-mastery/quiz'],
      ['relationships', '/explore/relationships-attachment-patterns/quiz'],
      ['identity-purpose', '/explore/identity-purpose-activation/quiz'],
    ]
    for (const [quizSlug, href] of expected) {
      const quiz = patternQuizzes.find((q) => q.slug === quizSlug)!
      const link = screen.getByText(quiz.question).closest('a')
      expect(link).toHaveAttribute('href', href)
    }
  })

  it('links the "more diagnostics" line to the full diagnostic list', () => {
    render(<ExploreDiagnosticCTA />)
    const more = screen.getByText(/more diagnostics available/).closest('a')
    expect(more).toHaveAttribute('href', '/discover-your-pattern#assessments')
  })
})
