import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EmailNotifyForm from './EmailNotifyForm'

function fill(firstName: string, email: string) {
  fireEvent.change(screen.getByLabelText('First name'), { target: { value: firstName } })
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: email } })
  fireEvent.click(screen.getByRole('button', { name: 'Notify Me' }))
}

describe('EmailNotifyForm (site check B12)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('has labelled inputs', () => {
    render(<EmailNotifyForm />)

    expect(screen.getByLabelText('First name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
  })

  it('posts firstName (the field the API reads), not name', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }))
    render(<EmailNotifyForm />)

    fill('Thandi', 'thandi@example.com')

    await screen.findByText(/on the list/i)
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/lead-magnet')
    expect(JSON.parse(init.body as string)).toEqual({
      firstName: 'Thandi',
      email: 'thandi@example.com',
      source: 'assessments-notify',
    })
  })

  it('shows the API error message when the lead is not saved', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'We could not save your details right now.' }), {
        status: 502,
      }),
    )
    render(<EmailNotifyForm />)

    fill('Thandi', 'thandi@example.com')

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('We could not save your details right now.'),
    )
    expect(screen.queryByText(/on the list/i)).not.toBeInTheDocument()
  })
})
