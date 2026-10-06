import { VtigerClient } from '@suzanne/integrations'

/**
 * One Vtiger client per server process, so the login session is reused across
 * requests instead of two extra round trips per lead. Built lazily from env
 * (VTIGER_URL, VTIGER_USERNAME, VTIGER_ACCESS_KEY, AUTOMATION_DRY_RUN).
 * Throws when Vtiger is not configured and dry run is off; callers treat that
 * like any other Vtiger failure.
 *
 * Short per-request timeout and two retries: a visitor is waiting, and the
 * whole sync also runs under the caller's overall time budget.
 */

let client: VtigerClient | null = null

export function getVtigerClient(): VtigerClient {
  if (!client) {
    client = VtigerClient.fromEnv(process.env, { timeoutMs: 4_000, retries: 2, baseDelayMs: 300 })
  }
  return client
}

/** Tests only: forget the cached client so env changes take effect. */
export function resetVtigerClient(): void {
  client = null
}
