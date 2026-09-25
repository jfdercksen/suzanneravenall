import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement } from 'react'

vi.mock('@react-email/components', () => ({
  render: vi.fn(async () => '<p>rendered</p>'),
}))

import { render } from '@react-email/components'
import { sendEmail, parseAddress, isEmailConfigured, defaultFromAddress } from './send'

const fetchMock = vi.fn()

function okResponse(body: unknown, status = 201) {
  return { ok: status < 400, status, json: async () => body }
}

describe('parseAddress', () => {
  it('splits a display name from the address', () => {
    expect(parseAddress('Dr Suzanne Ravenall <hello@suzanneravenall.com>')).toEqual({
      name: 'Dr Suzanne Ravenall',
      email: 'hello@suzanneravenall.com',
    })
  })

  it('returns a bare address without a name', () => {
    expect(parseAddress(' noreply@suzanneravenall.com ')).toEqual({
      email: 'noreply@suzanneravenall.com',
    })
  })

  it('strips quotes around the display name', () => {
    expect(parseAddress('"Suzanne" <s@x.com>')).toEqual({ name: 'Suzanne', email: 's@x.com' })
  })
})

describe('configuration helpers', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('isEmailConfigured follows BREVO_API_KEY', () => {
    vi.stubEnv('BREVO_API_KEY', '')
    expect(isEmailConfigured()).toBe(false)
    vi.stubEnv('BREVO_API_KEY', 'xkeysib-test')
    expect(isEmailConfigured()).toBe(true)
  })

  it('defaultFromAddress prefers EMAIL_FROM_ADDRESS', () => {
    vi.stubEnv('EMAIL_FROM_ADDRESS', 'Team <team@x.com>')
    expect(defaultFromAddress()).toBe('Team <team@x.com>')
  })
})

describe('sendEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('BREVO_API_KEY', 'xkeysib-test')
    vi.stubEnv('EMAIL_FROM_ADDRESS', 'Dr Suzanne Ravenall <hello@suzanneravenall.com>')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('posts a Brevo payload and returns the message id', async () => {
    fetchMock.mockResolvedValue(okResponse({ messageId: '<abc@smtp-relay.mailin.fr>' }))

    const id = await sendEmail({
      to: ['alice@example.com'],
      replyTo: 'sravenall@suzanneravenall.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
      headers: { 'List-Unsubscribe': '<https://x/u>' },
    })

    expect(id).toBe('<abc@smtp-relay.mailin.fr>')
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.brevo.com/v3/smtp/email')
    expect((init.headers as Record<string, string>)['api-key']).toBe('xkeysib-test')
    expect(JSON.parse(init.body as string)).toEqual({
      sender: { name: 'Dr Suzanne Ravenall', email: 'hello@suzanneravenall.com' },
      to: [{ email: 'alice@example.com' }],
      replyTo: { email: 'sravenall@suzanneravenall.com' },
      subject: 'Hello',
      htmlContent: '<p>Hi</p>',
      textContent: 'Hi',
      headers: { 'List-Unsubscribe': '<https://x/u>' },
    })
  })

  it('splits a display name in a recipient too', async () => {
    fetchMock.mockResolvedValue(okResponse({ messageId: 'id-3' }))

    await sendEmail({ to: ['Alice <alice@example.com>'], subject: 'S', html: 'x' })

    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string)
    expect(body.to).toEqual([{ name: 'Alice', email: 'alice@example.com' }])
  })

  it('renders a React template to htmlContent', async () => {
    fetchMock.mockResolvedValue(okResponse({ messageId: 'id-2' }))
    const element = createElement('p', null, 'x')

    await sendEmail({ to: ['a@b.c'], subject: 'S', react: element })

    expect(render).toHaveBeenCalledWith(element)
    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string)
    expect(body.htmlContent).toBe('<p>rendered</p>')
    expect(body.replyTo).toBeUndefined()
    expect(body.headers).toBeUndefined()
  })

  it('throws before calling the network when the key is missing', async () => {
    vi.stubEnv('BREVO_API_KEY', '')

    await expect(sendEmail({ to: ['a@b.c'], subject: 'S', html: 'x' })).rejects.toThrow(
      'BREVO_API_KEY is not configured'
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('throws when there is nothing to send', async () => {
    await expect(sendEmail({ to: ['a@b.c'], subject: 'S' })).rejects.toThrow(
      'Email needs html, react or text content'
    )
  })

  it('surfaces the Brevo error message on a non-2xx response', async () => {
    fetchMock.mockResolvedValue(okResponse({ code: 'unauthorized', message: 'Key not found' }, 401))

    await expect(sendEmail({ to: ['a@b.c'], subject: 'S', html: 'x' })).rejects.toThrow(
      'Brevo error: unauthorized: Key not found'
    )
  })

  it('falls back to the HTTP status when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('bad json')
      },
    })

    await expect(sendEmail({ to: ['a@b.c'], subject: 'S', html: 'x' })).rejects.toThrow(
      'Brevo error: HTTP 502'
    )
  })

  it('throws when the response carries no message id', async () => {
    fetchMock.mockResolvedValue(okResponse({}))

    await expect(sendEmail({ to: ['a@b.c'], subject: 'S', html: 'x' })).rejects.toThrow(
      'Brevo returned no message id'
    )
  })

  it('propagates a network failure', async () => {
    fetchMock.mockRejectedValue(new Error('network failure'))

    await expect(sendEmail({ to: ['a@b.c'], subject: 'S', html: 'x' })).rejects.toThrow(
      'network failure'
    )
  })
})
