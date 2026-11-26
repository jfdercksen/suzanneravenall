/**
 * Sage SA v2 HTTP client. Authentication is injected (basic or OAuth), fetch is
 * injected (tests). Every list search tries an OData $filter first and falls
 * back to paging when Sage rejects it or ignores it, and stops at the first
 * match. Whether Sage supports $filter on Email, Code and Reference is checked
 * against the trial company (docs/golive/sage-link-README.md).
 */

import { SageApiError } from "./errors"
import type { SageAuth } from "./auth"
import type { SageConfig } from "./config"
import type { SageCustomer, SageInvoice, SageInvoiceBody, SageItem, SagePaginatedResponse } from "./types"

type FetchImpl = (input: string, init?: RequestInit) => Promise<Response>

const PAGE = 100
const REQUEST_TIMEOUT_MS = 20_000
/** Paging fallback caps: customers 10 000, items 5 000, invoices (newest first) 5 000. */
const MAX_PAGES = { customer: 100, item: 50, invoice: 50 } as const

export const odataString = (value: string): string => `'${value.replace(/'/g, "''")}'`

type Search<T> = {
  path: string
  field: string
  value: string
  match: (row: T) => boolean
  orderby: string
  maxPages: number
  what: string
}

export class SageClient {
  private readonly fetchImpl: FetchImpl

  constructor(
    private readonly config: SageConfig,
    private readonly auth: SageAuth,
    opts: { fetchImpl?: FetchImpl } = {},
  ) {
    this.fetchImpl = opts.fetchImpl ?? ((input, init) => fetch(input, init))
  }

  private url(path: string, params: Record<string, string | number> = {}): string {
    const q = new URLSearchParams({ apikey: this.config.apiKey, companyid: this.config.companyId })
    for (const [k, v] of Object.entries(params)) q.set(k, String(v))
    return `${this.config.baseUrl}${path}?${q.toString()}`
  }

  private async request<T>(method: "GET" | "POST", path: string, params: Record<string, string | number>, body?: unknown, retried = false): Promise<T> {
    const res = await this.fetchImpl(this.url(path, params), {
      method,
      headers: await this.auth.headers(),
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (res.status === 401 && !retried && (await this.auth.refreshAfterUnauthorized())) {
      return this.request<T>(method, path, params, body, true)
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new SageApiError(`Sage ${method} ${path} failed: ${res.status} ${text.slice(0, 300)}`, res.status)
    }
    return (await res.json()) as T
  }

  private get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
    return this.request<T>("GET", path, params)
  }

  /** $filter first, paging second; the first match wins. Null when there is none. */
  async findOne<T>(s: Search<T>): Promise<T | null> {
    let filtered: SagePaginatedResponse<T> | null = null
    try {
      filtered = await this.get<SagePaginatedResponse<T>>(s.path, {
        $filter: `${s.field} eq ${odataString(s.value)}`,
        $top: PAGE,
      })
    } catch (err) {
      // Sage does not understand the filter: page instead. Anything else (401, 5xx) is a real failure.
      if (!(err instanceof SageApiError && err.status === 400)) throw err
    }
    if (filtered) {
      const rows = filtered.Results ?? []
      const hit = rows.find(s.match)
      if (hit) return hit
      if (rows.length === 0) return null // the filter was applied and nothing matches
      // Rows came back but none match: the filter was ignored. Page.
    }
    for (let page = 0; page < s.maxPages; page++) {
      const skip = page * PAGE
      const data = await this.get<SagePaginatedResponse<T>>(s.path, { $top: PAGE, $skip: skip, $orderby: s.orderby })
      const rows = data.Results ?? []
      const hit = rows.find(s.match)
      if (hit) return hit
      // Stop at the end: by TotalResults when Sage sends it, else on a short (not full) page.
      const total = data.TotalResults
      if (rows.length === 0 || (typeof total === "number" ? skip + PAGE >= total : rows.length < PAGE)) return null
    }
    throw new Error(`Sage ${s.what} search stopped after ${s.maxPages} pages without finishing; check the trial company supports $filter`)
  }

  findCustomerByEmail(email: string): Promise<SageCustomer | null> {
    const wanted = email.trim().toLowerCase()
    return this.findOne<SageCustomer>({
      path: "/Customer/Get",
      field: "Email",
      value: wanted,
      match: (c) => (c.Email ?? "").trim().toLowerCase() === wanted,
      orderby: "ID",
      maxPages: MAX_PAGES.customer,
      what: "customer",
    })
  }

  createCustomer(name: string, email: string): Promise<SageCustomer> {
    return this.request<SageCustomer>("POST", "/Customer/Save", {}, {
      ID: 0,
      Name: name,
      ContactName: name,
      Email: email.trim().toLowerCase(),
      Active: true,
      AcceptsElectronicInvoices: true,
    })
  }

  findItemByCode(code: string): Promise<SageItem | null> {
    return this.findOne<SageItem>({
      path: "/Item/Get",
      field: "Code",
      value: code,
      match: (i) => (i.Code ?? "").trim().toLowerCase() === code.trim().toLowerCase(),
      orderby: "ID",
      maxPages: MAX_PAGES.item,
      what: "item",
    })
  }

  findTaxInvoiceByReference(reference: string): Promise<SageInvoice | null> {
    return this.findOne<SageInvoice>({
      path: "/TaxInvoice/Get",
      field: "Reference",
      value: reference,
      match: (i) => (i.Reference ?? "").trim().toUpperCase() === reference.trim().toUpperCase(),
      orderby: "ID desc",
      maxPages: MAX_PAGES.invoice,
      what: "invoice",
    })
  }

  saveTaxInvoice(body: SageInvoiceBody): Promise<SageInvoice> {
    return this.request<SageInvoice>("POST", "/TaxInvoice/Save", {}, { ID: 0, ...body })
  }
}
