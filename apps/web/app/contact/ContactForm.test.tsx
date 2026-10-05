import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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
