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
  in_person: false,
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
        rapidRepatterning: true,
        online: true,
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
      createElement(IntakeRequest, { firstName: null, serviceName: 'X', formUrl: 'http://h/intake/a', reminder: 2, supportEmail: 's@x.com', rapidRepatterning: false, online: false }),
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

  it('names who, which order, form and when, and leaves every answer out (POPIA)', async () => {
    const html = await render(
      createElement(IntakeCompleted, {
        clientName: 'Johan QA Test',
        clientEmail: RECORD.customer_email,
        orderNumber: '#512',
        serviceName: RECORD.service_name,
        formTitle: 'Client intake form',
        completedAt: '21 Oct 2026, 11:30',
        acknowledged: true,
        marketing: 'Opted in: Email, SMS',
        answersUrl: 'http://169.239.180.49/staff/submissions/intake/id1',
      }),
    )
    expect(html).toContain('Johan QA Test')
    expect(html).toContain('href="http://169.239.180.49/staff/submissions/intake/id1"')
    expect(html).toContain('#512')
    expect(html).toContain('Client intake form')
    expect(html).toContain('Opted in: Email, SMS')
    expect(html).toContain('The answers are not in this email')
    for (const leaked of ['Health information', 'Panic', 'Feelings', 'phobias', 'Mental disorders', 'See notes']) {
      expect(html).not.toContain(leaked)
    }
    expect(html).not.toContain('\u2014')
  })

  it('goes to the team address with the client as reply-to, and the text part has no answers either', async () => {
    process.env.CONTACT_NOTIFY_EMAIL = 'johan@aiautomations.co.za'
    await sendIntakeCompletedEmail(
      { ...RECORD, marketing_opt_in: true, marketing_channels: ['whatsapp'], marketing_choice_at: '2026-11-18T08:00:00Z' },
      null,
    )
    const call = vi.mocked(sendEmail).mock.calls[0]![0]
    expect(call.to).toEqual(['johan@aiautomations.co.za'])
    expect(call.replyTo).toBe(RECORD.customer_email)
    expect(call.text).toContain('Client: Johan QA Test')
    expect(call.text).toContain('Order: #512')
    expect(call.text).toContain('Marketing: Opted in: WhatsApp')
    for (const leaked of ['Panic', 'Feelings', 'phobias', 'Mental disorders', 'See notes']) {
      expect(call.text).not.toContain(leaked)
    }
    const html = await render(call.react as Parameters<typeof render>[0])
    expect(html).not.toContain('Panic')
  })

  it('links both parts straight to the staff page for this submission (KI125)', async () => {
    await sendIntakeCompletedEmail(RECORD, null)
    const call = vi.mocked(sendEmail).mock.calls[0]![0]
    expect(call.text).toContain('Read them on the staff page (log in with your staff CMS account):\nhttp://169.239.180.49/staff/submissions/intake/id1')
    const html = await render(call.react as Parameters<typeof render>[0])
    expect(html).toContain('href="http://169.239.180.49/staff/submissions/intake/id1"')
    expect(html).toContain('Read the answers on the staff page')
    expect(call.text).not.toContain(RECORD.token)
    expect(html).not.toContain(RECORD.token)
  })

  it('says no choice was recorded for a row from before the opt-in, and Not opted in for a dated no', async () => {
    await sendIntakeCompletedEmail(RECORD, null)
    expect(vi.mocked(sendEmail).mock.calls[0]![0].text).toContain('Marketing: No choice recorded')
    await sendIntakeCompletedEmail({ ...RECORD, marketing_opt_in: false, marketing_choice_at: '2026-11-18T08:00:00Z' }, null)
    expect(vi.mocked(sendEmail).mock.calls[1]![0].text).toContain('Marketing: Not opted in')
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

describe('Shayna\'s template: Rapid Repatterning steps and Zoom by service and mode', () => {
  const textFor = async (overrides: Partial<IntakeRecord>, reminder = 0) => {
    vi.mocked(sendEmail).mockClear()
    await sendIntakeRequestEmail({ ...RECORD, status: 'pending', ...overrides }, reminder)
    return vi.mocked(sendEmail).mock.calls[0]!
  }

  it('Rapid Repatterning online: her wording, the intro steps with the public course link, and Zoom', async () => {
    const [call] = await textFor({ service_key: 'rapid-repatterning-session', in_person: false })
    expect(call.text).toContain('thank you so much for purchasing and booking your Rapid Repatterning Session')
    expect(call.text).toContain('at least 3 days before your session')
    expect(call.text).toContain('how hard to push!')
    expect(call.text).toContain('https://ravenallinstitute-9629.thinkific.com/courses/Rapid-Repatterning-Session-Introduction')
    expect(call.text).toContain('free22')
    expect(call.text).toContain('https://zoom.us/j/3603768111')
    expect(call.text).not.toContain('/manage/')
    const html = await render(call.react!)
    expect(html).toContain('Steps to access the short programme')
    expect(html).toContain('href="https://zoom.us/j/3603768111"')
  })

  it('Rapid Repatterning in-person: the intro steps, no Zoom', async () => {
    const [call] = await textFor({ service_key: 'rapid-repatterning-session', in_person: true })
    expect(call.text).toContain('free22')
    expect(call.text).not.toContain('zoom.us')
    expect(await render(call.react!)).not.toContain('zoom.us')
  })

  it.each([
    ['resonance-repatterning-session', 'Resonance Repatterning Session'],
    ['rapid-transformation-therapy-session', 'Rapid Transformation Therapy Session'],
    ['transformation-coaching-60-mins', 'Transformation Coaching Session'],
  ])('%s (23 Oct list): intro steps and Zoom', async (service_key, service_name) => {
    const [call] = await textFor({ service_key, service_name })
    expect(call.text).toContain('https://zoom.us/j/3603768111')
    expect(call.text).toContain('free22')
    expect(await render(call.react!)).toContain('Steps to access the short programme')
  })

  it.each(['exploring-the-alpha-mind-45-minutes', 'executive-coaching-30-mins', 'akashic-clearing-session', 'resonance-repatterning-program-1-fundamentals-live-via-zoom'])(
    '%s: Zoom, no intro steps',
    async (service_key) => {
      const [call] = await textFor({ service_key })
      expect(call.text).toContain('https://zoom.us/j/3603768111')
      expect(call.text).not.toContain('free22')
      expect(await render(call.react!)).not.toContain('Steps to access the short programme')
    },
  )

  it('a reminder keeps the same blocks and the 3-day ask', async () => {
    const [call] = await textFor({ service_key: 'rapid-repatterning-session', in_person: false }, 3)
    expect(call.subject).toBe('Reminder: your intake form for Rapid Repatterning Session')
    expect(call.text).toContain('friendly reminder')
    expect(call.text).toContain('at least 3 days before your session')
    expect(call.text).toContain('free22')
    expect(call.text).toContain('zoom.us')
  })

  it('has no em dashes in any variant', async () => {
    for (const overrides of [{ service_key: 'rapid-repatterning-session' }, { in_person: true }]) {
      const [call] = await textFor(overrides)
      expect(call.text).not.toContain('\u2014')
      expect(await render(call.react!)).not.toContain('\u2014')
    }
  })
})
