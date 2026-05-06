import type {
  SageOptions,
  SageCustomer,
  SageTaxType,
  SageInvoice,
  SageInvoiceLine,
  SagePaginatedResponse,
  MedusaOrder,
} from './types'

export class SageService {
  static identifier = 'sageService'

  private apiKey: string
  private email: string
  private password: string
  private companyId: string
  private baseUrl: string
  // Optional override: SAGE_INCOME_ACCOUNT_ID from config skips the chart-of-accounts heuristic
  private configuredIncomeAccountId: number | null

  // Resolved at first use; avoids blocking constructor with async I/O
  private defaultTaxTypeId: number | null = null
  private defaultIncomeAccountId: number | null = null

  constructor(_container: unknown, options: SageOptions) {
    this.apiKey = options.apiKey
    this.email = options.email
    this.password = options.password
    this.companyId = options.companyId
    this.baseUrl = (options.baseUrl ?? 'https://accounting.sageone.co.za/api/2.0.0').replace(/\/$/, '')
    this.configuredIncomeAccountId = options.incomeAccountId ? parseInt(options.incomeAccountId, 10) : null
  }

  private getHeaders(): Record<string, string> {
    const basicAuth = Buffer.from(`${this.email}:${this.password}`).toString('base64')
    return {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
    }
  }

  private qs(extra: Record<string, string | number> = {}): string {
    const base = new URLSearchParams({
      apikey: this.apiKey,
      companyid: this.companyId,
    })
    for (const [k, v] of Object.entries(extra)) {
      base.set(k, String(v))
    }
    return `?${base.toString()}`
  }

  private async get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
    const url = `${this.baseUrl}${path}${this.qs(params)}`
    const res = await fetch(url, { headers: this.getHeaders() })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`Sage GET ${path} failed: ${res.status} ${body.slice(0, 300)}`)
    }
    return res.json() as Promise<T>
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}${this.qs()}`
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      throw new Error(`Sage POST ${path} failed: ${res.status} ${errBody.slice(0, 300)}`)
    }
    return res.json() as Promise<T>
  }

  // Resolve default VAT tax type ID for this company (15% standard rate)
  async resolveDefaultTaxTypeId(): Promise<number> {
    if (this.defaultTaxTypeId !== null) return this.defaultTaxTypeId

    const data = await this.get<SagePaginatedResponse<SageTaxType>>('/TaxType/Get')
    const types = data.Results ?? []

    const defaultType =
      types.find((t) => t.IsDefault && t.Active) ??
      types.find((t) => t.Percentage === 15 && t.Active)

    if (!defaultType) throw new Error('Sage: no active tax type found')
    this.defaultTaxTypeId = defaultType.ID
    return this.defaultTaxTypeId
  }

  // Resolve income ledger account ID.
  // Prefers SAGE_INCOME_ACCOUNT_ID config; falls back to chart-of-accounts heuristic.
  // Set SAGE_INCOME_ACCOUNT_ID in production to avoid ambiguous account matching.
  async resolveDefaultIncomeAccountId(): Promise<number> {
    if (this.defaultIncomeAccountId !== null) return this.defaultIncomeAccountId

    if (this.configuredIncomeAccountId !== null) {
      this.defaultIncomeAccountId = this.configuredIncomeAccountId
      return this.defaultIncomeAccountId
    }

    type AccountEntry = { ID: number; Name: string; Active: boolean; Category?: { Description?: string } }
    const data = await this.get<SagePaginatedResponse<AccountEntry>>('/Account/GetChartofAccounts')
    const accounts = data.Results ?? []

    // Prefer an income-category account whose name suggests sales/revenue/service
    const precise = accounts.find(
      (a) =>
        a.Active &&
        a.Category?.Description?.toLowerCase().includes('income') &&
        /sale|revenue|income|service/i.test(a.Name)
    )
    const fallback = accounts.find(
      (a) => a.Active && a.Category?.Description?.toLowerCase().includes('income')
    )
    const incomeAccount = precise ?? fallback

    if (!incomeAccount) throw new Error('Sage: no income ledger account found — set SAGE_INCOME_ACCOUNT_ID in env')

    if (!precise && fallback) {
      console.warn(`[sage] Using fallback income account "${fallback.Name}" (ID: ${fallback.ID}). Set SAGE_INCOME_ACCOUNT_ID to avoid ambiguity.`)
    }

    this.defaultIncomeAccountId = incomeAccount.ID
    return this.defaultIncomeAccountId
  }

  // Sage SA v2 has no server-side email filter — fetch pages and match locally.
  async findCustomerByEmail(email: string): Promise<SageCustomer | null> {
    const normalised = email.toLowerCase().trim()
    let skip = 0
    const top = 100

    while (true) {
      const data = await this.get<SagePaginatedResponse<SageCustomer>>('/Customer/Get', {
        $top: top,
        $skip: skip,
        $orderby: 'ID',
      })

      const results = data.Results ?? []
      if (results.length === 0) return null

      const match = results.find((c) => c.Email?.toLowerCase().trim() === normalised)
      if (match) return match

      skip += top
      if (skip >= (data.TotalResults ?? 0)) return null
    }
  }

  async createCustomer(name: string, email: string): Promise<SageCustomer> {
    return this.post<SageCustomer>('/Customer/Save', {
      ID: 0,
      Name: name,
      ContactName: name,
      Email: email,
      Active: true,
      AcceptsElectronicInvoices: true,
    })
  }

  async findOrCreateCustomer(email: string, name: string): Promise<SageCustomer> {
    const existing = await this.findCustomerByEmail(email)
    if (existing) return existing
    return this.createCustomer(name, email)
  }

  async createInvoice(customerId: number, order: MedusaOrder): Promise<SageInvoice> {
    const [taxTypeId, accountId] = await Promise.all([
      this.resolveDefaultTaxTypeId(),
      this.resolveDefaultIncomeAccountId(),
    ])

    const today = new Date().toISOString().slice(0, 10)

    const lines: SageInvoiceLine[] = order.items.map((item) => {
      const productTitle = item.variant?.product?.title ?? item.title
      const variantTitle = item.variant?.title
      const description = variantTitle ? `${productTitle} — ${variantTitle}` : productTitle

      // Medusa stores prices in smallest currency unit (cents for ZAR)
      const unitPriceZar = item.unit_price / 100

      return {
        ID: 0,
        LineType: 1, // account-based line for digital/service products
        SelectionId: accountId,
        TaxTypeId: taxTypeId,
        Description: description,
        Quantity: item.quantity,
        UnitPriceInclusive: unitPriceZar,
        DiscountPercentage: 0,
      }
    })

    return this.post<SageInvoice>('/TaxInvoice/Save', {
      ID: 0,
      CustomerId: customerId,
      Date: today,
      DueDate: today, // digital products — due immediately
      Inclusive: true,
      Reference: order.display_id ? `ORDER-${order.display_id}` : order.id,
      Message: 'Thank you for your purchase.',
      Lines: lines,
    })
  }
}
