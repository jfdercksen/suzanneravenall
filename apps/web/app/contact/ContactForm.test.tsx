import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContactForm from './ContactForm'

describe('ContactForm preselection (site check W4)', () => {
  it('starts on "Select an option" with an empty message by default', () => {
    render(<ContactForm light />)

    expect(screen.getByLabelText(/What are you looking for/i)).toHaveValue('')
    expect(screen.getByLabelText(/Message/i)).toHaveValue('')
  })

  it('preselects the enquiry type passed in', () => {
    render(<ContactForm light enquiry="Speaking Enquiry" />)

    expect(screen.getByLabelText(/What are you looking for/i)).toHaveValue('Speaking Enquiry')
  })

  it('offers an Events & Immersions option', () => {
    render(<ContactForm light enquiry="Events & Immersions" />)

    expect(screen.getByRole('option', { name: 'Events & Immersions' })).toBeInTheDocument()
    expect(screen.getByLabelText(/What are you looking for/i)).toHaveValue('Events & Immersions')
  })

  it('prefills the message with the topic so the team knows what was clicked', () => {
    render(<ContactForm light enquiry="Events & Immersions" topic="3-Day Immersion" />)

    expect(screen.getByLabelText(/Message/i)).toHaveValue('Regarding: 3-Day Immersion\n\n')
  })
})

describe('ContactForm field checks (site check M5)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('shows a message when a required field loses focus empty', async () => {
    const user = userEvent.setup()
    render(<ContactForm light />)
    await user.click(screen.getByLabelText(/Name/))
    await user.tab()
    expect(screen.getByText('Please enter your name.')).toBeInTheDocument()
  })

  it('keeps letters out of the phone number', async () => {
    const user = userEvent.setup()
    render(<ContactForm light />)
    const phone = screen.getByLabelText(/Phone/)
    await user.type(phone, '+27 82 abc 555 1234')
    expect(phone).toHaveValue('+27 82  555 1234')
    expect(phone).toHaveAttribute('inputmode', 'tel')
  })

  it('does not send while fields are invalid', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<ContactForm light />)
    await user.click(screen.getByRole('button', { name: 'Send Message' }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByText('Please enter your email address.')).toBeInTheDocument()
    expect(screen.getByText('Please enter a message.')).toBeInTheDocument()
  })
})
