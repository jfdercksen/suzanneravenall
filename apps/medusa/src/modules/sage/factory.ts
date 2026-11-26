/** Wiring of the Sage stores and OAuth objects on Medusa's Postgres. */

import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { RawSql } from "../automations/pg-store"
import { OAuth2Auth, oauthConfigFromEnv } from "./auth"
import { PgCustomerMapStore, PgItemCacheStore, PgSageTokenStore, type SageTokenStore } from "./store"

type Resolver = { resolve<T = unknown>(key: string): T }

export const sageDb = (container: Resolver): RawSql => container.resolve<RawSql>(ContainerRegistrationKeys.PG_CONNECTION)

export function sageStores(container: Resolver) {
  const db = sageDb(container)
  return { tokens: new PgSageTokenStore(db), customers: new PgCustomerMapStore(db), items: new PgItemCacheStore(db) }
}

/** The OAuth object and token store for the connect routes. Throws SageConfigError when OAuth is not configured. */
export function sageOAuth(container: Resolver, env: Record<string, string | undefined> = process.env): { auth: OAuth2Auth; store: SageTokenStore } {
  const store = new PgSageTokenStore(sageDb(container), env)
  return { auth: new OAuth2Auth(oauthConfigFromEnv(env), store), store }
}
