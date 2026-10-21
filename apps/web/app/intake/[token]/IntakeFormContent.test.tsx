import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import IntakeFormContent from './IntakeFormContent'
import type { IntakeForm } from '@/lib/intake/types'

const FORM: IntakeForm = {
  id: '1',
  formKey: 'standard',
  title: 'Client intake form',
  active: true,
  isDefault: true,
  services: [],
  intro: 'Please fill in the form.',
  acknowledgement: 'I acknowledge the terms.',
  recipientEmail: null,
  fields: [
    { id: 'h', type: 'heading', label: 'Personal details', helpText: null, options: [], required: false, withDetail: false },
    { id: 'name', type: 'text', label: 'Full name', helpText: null, options: [], required: true, withDetail: false },
    { id: 'feel', type: 'checkbox-group', label: 'Feelings', helpText: 'Tick all that apply.', options: ['Panic', 'Sad'], required: false, withDetail: false },
    { id: 'ready', type: 'scale', label: 'How ready are you?', helpText: null, options: [], required: true, withDetail: false },
  ],
}

const TOKEN = 'a'.repeat(43)

function renderForm() {
  return render(
    <IntakeFormContent
      token={TOKEN}
      form={FORM}
      serviceName="Rapid Repatterning Session"
      firstName="Johan"
      introduction="About Rapid Repatterning."
      supportEmail="support@ravenallinstitute.com"
    />,
  )
}

class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

beforeEach(() => {
  // framer-motion's whileInView needs an IntersectionObserver; jsdom has none.
  vi.stubGlobal('IntersectionObserver', NoopObserver)
  Element.prototype.scrollIntoView = vi.fn()
  window.scrollTo = vi.fn() as never
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('IntakeFormContent', () => {
  it('shows the service, the title, both introductions and the questions', () => {
    renderForm()
    expect(screen.getByText('Rapid Repatterning Session')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Client intake form' })).toBeInTheDocument()
    expect(screen.getByText('About Rapid Repatterning.')).toBeInTheDocument()
    expect(screen.getByText('Please fill in the form.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Personal details' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Full name/)).toBeInTheDocument()
  })

  it('shows every problem and sends nothing when required answers are missing', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: 'Send my intake form' }))
    expect(screen.getAllByText('This question is required.')).toHaveLength(2)
    expect(screen.getByText('Please tick to confirm you have read this.')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('3 answers need your attention')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('sends the answers and shows the thank-you state', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ status: 'completed' }), { status: 200 }))
    renderForm()
    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Johan QA Test' } })
    fireEvent.click(screen.getByLabelText('Sad'))
    fireEvent.click(screen.getByLabelText('8'))
    fireEvent.click(screen.getByLabelText('I acknowledge the terms.'))
    fireEvent.click(screen.getByRole('button', { name: 'Send my intake form' }))

    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Thank you, your form is in' })).toBeInTheDocument())
    const body = JSON.parse(fetchSpy.mock.calls[0]![1]?.body as string)
    expect(body).toEqual({
      token: TOKEN,
      acknowledged: true,
      answers: { name: { value: 'Johan QA Test', detail: '' }, feel: { value: ['Sad'], detail: '' }, ready: { value: '8', detail: '' } },
    })
  })

  it('keeps the answers and says so when the send fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ status: 'unavailable' }), { status: 503 }))
    renderForm()
    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Johan' } })
    fireEvent.click(screen.getByLabelText('5'))
    fireEvent.click(screen.getByLabelText('I acknowledge the terms.'))
    fireEvent.click(screen.getByRole('button', { name: 'Send my intake form' }))
    await waitFor(() => expect(screen.getByText(/nothing you typed is lost/)).toBeInTheDocument())
    expect(screen.getByLabelText(/Full name/)).toHaveValue('Johan')
  })
})
