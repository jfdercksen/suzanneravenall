import { beforeEach, describe, expect, it, vi } from 'vitest'

const coreRun = vi.fn()
const keepRun = vi.fn()
const alertSend = vi.fn()

vi.mock('@medusajs/framework/utils', () => ({
  ContainerRegistrationKeys: { QUERY: 'query' },
  Modules: { ORDER: 'order' },
  MedusaError: class extends Error {
    static Types = { NOT_ALLOWED: 'not_allowed' }
    type: string
    constructor(type: string, message: string) {
      super(message)
      this.type = type
    }
  },
}))
vi.mock('@medusajs/core-flows', () => ({ cancelOrderWorkflow: () => ({ run: coreRun }) }))
vi.mock('../keep-payfast-capture-workflow', () => ({
  cancelOrderKeepPayfastCaptureWorkflow: () => ({ run: keepRun }),
}))
vi.mock('../../../../../../automations/runtime', () => ({ staffAlerter: () => ({ send: alertSend }) }))

import { POST } from '../route'

type Order = Record<string, unknown>

function setup(order: Order | undefined, opts: { updateFails?: boolean } = {}) {
  const graph = vi
    .fn()
    .mockResolvedValueOnce({ data: order ? [order] : [] })
    .mockImplementation(async ({ fields }: { fields: string[] }) =>
      fields.includes('metadata') && fields.length === 2
        ? { data: [{ id: 'order_1', metadata: { ...(order?.metadata as object), sage_document_number: 'SI-1' } }] }
        : { data: [{ id: 'order_1', status: 'canceled' }] }
    )
  const updateOrders = opts.updateFails ? vi.fn().mockRejectedValue(new Error('db down')) : vi.fn().mockResolvedValue({})
  const req = {
    params: { id: 'order_1' },
    auth_context: { actor_id: 'user_1' },
    queryConfig: { fields: ['id', 'status'] },
    scope: { resolve: (key: string) => (key === 'query' ? { graph } : { updateOrders }) },
  }
  const json = vi.fn()
  const res = { status: vi.fn(() => ({ json })) }
  return { req, res, json, updateOrders }
}

const payfastCaptured: Order = {
  id: 'order_1',
  display_id: 397,
  currency_code: 'zar',
  metadata: { invoice_url: 'https://x/inv.pdf' },
  payment_collections: [{ payments: [{ id: 'pay_1', provider_id: 'pp_payfast_payfast', captures: [{ amount: 16500 }], refunds: [] }] }],
}

describe('POST /admin/orders/:id/cancel', () => {
  beforeEach(() => {
    coreRun.mockReset().mockResolvedValue({})
    keepRun.mockReset().mockResolvedValue({})
    alertSend.mockReset().mockResolvedValue('sent')
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('cancels a captured PayFast order without the refunding core workflow, keeping metadata written meanwhile', async () => {
    const { req, res, json, updateOrders } = setup(payfastCaptured)
    await POST(req as never, res as never)
    expect(coreRun).not.toHaveBeenCalled()
    expect(keepRun).toHaveBeenCalledWith({ input: { order_id: 'order_1', uncaptured_payment_ids: [] } })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ order: { id: 'order_1', status: 'canceled' } })
    const [, update] = updateOrders.mock.calls[0]
    expect(update.metadata).toMatchObject({
      invoice_url: 'https://x/inv.pdf',
      sage_document_number: 'SI-1',
      payfast_refund_required: true,
      payfast_refund_amount: 165, // rand, from 16500 cents
    })
  })

  it('alerts staff to refund in the PayFast portal, with no personal data', async () => {
    const { req, res } = setup(payfastCaptured)
    await POST(req as never, res as never)
    const alert = alertSend.mock.calls[0][0]
    expect(alert.key).toBe('payfast-refund-order_1')
    expect(alert.subject).toBe('Refund order #397 in PayFast (ZAR 165.00)')
    expect(alert.lines.join(' ')).toContain('PayFast merchant portal')
    expect(alert.lines.join(' ')).not.toMatch(/@/)
  })

  it('still answers 200 and alerts when the metadata flag cannot be saved', async () => {
    const { req, res } = setup(payfastCaptured, { updateFails: true })
    await POST(req as never, res as never)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(alertSend).toHaveBeenCalledTimes(1)
    expect(alertSend.mock.calls[0][0].lines.join(' ')).toContain('could not be saved')
  })

  it('uses the core workflow for a PayPal order', async () => {
    const { req, res } = setup({
      id: 'order_1',
      payment_collections: [{ payments: [{ id: 'p', provider_id: 'pp_paypal_paypal', captures: [{ amount: 9 }] }] }],
    })
    await POST(req as never, res as never)
    expect(coreRun).toHaveBeenCalledWith({ input: { order_id: 'order_1', canceled_by: 'user_1' } })
    expect(keepRun).not.toHaveBeenCalled()
    expect(alertSend).not.toHaveBeenCalled()
  })

  it('hands an unknown order to the core workflow so it answers 404 as before', async () => {
    const { req, res } = setup(undefined)
    coreRun.mockRejectedValue(new Error('Order id not found'))
    await expect(POST(req as never, res as never)).rejects.toThrow('not found')
    expect(keepRun).not.toHaveBeenCalled()
  })

  it('refuses a mixed PayFast and PayPal capture', async () => {
    const { req, res } = setup({
      id: 'order_1',
      payment_collections: [
        {
          payments: [
            { id: 'a', provider_id: 'pp_payfast_payfast', captures: [{ amount: 9 }] },
            { id: 'b', provider_id: 'pp_paypal_paypal', captures: [{ amount: 9 }] },
          ],
        },
      ],
    })
    await expect(POST(req as never, res as never)).rejects.toMatchObject({ type: 'not_allowed' })
    expect(coreRun).not.toHaveBeenCalled()
    expect(keepRun).not.toHaveBeenCalled()
  })

  it('does not alert when the cancel itself fails', async () => {
    const { req, res } = setup(payfastCaptured)
    keepRun.mockRejectedValue(new Error('Cannot cancel a completed order'))
    await expect(POST(req as never, res as never)).rejects.toThrow()
    expect(alertSend).not.toHaveBeenCalled()
  })
})
