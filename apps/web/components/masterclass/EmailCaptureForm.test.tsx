import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

import EmailCaptureForm from './EmailCaptureForm'

function fill(firstName: string, email: string) {
  fireEvent.change(screen.getByLabelText('First name'), { target: { value: firstName } })
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: email } })
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  push.mockReset()
})

describe('EmailCaptureForm', () => {
  it('sends the visitor to the watch page after a Watch Now registration', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    )
    render(<EmailCaptureForm />)
    fill('Thandi', 'thandi@example.com')
    fireEvent.click(screen.getByRole('button', { name: 'Register and Watch →' }))

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/masterclass/watch'))
  })

  // KI061: the page confirmation names the chosen date and time in the words
  // the welcome mail uses.
  it('names the chosen date and time after a Watch Later registration', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }))
    render(<EmailCaptureForm />)
    fill('Thandi', 'thandi@example.com')
    fireEvent.click(screen.getByLabelText('Watch Later'))
    const inAWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const date = inAWeek.toISOString().slice(0, 10)
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: date } })
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '10:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Register →' }))

    await screen.findByText('Thank you, you’re registered.')
    const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][inAWeek.getUTCDay()]
    const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][inAWeek.getUTCMonth()]
    const expected = `${weekday} ${inAWeek.getUTCDate()} ${month} ${inAWeek.getUTCFullYear()} at 10:00`
    expect(screen.getByText(`You chose to watch on ${expected}. We have emailed you the link, and it works whenever you are ready.`)).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toEqual({
      firstName: 'Thandi',
      email: 'thandi@example.com',
      source: 'masterclass',
      watchDate: date,
      watchTime: '10:00',
    })
  })

  it('asks for a date and time before posting a Watch Later registration', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    render(<EmailCaptureForm />)
    fill('Thandi', 'thandi@example.com')
    fireEvent.click(screen.getByLabelText('Watch Later'))
    fireEvent.click(screen.getByRole('button', { name: 'Register →' }))

    expect(screen.getByText('Please choose a date.')).toBeInTheDocument()
    expect(screen.getByText('Please choose a time.')).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
