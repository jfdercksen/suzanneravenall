// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { ALERT_THROTTLE_MS, createStaffAlerter, parseAddress, sendBrevoEmail, type BrevoMail } from './brevo'

const quiet = () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() })

describe('sendBrevoEmail', () => {
  it('posts the Brevo v3 payload with the api-key header', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ messageId: '<m1>' }), { status: 201 }))
    const id = await sendBrevoEmail(
      { from: { name: 'A', email: 'a@x.co' }, to: [{ email: 'b@x.co' }], subject: 'S', html: '<p>h</p>', replyTo: { email: 'r@x.co' } },
      { apiKey: 'K', fetchImpl, dryRun: false },
    )
    expect(id).toBe('<m1>')
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.brevo.com/v3/smtp/email')
    expect(new Headers(init.headers).get('api-key')).toBe('K')
    expect(JSON.parse(String(init.body))).toEqual({
      sender: { name: 'A', email: 'a@x.co' },
      to: [{ email: 'b@x.co' }],
      subject: 'S',
      htmlContent: '<p>h</p>',
      replyTo: { email: 'r@x.co' },
    })
  })

  it('throws on a refused send and without a key', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ code: 'unauthorized', message: 'Key not found' }), { status: 401 }))
    const mail: BrevoMail = { from: { email: 'a@x.co' }, to: [{ email: 'b@x.co' }], subject: 'S', text: 't' }
    await expect(sendBrevoEmail(mail, { apiKey: 'K', fetchImpl, dryRun: false })).rejects.toThrow(/unauthorized: Key not found/)
    await expect(sendBrevoEmail(mail, { apiKey: '', fetchImpl, dryRun: false })).rejects.toThrow(/BREVO_API_KEY/)
  })

  it('dry run: no network, recipient masked in the log', async () => {
    const fetchImpl = vi.fn()
    const logger = quiet()
    await sendBrevoEmail({ from: { email: 'a@x.co' }, to: [{ email: 'buyer@example.com' }], subject: 'S', text: 't' }, { fetchImpl, dryRun: true, logger })
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain('buyer@example.com')
  })

  it('parseAddress reads "Name <address>" like the web sender', () => {
    expect(parseAddress('Dr Suzanne Ravenall <hello@suzanneravenall.com>')).toEqual({ name: 'Dr Suzanne Ravenall', email: 'hello@suzanneravenall.com' })
    expect(parseAddress('x@y.co')).toEqual({ email: 'x@y.co' })
  })
})

describe('createStaffAlerter', () => {
  function setup(env: Record<string, string | undefined> = { AUTOMATION_ALERT_EMAIL: 'johan@example.com' }) {
    let now = Date.parse('2026-10-06T10:00:00Z')
    const send = vi.fn(async (_mail: BrevoMail) => 'id')
    const alerter = createStaffAlerter({ env, now: () => now, send, logger: quiet() })
    return { alerter, send, advance: (ms: number) => (now += ms) }
  }

  it('mails AUTOMATION_ALERT_EMAIL from noreply@ with an [ALERT] subject', async () => {
    const { alerter, send } = setup()
    expect(await alerter.send({ key: 'k', subject: 'Thing broke', lines: ['line 1'] })).toBe('sent')
    expect(send.mock.calls[0]![0]).toMatchObject({
      from: { name: 'Suzanne Ravenall Platform', email: 'noreply@suzanneravenall.com' },
      to: [{ email: 'johan@example.com' }],
      subject: '[ALERT] Thing broke',
    })
  })

  it('throttles per key: one mail per 15 minutes, then reports how many were held back', async () => {
    const { alerter, send, advance } = setup()
    await alerter.send({ key: 'thinkific', subject: 'a', lines: [] })
    expect(await alerter.send({ key: 'thinkific', subject: 'b', lines: [] })).toBe('throttled')
    expect(await alerter.send({ key: 'thinkific', subject: 'c', lines: [] })).toBe('throttled')
    expect(await alerter.send({ key: 'vtiger', subject: 'other key', lines: [] })).toBe('sent')
    advance(ALERT_THROTTLE_MS)
    expect(await alerter.send({ key: 'thinkific', subject: 'd', lines: [] })).toBe('sent')
    expect(send).toHaveBeenCalledTimes(3)
    expect(send.mock.calls[2]![0].text).toContain('2 more alert(s) of this kind were held back')
  })

  it('no recipient: log only', async () => {
    const { alerter, send } = setup({})
    expect(await alerter.send({ key: 'k', subject: 's', lines: [] })).toBe('no-recipient')
    expect(send).not.toHaveBeenCalled()
  })

  it('dry run: log only', async () => {
    const { alerter, send } = setup({ AUTOMATION_ALERT_EMAIL: 'j@example.com', AUTOMATION_DRY_RUN: 'true' })
    expect(await alerter.send({ key: 'k', subject: 's', lines: [] })).toBe('dry-run')
    expect(send).not.toHaveBeenCalled()
  })

  it('never throws when the mail fails', async () => {
    const send = vi.fn(async () => {
      throw new Error('Brevo down')
    })
    const alerter = createStaffAlerter({ env: { AUTOMATION_ALERT_EMAIL: 'j@example.com' }, send, logger: quiet() })
    await expect(alerter.send({ key: 'k', subject: 's', lines: [] })).resolves.toBe('failed')
  })
})
