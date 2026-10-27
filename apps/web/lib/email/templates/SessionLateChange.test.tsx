import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))
vi.mock('../send', () => ({ sendEmail: mockSend }))

import SessionLateChange from './SessionLateChange'
import { buildPlainText, sendSessionLateChangeEmail, sessionLateChangeSubject } from '../session-late-change'
import type { SessionLateChangeEmailData } from '../types'

const LATE: SessionLateChangeEmailData = {
  email: 'johan+rules1026@aiautomations.co.za',
  firstName: 'Johan',
  kind: 'cancelled',
  dateLabel: 'Wed, 28 October 2026',
  timeLabel: '10:00 - 11:00 SAST',
  appointmentsUrl: 'http://169.239.180.49/portal/appointments',
}

describe('SessionLateChange mail (D024)', () => {
  beforeEach(() => mockSend.mockReset().mockResolvedValue('msg_1'))

  it('tells the client the cancel was late and the session counts as used', () => {
    const html = renderToStaticMarkup(createElement(SessionLateChange, LATE))
    expect(html).toContain('You cancelled this session less than 48 working hours before it was due to start')
    expect(html).toContain('counts as used')
    expect(html).toContain('Monday to Friday, 08:00 to 17:00 South African time')
    expect(html).toContain('If something exceptional happened')
    expect(html).not.toContain('new booking')
  })

  it('names the new time of a late move', () => {
    const moved = { ...LATE, kind: 'rescheduled' as const, newDateLabel: 'Wed, 04 November 2026', newTimeLabel: '10:00 - 11:00 SAST' }
    const html = renderToStaticMarkup(createElement(SessionLateChange, moved))
    expect(html).toContain('You moved this session')
    expect(html).toContain('Your new booking on Wed, 04 November 2026, 10:00 - 11:00 SAST uses another session')
    expect(buildPlainText(moved)).toContain('Your new booking on Wed, 04 November 2026')
  })

  it('sends to the client with a reply-to and a plain-text part', async () => {
    await sendSessionLateChangeEmail(LATE)
    const mail = mockSend.mock.calls[0]![0] as { to: string[]; subject: string; text: string; replyTo: string }
    expect(mail.to).toEqual(['johan+rules1026@aiautomations.co.za'])
    expect(mail.subject).toBe(sessionLateChangeSubject(LATE.dateLabel))
    expect(mail.subject).toBe('Your session on Wed, 28 October 2026: less than 48 working hours notice')
    expect(mail.replyTo).toBeTruthy()
    expect(mail.text).toContain('The session: Wed, 28 October 2026, 10:00 - 11:00 SAST')
  })

  it('uses no long dashes in client wording', () => {
    const text = buildPlainText({ ...LATE, kind: 'rescheduled', newDateLabel: 'x' })
    expect(text).not.toMatch(/—/)
  })
})
