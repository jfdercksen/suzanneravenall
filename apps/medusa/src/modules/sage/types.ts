export interface SageOptions {
  apiKey: string
  email: string
  password: string
  companyId: string
  baseUrl?: string
  // Optional: override the heuristic income account lookup with a known account ID.
  // Get this from Sage admin → Chart of Accounts. Recommended for production.
  incomeAccountId?: string
}

export interface SageCustomer {
  ID: number
  Name: string
  Email?: string
  ContactName?: string
  Mobile?: string
  Active: boolean
}

export interface SageTaxType {
  ID: number
  Name: string
  Percentage: number
  IsDefault: boolean
  Active: boolean
}

export interface SageInvoiceLine {
  ID: number
  LineType: number // 1 = account-based (for digital/service products)
  SelectionId: number
  TaxTypeId: number
  Description: string
  Quantity: number
  UnitPriceInclusive: number
  DiscountPercentage: number
}

export interface SageInvoice {
  ID: number
  DocumentNumber: string
  CustomerId: number
  CustomerName: string
  Date: string
  DueDate: string
  Exclusive: number
  Tax: number
  Total: number
  AmountDue: number
  StatusId: number
  Status: string
  Reference?: string
}

export interface SagePaginatedResponse<T> {
  TotalResults: number
  ReturnedResults: number
  Results: T[]
}

export interface MedusaOrderItem {
  id: string
  title: string
  quantity: number
  unit_price: number
  variant?: {
    title?: string
    product?: { title?: string }
  }
}

export interface MedusaOrderCustomer {
  id?: string
  email: string
  first_name?: string
  last_name?: string
}

export interface MedusaOrder {
  id: string
  display_id?: number
  customer: MedusaOrderCustomer
  items: MedusaOrderItem[]
  total: number
  currency_code: string
}
