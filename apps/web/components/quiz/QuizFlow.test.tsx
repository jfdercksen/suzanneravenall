import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Quiz } from '@/app/explore/quizzes/types'
import QuizFlow from './QuizFlow'

const RESULT = { title: 'Fight', subtitle: 'Your pattern', mirror: '', mechanism: '', impact: [], shift: [], cta: 'Book' }
const QUIZ: Quiz = {
  slug: 'nervous-system',
  title: 'Nervous System Pattern',
  subtitle: 'How your body responds',
  intro: 'Answer honestly.',
  questions: [{ id: 1, text: 'I feel on edge', category: 'fight' }],
  categories: ['fight'],
  results: { fight: RESULT },
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('QuizFlow consent before the first question (POPIA)', () => {
  it('asks for the consent tick, with the Privacy Notice, before the first question', async () => {
    const user = userEvent.setup()
    render(<QuizFlow quiz={QUIZ} subscriberId="sub-1" accessToken={'t'.repeat(43)} />)
    const tick = screen.getByRole('checkbox', { name: /health and wellbeing/ })
    expect(tick).not.toBeChecked()
    expect(screen.getByRole('link', { name: 'Privacy Notice' })).toHaveAttribute('href', '/legal/privacy')
    await user.click(screen.getByRole('button', { name: /Start the Diagnostic/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('Please tick the box to agree before you start.')
    expect(screen.queryByText('I feel on edge')).not.toBeInTheDocument()
  })

  it('starts once ticked and sends the consent with the answers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<QuizFlow quiz={QUIZ} subscriberId="sub-1" accessToken={'t'.repeat(43)} />)
    await user.click(screen.getByRole('checkbox', { name: /health and wellbeing/ }))
    await user.click(screen.getByRole('button', { name: /Start the Diagnostic/ }))
    expect(await screen.findByText('I feel on edge')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Often' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/quiz/complete', expect.anything()))
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string)
    expect(body).toMatchObject({ quizSlug: 'nervous-system', consent: true, answers: { '1': 3 } })
  })
})
