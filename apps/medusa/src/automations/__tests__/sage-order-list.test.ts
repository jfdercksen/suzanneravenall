import { describe, it, expect, vi } from "vitest"
import type { StaffAlert } from "@suzanne/integrations"
import {
  findRefunds,
  money,
  parseRecipients,
  runSageOrderList,
  sageOrderListMode,
  sendSageOrderListViaWeb,
  windowFor,
  type SageOrderListDeps,
  type SageOrderListPayload,
  type SageRefundRow,
} from "../sage-order-list"

const quiet = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
// Tue 24 Nov 2026 07:00 SAST
const NOW = new Date("2026-11-24T05:00:00Z")

const baseEnv = {
  AUTOMATION_SAGE_ORDER_LIST: "code",
  SAGE_ORDER_LIST_EMAIL: "carla@example.com",
}

function order(over: Record<string, unknown> = {}) {
  return {
    id: "order_1",
    display_id: 42,
    status: "pending",
    created_at: "2026-11-23T12:03:00Z",
    currency_code: "zar",
    email: "buyer@example.com",
    total: { numeric: 150000 },
    discount_total: 0,
    metadata: { payfast_payment_id: "PF123" },
    customer: { email: "Buyer@Example.com", first_name: "Jane", last_name: "Doe" },
    billing_address: { address_1: "1 Main Rd", city: "Cape Town", postal_code: "8001", country_code: "za", company: "Acme (Pty) Ltd" },
    items: [
      {
        title: "Fallback title",
        quantity: 2,
        unit_price: { numeric: 75000 },
        adjustments: [],
        variant: { title: "Online", metadata: { sage_item_code: "RRP-01" }, product: { title: "Rapid Repatterning" } },
      },
    ],
    payment_collections: [{ payment_sessions: [{ provider_id: "pp_payfast_payfast" }] }],
    ...over,
  }
}

function harness(opts: { env?: Record<string, string>; orders?: unknown[]; refunds?: SageRefundRow[]; sendError?: Error } = {}) {
  const alerts: StaffAlert[] = []
  const sent: SageOrderListPayload[] = []
  const loadOrders = vi.fn(async () => opts.orders ?? [order()])
  const deps: SageOrderListDeps = {
    now: () => NOW,
    env: opts.env ?? baseEnv,
    loadOrders,
    loadRefunds: vi.fn(async () => opts.refunds ?? []),
    send: vi.fn(async (p) => {
      if (opts.sendError) throw opts.sendError
      sent.push(p)
    }),
    alert: vi.fn(async (a) => {
      alerts.push(a)
    }),
    logger: quiet,
  }
  return { deps, alerts, sent, loadOrders }
}

describe("windowFor", () => {
  it("Tuesday covers Monday", () => {
    const w = windowFor(new Date("2026-11-24T05:00:00Z"))
    expect(w.start.toISOString()).toBe("2026-11-22T22:00:00.000Z")
    expect(w.end.toISOString()).toBe("2026-11-23T22:00:00.000Z")
    expect(w.fromDate).toBe("2026-11-23")
    expect(w.toDate).toBe("2026-11-23")
    expect(w.label).toBe("Mon 23 Nov 2026")
  })

  it("Monday covers Friday, Saturday and Sunday", () => {
    const w = windowFor(new Date("2026-11-23T05:00:00Z"))
    expect(w.start.toISOString()).toBe("2026-11-19T22:00:00.000Z")
    expect(w.end.toISOString()).toBe("2026-11-22T22:00:00.000Z")
    expect(w.fromDate).toBe("2026-11-20")
    expect(w.toDate).toBe("2026-11-22")
    expect(w.label).toBe("Fri 20 Nov to Sun 22 Nov 2026")
  })

  it("a run just after midnight UTC is already the same SAST day", () => {
    const w = windowFor(new Date("2026-11-24T00:10:00Z"))
    expect(w.label).toBe("Mon 23 Nov 2026")
    // 23:30 UTC on Monday is 01:30 SAST on Tuesday
    expect(windowFor(new Date("2026-11-23T23:30:00Z")).label).toBe("Mon 23 Nov 2026")
  })

  it("crosses a month boundary", () => {
    const w = windowFor(new Date("2026-12-01T05:00:00Z")) // Tue 1 Dec
    expect(w.label).toBe("Mon 30 Nov 2026")
    expect(w.fromDate).toBe("2026-11-30")
    expect(windowFor(new Date("2026-11-02T05:00:00Z")).label).toBe("Fri 30 Oct to Sun 1 Nov 2026")
  })

  it("crosses a year boundary", () => {
    const w = windowFor(new Date("2027-01-01T05:00:00Z")) // Fri 1 Jan 2027
    expect(w.label).toBe("Thu 31 Dec 2026")
    expect(w.toDate).toBe("2026-12-31")
    expect(w.end.toISOString()).toBe("2026-12-31T22:00:00.000Z")
  })
})

describe("flags and recipients", () => {
  it("defaults to off, only code switches it on", () => {
    expect(sageOrderListMode({})).toBe("off")
    expect(sageOrderListMode({ AUTOMATION_SAGE_ORDER_LIST: "n8n" })).toBe("off")
    expect(sageOrderListMode({ AUTOMATION_SAGE_ORDER_LIST: " Code " })).toBe("code")
  })

  it("validates comma separated recipients", () => {
    expect(parseRecipients("a@x.com, b@y.co.za")).toEqual(["a@x.com", "b@y.co.za"])
    expect(parseRecipients("a@x.com, nope")).toBeNull()
    expect(parseRecipients("")).toBeNull()
    expect(parseRecipients(undefined)).toBeNull()
  })

  it("flag off does nothing and never queries", async () => {
    const h = harness({ env: { SAGE_ORDER_LIST_EMAIL: "carla@example.com" } })
    expect(await runSageOrderList(h.deps)).toEqual({ status: "off" })
    expect(h.loadOrders).not.toHaveBeenCalled()
    expect(h.deps.send).not.toHaveBeenCalled()
  })

  it("dry run builds a summary and sends nothing", async () => {
    const h = harness({ env: { ...baseEnv, AUTOMATION_DRY_RUN: "true" } })
    const res = await runSageOrderList(h.deps)
    expect(res).toEqual({ status: "dry-run", orders: 1, refunds: 0 })
    expect(h.deps.send).not.toHaveBeenCalled()
    const logged = quiet.info.mock.calls.map((c) => String(c[0])).join("\n")
    expect(logged).toContain("c***@example.com")
    expect(logged).not.toContain("carla@example.com")
    expect(logged).not.toContain("buyer@example.com")
  })

  it("flag code with no valid recipient alerts once and sends nothing", async () => {
    for (const email of ["", "not-an-email"]) {
      const h = harness({ env: { AUTOMATION_SAGE_ORDER_LIST: "code", SAGE_ORDER_LIST_EMAIL: email } })
      expect(await runSageOrderList(h.deps)).toEqual({ status: "no-recipient" })
      expect(h.alerts).toHaveLength(1)
      expect(h.deps.send).not.toHaveBeenCalled()
      expect(h.loadOrders).not.toHaveBeenCalled()
    }
  })

  it("an invalid CC also stops the send", async () => {
    const h = harness({ env: { ...baseEnv, SAGE_ORDER_LIST_CC: "bad" } })
    expect(await runSageOrderList(h.deps)).toEqual({ status: "no-recipient" })
    expect(h.alerts).toHaveLength(1)
  })
})

describe("the list", () => {
  it("builds one row per order with the SR reference, SAST time, customer and company", async () => {
    const h = harness({ env: { ...baseEnv, SAGE_ORDER_LIST_CC: "boss@example.com" } })
    expect(await runSageOrderList(h.deps)).toEqual({ status: "sent", orders: 1, refunds: 0 })
    expect(h.sent).toHaveLength(1)
    const p = h.sent[0]!
    expect(p.to).toEqual(["carla@example.com"])
    expect(p.cc).toEqual(["boss@example.com"])
    expect(p.windowLabel).toBe("Mon 23 Nov 2026")
    const row = p.orders[0]!
    expect(row.reference).toBe("SR-00042")
    expect(row.createdAtLabel).toBe("2026-11-23 14:03")
    expect(row.customerName).toBe("Jane Doe")
    expect(row.customerEmail).toBe("buyer@example.com")
    expect(row.company).toBe("Acme (Pty) Ltd")
    expect(row.billingAddress).toBe("1 Main Rd, Cape Town, 8001, za")
    expect(row.paymentMethod).toBe("PayFast")
    expect(row.paymentReference).toBe("PF123")
    expect(row.items[0]).toEqual({
      productTitle: "Rapid Repatterning",
      variantTitle: "Online",
      quantity: 2,
      unitAmount: 750,
      lineTotal: 1500,
      sageItemCode: "RRP-01",
    })
  })

  it("converts cents to major units exactly once: 249000 ZAR is 2490.00, 23000 USD is 230.00", async () => {
    const zar = order({ total: 249000, items: [{ title: "T", quantity: 1, unit_price: 249000, adjustments: [], variant: null }] })
    const usd = order({ id: "o9", display_id: 9, currency_code: "usd", total: 23000, items: [{ title: "T", quantity: 1, unit_price: 23000, adjustments: [], variant: null }] })
    const h = harness({ orders: [zar, usd] })
    await runSageOrderList(h.deps)
    const [a, b] = h.sent[0]!.orders
    expect([a!.total, a!.items[0]!.unitAmount, a!.items[0]!.lineTotal]).toEqual([2490, 2490, 2490])
    expect([b!.total, b!.currency]).toEqual([230, "USD"])
    expect(money(249000)).toBe(2490)
    expect(money({ numeric: 249000 })).toBe(2490)
    expect(money("23000")).toBe(230)
    expect(money(null)).toBe(0)
  })

  it("the default order fixture: 2 x 750.00 = 1500.00", async () => {
    const h = harness()
    await runSageOrderList(h.deps)
    const row = h.sent[0]!.orders[0]!
    expect([row.total, row.items[0]!.unitAmount, row.items[0]!.lineTotal]).toEqual([1500, 750, 1500])
  })

  it("a USD order keeps USD", async () => {
    const h = harness({
      orders: [order({ currency_code: "usd", total: 2000, payment_collections: [{ payment_sessions: [{ provider_id: "pp_paypal_paypal" }] }], metadata: { paypal_order_id: "PP9" } })],
    })
    await runSageOrderList(h.deps)
    const row = h.sent[0]!.orders[0]!
    expect(row.currency).toBe("USD")
    expect(row.total).toBe(20)
    expect(row.paymentMethod).toBe("PayPal")
    expect(row.paymentReference).toBe("PP9")
  })

  it("a voucher order shows the code and the discount", async () => {
    const o = order({
      discount_total: 15000,
      total: 135000,
      items: [{ title: "T", quantity: 1, unit_price: 150000, adjustments: [{ code: "SPRING10" }, { code: "SPRING10" }], variant: { title: null, metadata: {}, product: { title: "T" } } }],
    })
    const h = harness({ orders: [o] })
    await runSageOrderList(h.deps)
    const row = h.sent[0]!.orders[0]!
    expect(row.voucherCodes).toEqual(["SPRING10"])
    expect(row.discountTotal).toBe(150)
  })

  it("an item without a Sage code has sageItemCode null", async () => {
    const o = order({ items: [{ title: "Mystery", quantity: 1, unit_price: 100, adjustments: [], variant: { title: "V", metadata: null, product: { title: "P" } } }] })
    const h = harness({ orders: [o] })
    await runSageOrderList(h.deps)
    expect(h.sent[0]!.orders[0]!.items[0]!.sageItemCode).toBeNull()
  })

  it("excludes canceled, draft and QA voucher orders and counts them", async () => {
    const qa = order({ id: "o2", display_id: 2, items: [{ title: "T", quantity: 1, unit_price: 0, adjustments: [{ code: "qa-selftest-100" }], variant: null }] })
    const h = harness({
      orders: [order(), order({ id: "o3", display_id: 3, status: "canceled" }), order({ id: "o4", display_id: 4, is_draft_order: true }), qa],
    })
    expect(await runSageOrderList(h.deps)).toEqual({ status: "sent", orders: 1, refunds: 0 })
    expect(h.sent[0]!.excluded).toEqual({ canceled: 1, qaVoucher: 1, draft: 1 })
    expect(h.sent[0]!.orders.map((o) => o.reference)).toEqual(["SR-00042"])
  })

  it("a refund of an older order appears", async () => {
    const refund: SageRefundRow = {
      reference: "SR-00007",
      refundedAt: "2026-11-23T09:00:00.000Z",
      refundedAtLabel: "2026-11-23 11:00",
      amount: 500,
      currency: "ZAR",
      note: "Customer request",
    }
    const h = harness({ orders: [], refunds: [refund] })
    await runSageOrderList(h.deps)
    expect(h.sent[0]!.refunds).toEqual([refund])
  })

  it("an empty day still posts with zero orders", async () => {
    const h = harness({ orders: [] })
    expect(await runSageOrderList(h.deps)).toEqual({ status: "sent", orders: 0, refunds: 0 })
    expect(h.sent).toHaveLength(1)
    expect(h.sent[0]!.orders).toEqual([])
  })

  it("a web call failure alerts, does not throw and sends once", async () => {
    const h = harness({ sendError: new Error("sage-order-list mail route answered HTTP 500") })
    const res = await runSageOrderList(h.deps)
    expect(res.status).toBe("failed")
    expect(h.alerts).toHaveLength(1)
    expect(h.alerts[0]!.lines.join(" ")).not.toContain("example.com")
    expect(h.deps.send).toHaveBeenCalledTimes(1)
  })

  it("a loading error alerts instead of throwing", async () => {
    const h = harness()
    h.deps.loadOrders = vi.fn(async () => {
      throw new Error("db down")
    })
    expect((await runSageOrderList(h.deps)).status).toBe("failed")
    expect(h.alerts).toHaveLength(1)
  })
})

describe("findRefunds", () => {
  it("maps rows from any order and passes the window", async () => {
    const raw = vi.fn(async (_sql: string, _bindings?: unknown[]) => [
      { id: "ref_1", amount: { numeric: 25000 }, note: " damaged ", created_at: "2026-11-23T08:00:00Z", currency_code: "usd", display_id: 7 },
      { id: "ref_2", amount: 1000, note: null, created_at: "2026-11-23T09:00:00Z", currency_code: "zar", display_id: null },
    ])
    const w = windowFor(NOW)
    const rows = await findRefunds({ raw }, w)
    expect(raw.mock.calls[0]![1]).toEqual([w.start, w.end])
    expect(rows).toEqual([
      { reference: "SR-00007", refundedAt: "2026-11-23T08:00:00.000Z", refundedAtLabel: "2026-11-23 10:00", amount: 250, currency: "USD", note: "damaged" },
    ])
  })
})

describe("sendSageOrderListViaWeb", () => {
  const payload = { to: ["a@b.co"] } as unknown as SageOrderListPayload

  it("posts JSON with the secret header once", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }))
    await sendSageOrderListViaWeb(payload, { INTERNAL_WEBHOOK_SECRET: "s1", N8N_WEBHOOK_SECRET: "s2" }, fetchImpl)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe("http://web:3000/api/email/sage-order-list")
    expect((init.headers as Record<string, string>)["x-webhook-secret"]).toBe("s1")
  })

  it("throws on a non-2xx answer without retrying", async () => {
    const fetchImpl = vi.fn(async () => new Response("no", { status: 500 }))
    await expect(sendSageOrderListViaWeb(payload, {}, fetchImpl)).rejects.toThrow(/HTTP 500/)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})
