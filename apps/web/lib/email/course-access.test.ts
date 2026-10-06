// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))
vi.mock('./send', async (importOriginal) => {
  const real = await importOriginal<typeof import('./send')>()
  return { ...real, sendEmail: mockSend }
})

import { courseAccessSubject, sendCourseAccessEmail } from './course-access'
import CourseAccess, { THINKIFIC_COURSES_URL } from './templates/CourseAccess'
import { defaultFromAddress, parseAddress } from './send'

// ---------------------------------------------------------------------------
// The n8n mail this replaces: run the workflow's own "Prepare: Confirmation
// Email" Code node and compare.
// ---------------------------------------------------------------------------

const workflow = JSON.parse(
  readFileSync(resolve(__dirname, '../../../../infra/n8n/workflows/medusa-thinkific-enrollment.json'), 'utf8'),
) as { nodes: Array<{ name: string; parameters: { jsCode?: string } }> }

function n8nMail(ctx: { email: string; firstName: string; enrollmentSuccessTitles: string[] }) {
  const code = workflow.nodes.find((n) => n.name === 'Prepare: Confirmation Email')!.parameters.jsCode!
  const $input = { first: () => ({ json: ctx }) }
  const out = (new Function('$input', code) as (i: unknown) => Array<{ json: { emailPayload: string } }>)($input)
  return JSON.parse(out[0]!.json.emailPayload) as {
    sender: { name: string; email: string }
    to: Array<{ email: string }>
    replyTo: { email: string }
    subject: string
    htmlContent: string
  }
}

/** Visible text of an HTML mail, whitespace collapsed. */
function text(html: string): string {
  return html
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const data = { email: 'qa.buyer@example.com', firstName: 'QA', courses: ['Program 1 Self Study', 'Program <2> & more'] }

describe('course-access mail: parity with the n8n workflow', () => {
  const n8n = n8nMail({ email: data.email, firstName: data.firstName, enrollmentSuccessTitles: data.courses })

  it('same subject', () => {
    expect(courseAccessSubject(data.courses)).toBe(n8n.subject)
  })

  it('every sentence of the n8n mail is in ours, with the same Thinkific link', () => {
    const ours = text(renderToStaticMarkup(createElement(CourseAccess, { firstName: data.firstName, courses: data.courses })))
    const sentences = n8n.htmlContent
      .split(/<\/?(?:h2|p|ul|li|br)>/)
      .map((s) => text(s))
      .filter((s) => s.length > 0)
    expect(sentences.length).toBeGreaterThan(6)
    for (const s of sentences) expect(ours).toContain(s)
    expect(n8n.htmlContent).toContain(THINKIFIC_COURSES_URL)
    expect(renderToStaticMarkup(createElement(CourseAccess, { firstName: 'x', courses: ['y'] }))).toContain(`href="${THINKIFIC_COURSES_URL}"`)
  })

  it('same sender (site default), recipient and reply-to', async () => {
    mockSend.mockResolvedValue('msg_1')
    await sendCourseAccessEmail(data)
    const input = mockSend.mock.calls[0]![0]
    expect(input.to).toEqual([n8n.to[0]!.email])
    expect(parseAddress(input.replyTo)).toEqual(n8n.replyTo)
    // No explicit sender: the site default applies, which (EMAIL_FROM_ADDRESS
    // unset) is the n8n mail's sender.
    expect(input.from).toBeUndefined()
    const saved = process.env.EMAIL_FROM_ADDRESS
    delete process.env.EMAIL_FROM_ADDRESS
    try {
      expect(parseAddress(defaultFromAddress())).toEqual(n8n.sender)
    } finally {
      if (saved !== undefined) process.env.EMAIL_FROM_ADDRESS = saved
    }
  })
})

describe('sendCourseAccessEmail', () => {
  beforeEach(() => {
    mockSend.mockReset()
  })

  it('sends the React template plus a plain-text part, and returns the message id', async () => {
    mockSend.mockResolvedValue('msg_2')
    expect(await sendCourseAccessEmail(data)).toBe('msg_2')
    const input = mockSend.mock.calls[0]![0]
    expect(input.react).toBeTruthy()
    expect(input.text).toContain('- Program 1 Self Study')
    expect(input.text).toContain(THINKIFIC_COURSES_URL)
    expect(input.headers).toBeUndefined() // transactional: no unsubscribe header
  })

  it('escapes course titles in the HTML', () => {
    const html = renderToStaticMarkup(createElement(CourseAccess, { firstName: 'QA', courses: ['A <b>bold</b> title'] }))
    expect(html).not.toContain('<b>bold</b>')
  })

  it('uses no em dash in the copy', () => {
    const html = renderToStaticMarkup(createElement(CourseAccess, { firstName: 'QA', courses: ['X'] }))
    expect(html).not.toContain(String.fromCharCode(0x2014))
  })
})
