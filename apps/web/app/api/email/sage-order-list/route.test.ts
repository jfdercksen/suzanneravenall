import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))
vi.mock('@/lib/email/send', () => ({ sendEmail: mockSend }))
vi.mock('@/lib/log', () => ({ logError: vi.fn() }))

import { POST } from './route'
import { buildSageCsv, csvCell } from '@/lib/email/sage-order-list'

function req(body: unknown, secret: string | null = 'secret') {
  return new Request('http://localhost/api/email/sage-order-list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(secret ? { 'x-webhook-secret': secret } : {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }) as never
}

const order = {
  reference: 'SR-00042',
  createdAt: '2026-11-23T12:03:00.000Z',
  createdAtLabel: '2026-11-23 14:03',
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  company: 'Acme, "Pty" Ltd',
  vatNumber: null,
  registrationNumber: null,
  billingAddress: '1 Main Rd, Cape Town',
  items: [
    { productTitle: 'Rapid Repatterning', variantTitle: 'Online', quantity: 2, unitAmount: 750, lineTotal: 1500, sageItemCode: 'RRP-01' },
    { productTitle: 'Mystery', variantTitle: null, quantity: 1, unitAmount: 99.5, lineTotal: 99.5, sageItemCode: null },
  ],
  currency: 'ZAR',
  discountTotal: 0,
  voucherCodes: [],
  total: 1599.5,
  paymentMethod: 'PayFast',
  paymentReference: 'PF123',
}

const valid = {
  to: ['carla@example.com'],
  cc: [],
  windowLabel: 'Mon 23 Nov 2026',
  fromDate: '2026-11-23',
  toDate: '2026-11-23',
  orders: [order],
  refunds: [],
}

type Sent = {
  to: string[]
  subject: string
  html?: string
  text?: string
  react?: unknown
  attachments?: { filename: string; content: Buffer }[]
}

describe('POST /api/email/sage-order-list', () => {
  beforeEach(() => {
    mockSend.mockReset()
    vi.stubEnv('N8N_WEBHOOK_SECRET', 'secret')
    vi.stubEnv('INTERNAL_WEBHOOK_SECRET', '')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('401 without or with a wrong secret, nothing sent', async () => {
    expect((await POST(req(valid, null))).status).toBe(401)
    expect((await POST(req(valid, 'nope'))).status).toBe(401)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('500 when no secret is configured', async () => {
    vi.stubEnv('N8N_WEBHOOK_SECRET', '')
    expect((await POST(req(valid))).status).toBe(500)
  })

  it('400 on invalid JSON or a bad body', async () => {
    expect((await POST(req('{not json'))).status).toBe(400)
    expect((await POST(req({ ...valid, to: ['nope'] }))).status).toBe(400)
    expect((await POST(req({ ...valid, orders: 'x' }))).status).toBe(400)
    expect((await POST(req({ ...valid, fromDate: 'yesterday' }))).status).toBe(400)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('sends one mail with subject, text, template and the CSV attachment', async () => {
    mockSend.mockResolvedValue('msg_1')
    const res = await POST(req({ ...valid, cc: ['boss@example.com'] }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ emailId: 'msg_1' })
    expect(mockSend).toHaveBeenCalledTimes(1)
    const sent = mockSend.mock.calls[0]![0] as Sent & { cc?: string[] }
    expect(sent.to).toEqual(['carla@example.com'])
    expect(sent.cc).toEqual(['boss@example.com'])
    expect(sent.subject).toBe('Orders for Sage: Mon 23 Nov 2026, 1 order')
    expect(sent.react).toBeTruthy()
    expect(sent.text).toContain('Type the SR number in the Sage invoice reference field')
    expect(sent.text).toContain('SR-00042')
    expect(sent.text).toContain('[RRP-01]')
    expect(sent.text).toContain('[no code, check]')
    expect(sent.text).toContain('This list holds customer details: keep it within the team.')
    expect(sent.attachments).toHaveLength(1)
    expect(sent.attachments![0]!.filename).toBe('sage-orders-2026-11-23.csv')
    const csv = sent.attachments![0]!.content.toString('utf-8')
    expect(csv.split('\r\n')[0]).toBe(
      'reference,date,customer_name,customer_email,company,item_code,item,variant,quantity,unit_amount,line_total,currency,discount,order_total,payment_method,payment_reference',
    )
    expect(csv).toContain('SR-00042,2026-11-23 14:03,Jane Doe,jane@example.com,"Acme, ""Pty"" Ltd",RRP-01,Rapid Repatterning,Online,2,750.00,1500.00,ZAR,0.00,1599.50,PayFast,PF123')
    expect(csv).toContain(',,Mystery,,1,99.50,99.50,')
  })

  it('pluralises the subject', async () => {
    mockSend.mockResolvedValue('m')
    await POST(req({ ...valid, orders: [order, { ...order, reference: 'SR-00043' }] }))
    expect((mockSend.mock.calls[0]![0] as Sent).subject).toBe('Orders for Sage: Mon 23 Nov 2026, 2 orders')
  })

  it('an empty day sends a short mail without attachment', async () => {
    mockSend.mockResolvedValue('msg_2')
    const res = await POST(req({ ...valid, orders: [] }))
    expect(res.status).toBe(200)
    const sent = mockSend.mock.calls[0]![0] as Sent
    expect(sent.subject).toBe('Orders for Sage: Mon 23 Nov 2026, 0 orders')
    expect(sent.text).toContain('No orders on Mon 23 Nov 2026.')
    expect(sent.text).not.toContain('Type the SR number')
    expect(sent.attachments).toBeUndefined()
  })

  it('lists refunds in the text', async () => {
    mockSend.mockResolvedValue('m')
    await POST(
      req({
        ...valid,
        orders: [],
        refunds: [{ reference: 'SR-00007', refundedAt: '2026-11-23T09:00:00.000Z', refundedAtLabel: '2026-11-23 11:00', amount: 500, currency: 'ZAR', note: 'Customer request' }],
      }),
    )
    const sent = mockSend.mock.calls[0]![0] as Sent
    expect(sent.text).toContain('REFUNDS')
    expect(sent.text).toContain('SR-00007  2026-11-23 11:00  ZAR 500.00  Customer request')
  })

  it('500 when the mail provider refuses', async () => {
    mockSend.mockRejectedValue(new Error('Brevo error'))
    expect((await POST(req(valid))).status).toBe(500)
  })
})

describe('CSV', () => {
  it('quotes commas, quotes and newlines (RFC 4180)', () => {
    expect(csvCell('plain')).toBe('plain')
    expect(csvCell('a,b')).toBe('"a,b"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"')
  })

  it('defuses formula cells', () => {
    expect(csvCell('=SUM(A1)')).toBe("'=SUM(A1)")
    expect(csvCell('+1')).toBe("'+1")
    expect(csvCell('-2')).toBe("'-2")
    expect(csvCell('@cmd')).toBe("'@cmd")
    expect(csvCell('=1,2')).toBe(`"'=1,2"`)
  })

  it('guards a malicious customer name inside the file, amounts stay plain', () => {
    const csv = buildSageCsv({ orders: [{ ...order, customerName: '=HYPERLINK("x")' }] as never })
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`)
    expect(csv).toContain(',2,750.00,1500.00,')
  })
})
