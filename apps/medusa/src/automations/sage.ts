/**
 * SAGE_INVOICE: one Sage tax invoice per paid order (Sage plan, 26 Nov 2026).
 * Idempotency key sage_invoice:<orderId>; flag AUTOMATION_SAGE off | shadow | code.
 *
 * Order of work (code mode):
 *   1. free order -> skipped; not ZAR -> held (no Sage call); settings missing -> held
 *   2. the invoice already in Sage (reference SR-<order>) -> write its ids, stop
 *   3. customer (our map, then Sage, then create), item ids, build, post
 *   4. write sage_invoice_id, sage_document_number, sage_synced_at to the order metadata
 *
 * "Held" = one staff alert and the job completes with outcome "held": a retry
 * cannot fix a missing setting or a USD order, so no retries are burned. After
 * the cause is fixed Carla invoices by hand (reference SR-<order>) or the job
 * is replayed by deleting its automation_job row. Failures that can pass
 * (Sage 5xx, network) throw and use the queue's retries and dead-job alert.
 * Refunds are not handled here (see modules/sage/invoice.ts).
 */

import { srInvoiceReference, type Logger } from "@suzanne/integrations"
import { LEASE_MS, PermanentError, type AutomationHandler, type JobRecord } from "../modules/automations/queue"
import type { SageClient } from "../modules/sage/client"
import { requireCashCustomerId, requireTaxTypeId, type SageConfig } from "../modules/sage/config"
import { SageHold } from "../modules/sage/errors"
import { buildSageInvoice, invoiceTotalCents, type SageOrderSnapshot } from "../modules/sage/invoice"
import { resolveCustomerId, type ItemResolver } from "../modules/sage/resolvers"
import type { CustomerMapStore } from "../modules/sage/store"
import { SAGE_INVOICE } from "./config"

export type SageDeps = {
  /** true: build and log only, never touch Sage or the database. */
  shadow: boolean
  config: () => SageConfig
  client: () => SageClient
  customers: () => CustomerMapStore
  items: () => ItemResolver
  /** Adds the keys to the order's metadata, keeping the existing ones. */
  writeMetadata: (orderId: string, patch: Record<string, unknown>) => Promise<void>
  now?: () => Date
  /** Milliseconds clock for the lease budget (tests). */
  clock?: () => number
  logger: Logger
}

type OrderModule = {
  retrieveOrder(id: string, config: Record<string, unknown>): Promise<{ metadata?: Record<string, unknown> | null }>
  updateOrders(id: string, data: Record<string, unknown>): Promise<unknown>
}

/** Medusa replaces the whole metadata object on update, so the existing keys are spread back in. */
export async function mergeOrderMetadata(orders: OrderModule, orderId: string, patch: Record<string, unknown>): Promise<void> {
  // Read fresh right before each write (another writer, such as the invoice PDF
  // step, may have changed the metadata since), merge only our keys, then read
  // back and write once more if our keys are not there.
  for (let attempt = 0; attempt < 2; attempt++) {
    const current = await orders.retrieveOrder(orderId, { select: ["id", "metadata"] })
    await orders.updateOrders(orderId, { metadata: { ...(current.metadata ?? {}), ...patch } })
    const after = await orders.retrieveOrder(orderId, { select: ["id", "metadata"] })
    if (Object.entries(patch).every(([k, v]) => after.metadata?.[k] === v)) return
  }
}

/** Posting stops this long before the queue lease ends: a second run could otherwise claim the job and post too. */
export const LEASE_SAFETY_MS = 3 * 60_000

export type SageJobPayload = { order: SageOrderSnapshot }
type SageState = { customerId?: number }

export type SageOutcome = "posted" | "already-in-sage" | "held" | "shadow" | "skipped"

function label(order: Pick<SageOrderSnapshot, "id" | "displayId">): string {
  return `${order.displayId !== null ? `#${order.displayId} ` : ""}(${order.id})`
}

function jobLabel(job: JobRecord): string {
  const order = (job.payload as Partial<SageJobPayload>).order
  return order ? label(order) : (job.order_id ?? "unknown order")
}

export function sageInvoiceHandler(deps: SageDeps): AutomationHandler {
  const now = deps.now ?? (() => new Date())
  const clock = deps.clock ?? Date.now

  return {
    name: SAGE_INVOICE,
    alertAfterAttempts: 3,
    async run(ctx) {
      const startedAt = clock()
      const order = (ctx.payload as Partial<SageJobPayload>).order
      if (!order?.id || !Array.isArray(order.items)) throw new PermanentError("sage_invoice job has no order")

      const hold = async (reason: string) => {
        await ctx.alert({
          key: `sage-held:${order.id}`,
          subject: `Sage invoice held - order ${label(order)}`,
          lines: [
            `The Sage invoice for order ${label(order)} was not created: ${reason}.`,
            order.displayId !== null
              ? `Please invoice it by hand in Sage with the reference ${srInvoiceReference(order.displayId)}.`
              : "Please invoice it by hand in Sage.",
            "Nothing was sent to Sage and the job will not retry.",
          ],
        })
        return { result: { outcome: "held" satisfies SageOutcome, reason } }
      }

      try {
        if (!(order.total > 0) || order.items.length === 0) {
          return { result: { outcome: "skipped" satisfies SageOutcome, reason: "no amount to invoice" } }
        }
        if (order.currencyCode !== "ZAR") {
          throw new SageHold(`the order is in ${order.currencyCode || "an unknown currency"} and the currency rule for Sage is not agreed yet`)
        }
        if (order.displayId === null) throw new SageHold("the order has no order number")

        const config = deps.config()
        const taxTypeId = requireTaxTypeId(config)
        requireCashCustomerId(config)

        if (deps.shadow) {
          const codes = order.items.map((i) => i.sageItemCode).filter((c): c is string => !!c)
          // Nothing is looked up in shadow mode: codes count as unresolved.
          const { body, warnings } = buildSageInvoice({
            order,
            customerId: 0,
            taxTypeId,
            incomeAccountId: config.incomeAccountId,
            itemIds: Object.fromEntries(codes.map((c) => [c, undefined])),
          })
          deps.logger.info(
            `[sage:shadow] order ${label(order)}: would post ${body.Reference}, ${body.Lines.length} line(s), ` +
              `total ${(invoiceTotalCents(body) / 100).toFixed(2)} ${order.currencyCode}, tax type ${taxTypeId}, ` +
              `customer mode ${config.customerMode}, ${warnings.length} warning(s) (item codes are not looked up in shadow mode)`,
          )
          return { result: { outcome: "shadow" satisfies SageOutcome, lines: body.Lines.length } }
        }

        const client = deps.client()
        const reference = srInvoiceReference(order.displayId)

        const alreadyInSage = async () => {
          const existing = await client.findTaxInvoiceByReference(reference)
          if (!existing) return null
          await deps.writeMetadata(order.id, syncedMetadata(existing.ID, existing.DocumentNumber, now()))
          deps.logger.info(`[sage] order ${label(order)}: ${reference} is already in Sage (${existing.DocumentNumber}); metadata written, nothing posted`)
          return { result: { outcome: "already-in-sage" satisfies SageOutcome, invoiceId: existing.ID, documentNumber: existing.DocumentNumber } }
        }
        const first = await alreadyInSage()
        if (first) return first

        const state = (ctx.state as SageState | null) ?? {}
        let customerId = state.customerId
        if (customerId === undefined) {
          customerId = await resolveCustomerId({
            client,
            map: deps.customers(),
            config,
            email: order.email,
            name: order.customerName,
          })
          await ctx.save({ ...state, customerId })
        }

        const codes = order.items.map((i) => i.sageItemCode).filter((c): c is string => !!c)
        const itemIds = codes.length > 0 ? await deps.items().resolve(codes) : {}
        const { body, warnings } = buildSageInvoice({ order, customerId, taxTypeId, incomeAccountId: config.incomeAccountId, itemIds })
        for (const w of warnings) deps.logger.warn(`[sage] order ${label(order)}: ${w}`)

        // The lease is 10 minutes; slow paging may have used most of it. Past the
        // budget a second runner could claim this job, so stop and retry (the
        // caches filled so far make the retry fast).
        if (clock() - startedAt > LEASE_MS - LEASE_SAFETY_MS) {
          throw new Error("Sage invoice run used up its time budget before posting; retrying")
        }
        // Cheap with $filter: the invoice may have appeared since the first look.
        const late = await alreadyInSage()
        if (late) return late

        const invoice = await client.saveTaxInvoice(body)
        await deps.writeMetadata(order.id, syncedMetadata(invoice.ID, invoice.DocumentNumber, now()))
        deps.logger.info(`[sage] order ${label(order)}: posted ${reference} as ${invoice.DocumentNumber} (${body.Lines.length} line(s), ${warnings.length} warning(s))`)
        return { result: { outcome: "posted" satisfies SageOutcome, invoiceId: invoice.ID, documentNumber: invoice.DocumentNumber, warnings } }
      } catch (err) {
        if (err instanceof SageHold) return hold(err.message)
        throw err
      }
    },
    describeFailure(job, error, final) {
      return {
        key: `sage-invoice:${job.order_id ?? job.id}`,
        subject: final ? `Sage invoice failed - order ${jobLabel(job)}` : `Sage invoice still failing, retrying - order ${jobLabel(job)}`,
        lines: [
          final
            ? `The Sage invoice for order ${jobLabel(job)} gave up after ${job.attempts} attempt(s).`
            : `The Sage invoice for order ${jobLabel(job)} has failed ${job.attempts} times; the queue keeps retrying.`,
          `Error: ${error}`,
          final ? "Please invoice the order by hand in Sage, with the SR- reference from the customer's invoice." : "No action needed yet.",
        ],
      }
    },
  }
}

function syncedMetadata(invoiceId: number, documentNumber: string, at: Date): Record<string, unknown> {
  return { sage_invoice_id: String(invoiceId), sage_document_number: documentNumber, sage_synced_at: at.toISOString() }
}
