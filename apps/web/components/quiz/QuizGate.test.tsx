import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Quiz } from '@/app/explore/quizzes/types'

vi.mock('./QuizFlow', () => ({ default: () => null }))

import QuizGate from './QuizGate'

const QUIZ: Quiz = {
  slug: 'emotional-nervous-system-mastery',
  title: 'Nervous System Pattern',
  subtitle: '',
  intro: '',
  questions: [],
  categories: [],
  results: {},
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

describe('QuizGate', () => {
  // Site check M5: messages appear on blur, not only after submit.
  it('shows a field message when a required field loses focus empty', async () => {
    const user = userEvent.setup()
    render(<QuizGate quiz={QUIZ} initialMode="gate" />)
    await user.click(screen.getByLabelText('First name'))
    await user.tab()
    expect(screen.getByText('Please enter your first name.')).toBeInTheDocument()
    expect(screen.getByLabelText('First name')).toHaveAttribute('aria-invalid', 'true')
  })

  it('flags a malformed email on blur and clears it once fixed', async () => {
    const user = userEvent.setup()
    render(<QuizGate quiz={QUIZ} initialMode="gate" />)
    const email = screen.getByLabelText('Email')
    await user.type(email, 'ann@')
    await user.tab()
    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument()
    await user.type(email, 'example.com')
    expect(screen.queryByText('Please enter a valid email address.')).not.toBeInTheDocument()
  })

  it('does not call the API while a field is invalid', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<QuizGate quiz={QUIZ} initialMode="gate" />)
    await user.click(screen.getByRole('button', { name: 'Send Me the Diagnostic' }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByText('Please enter your last name.')).toBeInTheDocument()
  })

  // Site check M9.
  it('links back to its topic', () => {
    render(<QuizGate quiz={QUIZ} initialMode="gate" topicTitle="Emotional & Nervous System Mastery" />)
    expect(screen.getByRole('link', { name: /Back to Emotional & Nervous System Mastery/ })).toHaveAttribute(
      'href',
      '/explore/emotional-nervous-system-mastery',
    )
  })

  it('strips the dead ?token= when the visitor asks for a new link', async () => {
    window.history.replaceState(null, '', '/explore/emotional-nervous-system-mastery/quiz?token=abc&x=1')
    const user = userEvent.setup()
    render(<QuizGate quiz={QUIZ} initialMode="invalid" />)
    await user.click(screen.getByRole('button', { name: 'Get a New Link' }))
    expect(window.location.search).toBe('?x=1')
    expect(window.location.pathname).toBe('/explore/emotional-nervous-system-mastery/quiz')
    expect(screen.getByRole('button', { name: 'Send Me the Diagnostic' })).toBeInTheDocument()
  })
})
