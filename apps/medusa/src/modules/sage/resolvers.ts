/**
 * Sage customer and item lookups with local memory in front, so Sage is asked
 * once per buyer and once per item code.
 */

import type { SageClient } from "./client"
import { requireCashCustomerId, type SageConfig } from "./config"
import { SageHold } from "./errors"
import type { CustomerMapStore, ItemCacheStore } from "./store"

type CustomerClient = Pick<SageClient, "findCustomerByEmail" | "createCustomer">
type ItemClient = Pick<SageClient, "findItemByCode">

/**
 * cash mode: the one SAGE_CASH_CUSTOMER_ID. per_customer: our map first; only
 * on a miss search Sage (once), create when absent, then remember.
 */
export async function resolveCustomerId(deps: {
  client: CustomerClient
  map: CustomerMapStore
  config: SageConfig
  email: string
  name: string
}): Promise<number> {
  const cash = requireCashCustomerId(deps.config)
  if (cash !== null) return cash

  const email = deps.email.trim().toLowerCase()
  if (!email) throw new SageHold("The order has no customer email; set SAGE_CUSTOMER_MODE=cash or invoice it by hand")

  const known = await deps.map.get(email)
  if (known !== null) return known

  const found = await deps.client.findCustomerByEmail(email)
  const customer = found ?? (await deps.client.createCustomer(deps.name || email, email))
  await deps.map.put(email, customer.ID)
  return customer.ID
}

export class ItemResolver {
  private readonly memory = new Map<string, number>()

  constructor(
    private readonly client: ItemClient,
    private readonly store: ItemCacheStore,
  ) {}

  /** Sage item id per code; null when Sage has no such code (not cached, so a code added later is found). */
  async resolve(codes: string[]): Promise<Record<string, number | null>> {
    const out: Record<string, number | null> = {}
    for (const code of new Set(codes)) {
      const mem = this.memory.get(code)
      if (mem !== undefined) {
        out[code] = mem
        continue
      }
      const stored = await this.store.get(code)
      if (stored !== null) {
        this.memory.set(code, stored)
        out[code] = stored
        continue
      }
      const item = await this.client.findItemByCode(code)
      if (!item) {
        out[code] = null
        continue
      }
      await this.store.put(code, item.ID)
      this.memory.set(code, item.ID)
      out[code] = item.ID
    }
    return out
  }
}
