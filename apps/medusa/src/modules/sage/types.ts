/** Sage Business Cloud Accounting South Africa, API v2 shapes the link reads and writes. */

export interface SageCustomer {
  ID: number
  Name: string
  Email?: string
  ContactName?: string
  Active?: boolean
}

export interface SageItem {
  ID: number
  Code: string
  Description?: string
}

export interface SageInvoice {
  ID: number
  DocumentNumber: string
  Reference?: string
  Date?: string
  Total?: number
}

export interface SagePaginatedResponse<T> {
  TotalResults?: number
  ReturnedResults?: number
  Results?: T[]
}

/** Line types of a TaxInvoice line. Values to be verified against the trial company. */
export const LINE_TYPE_ITEM = 0
export const LINE_TYPE_ACCOUNT = 1

export interface SageInvoiceLine {
  SelectionId: number
  LineType: number
  TaxTypeId: number
  Description: string
  Quantity: number
  /** Rand, tax inclusive. */
  UnitPriceInclusive: number
  DiscountPercentage: number
}

export interface SageInvoiceBody {
  CustomerId: number
  Date: string
  DueDate: string
  Inclusive: boolean
  Reference: string
  Message: string
  Lines: SageInvoiceLine[]
}

/** Options medusa-config.js passes to the module shell (basic auth values; the link reads env directly). */
export interface SageOptions {
  apiKey: string
  email: string
  password: string
  companyId: string
  baseUrl?: string
  incomeAccountId?: string
}
