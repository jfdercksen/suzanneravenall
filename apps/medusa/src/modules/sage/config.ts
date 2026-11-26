/**
 * Sage settings from the environment (names only in docs/golive/sage-link-README.md).
 * Read at call time. Anything that would make the link guess (tax type) or post
 * to the wrong place (cash customer) is a SageConfigError, never a default.
 */

import { SageConfigError } from "./errors"

export type SageAuthMode = "basic" | "oauth"
export type SageCustomerMode = "per_customer" | "cash"

export type SageConfig = {
  authMode: SageAuthMode
  baseUrl: string
  apiKey: string
  companyId: string
  email: string
  password: string
  /** SAGE_TAX_TYPE_ID: required to post an invoice. Null when unset. */
  taxTypeId: number | null
  /** SAGE_INCOME_ACCOUNT_ID: needed for account lines (fallback, discount, charges). */
  incomeAccountId: number | null
  customerMode: SageCustomerMode
  cashCustomerId: number | null
}

export const DEFAULT_SAGE_BASE_URL = "https://accounting.sageone.co.za/api/2.0.0"

type Env = Record<string, string | undefined>

function optionalId(env: Env, name: string): number | null {
  const raw = (env[name] ?? "").trim()
  if (!raw) return null
  if (!/^\d+$/.test(raw) || Number(raw) <= 0) throw new SageConfigError(`${name} must be a positive whole number`)
  return Number(raw)
}

export function sageConfigFromEnv(env: Env = process.env): SageConfig {
  const authRaw = (env.SAGE_AUTH ?? "").trim().toLowerCase() || "basic"
  if (authRaw !== "basic" && authRaw !== "oauth") throw new SageConfigError(`SAGE_AUTH must be "basic" or "oauth"`)
  const modeRaw = (env.SAGE_CUSTOMER_MODE ?? "").trim().toLowerCase() || "per_customer"
  if (modeRaw !== "per_customer" && modeRaw !== "cash") throw new SageConfigError(`SAGE_CUSTOMER_MODE must be "per_customer" or "cash"`)
  return {
    authMode: authRaw,
    baseUrl: ((env.SAGE_API_URL ?? "").trim() || DEFAULT_SAGE_BASE_URL).replace(/\/$/, ""),
    apiKey: env.SAGE_API_KEY ?? "",
    companyId: env.SAGE_COMPANY_ID ?? "",
    email: env.SAGE_EMAIL ?? "",
    password: env.SAGE_PASSWORD ?? "",
    taxTypeId: optionalId(env, "SAGE_TAX_TYPE_ID"),
    incomeAccountId: optionalId(env, "SAGE_INCOME_ACCOUNT_ID"),
    customerMode: modeRaw,
    cashCustomerId: optionalId(env, "SAGE_CASH_CUSTOMER_ID"),
  }
}

/** The tax type the invoice must carry. Never guessed: the company is not VAT registered. */
export function requireTaxTypeId(config: SageConfig): number {
  if (config.taxTypeId === null) {
    throw new SageConfigError("SAGE_TAX_TYPE_ID is not set; the link will not guess a VAT type")
  }
  return config.taxTypeId
}

/** Cash mode needs its customer; per_customer returns null. */
export function requireCashCustomerId(config: SageConfig): number | null {
  if (config.customerMode !== "cash") return null
  if (config.cashCustomerId === null) throw new SageConfigError("SAGE_CUSTOMER_MODE=cash needs SAGE_CASH_CUSTOMER_ID")
  return config.cashCustomerId
}
