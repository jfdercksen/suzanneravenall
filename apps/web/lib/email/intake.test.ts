import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('./send', () => ({ sendEmail: vi.fn().mockResolvedValue('msg-1') }))

import { render } from '@react-email/components'
import { createElement } from 'react'
import { sendEmail } from './send'
import IntakeRequest from './templates/IntakeRequest'
import IntakeCompleted from './templates/IntakeCompleted'
import {
  INTAKE_SUPPORT_EMAIL,
  intakeCompletedSubject,
  intakeRequestSubject,
  intakeTeamAddress,
  sendIntakeCompletedEmail,
  sendIntakeRequestEmail,
} from './intake'
import type { IntakeRecord } from '../intake/types'

const RECORD: IntakeRecord = {
  id: 'id1',
  token: 'T'.repeat(43),
  order_id: 'order_01',
  order_display_id: '512',
  customer_email: 'johan@aiautomations.co.za',
  first_name: 'Johan',
  last_name: 'QA Test',
  service_key: 'rapid-repatterning-session',
  service_name: 'Rapid Repatterning Session',
  form_id: '1',
  form_key: 'standard',
  purchased_at: '2026-10-21T08:00:00Z',
  status: 'completed',
  intake_sent_at: '2026-10-21T08:00:00Z',
  reminders_sent: 1,
  next_reminder_at: null,
  last_reminder_at: null,
  expires_at: '2026-12-20T08:00:00Z',
  answers: {
    acknowledged: true,
    items: [
      { fieldId: 'a', type: 'text', label: 'Full name', value: 'Johan QA Test', section: 'Personal details' },
      { fieldId: 'b', type: 'checkbox-group', label: 'Feelings', value: ['Panic', 'Sad'], section: 'Health information' },
      { fieldId: 'c', type: 'scale', label: 'How ready are you to change?', value: '9', section: 'Health information' },
      { fieldId: 'd', type: 'textarea', label: 'Fears or phobias', value: '', section: 'Health information' },
      { fieldId: 'e', type: 'select', label: 'Mental disorders?', value: 'Other', detail: 'See notes <b>x</b>' },
    ],
  },
  completed_at: '2026-10-21T09:30:00Z',
  cancelled_at: null,
  team_notified_at: null,
  send_failures: 0,
  created_at: '2026-10-21T08:00:00Z',
}

const env = { ...process.env }

beforeEach(() => {
  vi.mocked(sendEmail).mockClear()
  process.env.NEXT_PUBLIC_SITE_URL = 'http://169.239.180.49'
  delete process.env.INTAKE_NOTIFY_EMAIL
  delete process.env.CONTACT_NOTIFY_EMAIL
})
afterEach(() => {
  process.env = { ...env }
})

describe('intake request mail', () => {
  it('renders the personal link, the service and who to contact, with no em dashes', async () => {
    const html = await render(
      createElement(IntakeRequest, {
        firstName: 'Johan',
        serviceName: 'Rapid Repatterning Session',
        formUrl: 'http://169.239.180.49/intake/abc',
        reminder: 0,
        supportEmail: INTAKE_SUPPORT_EMAIL,
      }),
    )
    expect(html).toContain('href="http://169.239.180.49/intake/abc"')
    expect(html).toContain('Rapid Repatterning Session')
    expect(html).toContain(INTAKE_SUPPORT_EMAIL)
    expect(html).toContain('Hi Johan,')
    expect(html).not.toContain('—')
    expect(html).not.toContain('href="#"')
  })

  it('words a reminder as a reminder', async () => {
    const html = await render(
      createElement(IntakeRequest, { firstName: null, serviceName: 'X', formUrl: 'http://h/intake/a', reminder: 2, supportEmail: 's@x.com' }),
    )
    expect(html).toContain('still open')
    expect(html).toContain('Hi there,')
    expect(intakeRequestSubject('X', 2)).toBe('Reminder: your intake form for X')
    expect(intakeRequestSubject('X', 0)).toBe('Please complete your intake form for X')
  })

  it('sends to the buyer with the link built from the site URL', async () => {
    await sendIntakeRequestEmail(RECORD, 0)
    const call = vi.mocked(sendEmail).mock.calls[0]![0]
    expect(call.to).toEqual(['johan@aiautomations.co.za'])
    expect(call.replyTo).toBe(INTAKE_SUPPORT_EMAIL)
    expect(call.text).toContain(`http://169.239.180.49/intake/${RECORD.token}`)
  })
})

describe('completed form mail to the team', () => {
  it('puts the client name and order number in the subject', () => {
    expect(intakeCompletedSubject(RECORD)).toBe('Intake form: Johan QA Test, order #512 (Rapid Repatterning Session)')
  })

  it('renders every answer under its section, skipped ones as Not answered, escaped', async () => {
    const html = await render(
      createElement(IntakeCompleted, {
        clientName: 'Johan QA Test',
        clientEmail: RECORD.customer_email,
        orderNumber: '#512',
        serviceName: RECORD.service_name,
        formTitle: 'Client intake form',
        completedAt: '21 Oct 2026, 11:30',
        acknowledged: true,
        items: RECORD.answers?.items ?? [],
      }),
    )
    expect(html).toContain('Personal details')
    expect(html).toContain('Health information')
    expect(html).toContain('Panic, Sad')
    expect(html).toContain('9 / 10')
    expect(html).toContain('Not answered')
    expect(html).toContain('See notes &lt;b&gt;x&lt;/b&gt;')
    expect(html).not.toContain('<b>x</b>')
    expect(html).not.toContain('—')
  })

  it('goes to the team address with the client as reply-to', async () => {
    process.env.CONTACT_NOTIFY_EMAIL = 'johan@aiautomations.co.za'
    await sendIntakeCompletedEmail(RECORD, null)
    const call = vi.mocked(sendEmail).mock.calls[0]![0]
    expect(call.to).toEqual(['johan@aiautomations.co.za'])
    expect(call.replyTo).toBe(RECORD.customer_email)
    expect(call.text).toContain('Feelings: Panic, Sad')
    expect(call.text).toContain('Fears or phobias: Not answered')
  })

  it('picks the team address: form override, then INTAKE_NOTIFY_EMAIL, then CONTACT_NOTIFY_EMAIL, then support', () => {
    expect(intakeTeamAddress(null)).toBe(INTAKE_SUPPORT_EMAIL)
    process.env.CONTACT_NOTIFY_EMAIL = 'contact@x.com'
    expect(intakeTeamAddress(null)).toBe('contact@x.com')
    process.env.INTAKE_NOTIFY_EMAIL = 'intake@x.com'
    expect(intakeTeamAddress({ recipientEmail: null })).toBe('intake@x.com')
    expect(intakeTeamAddress({ recipientEmail: 'form@x.com' })).toBe('form@x.com')
  })
})
