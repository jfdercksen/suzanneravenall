/**
 * The two halves of connecting Sage over OAuth, used by the Medusa routes:
 *   startConnect     admin route: new one-time state (10 min), returns the authorize URL
 *   completeConnect  internal hook, called by the web callback: checks the state,
 *                    exchanges the code, stores the tokens
 * Neither logs or returns a token, a code or the state.
 */

import { newOAuthState, STATE_TTL_MS, type OAuth2Auth } from "./auth"
import type { SageTokenStore } from "./store"

export class OAuthStateError extends Error {
  constructor() {
    super("The Sage connect link is invalid, already used or expired; start the connect again")
    this.name = "OAuthStateError"
  }
}

type Deps = { auth: OAuth2Auth; store: SageTokenStore; now?: () => Date }

export async function startConnect({ auth, store, now = () => new Date() }: Deps): Promise<{ url: string; expiresAt: Date }> {
  const state = newOAuthState()
  const expiresAt = new Date(now().getTime() + STATE_TTL_MS)
  await store.saveState(state, expiresAt)
  return { url: auth.buildAuthorizeUrl(state), expiresAt }
}

export async function completeConnect(
  { auth, store, now = () => new Date() }: Deps,
  input: { code: string; state: string },
): Promise<void> {
  // The state is spent first: a replayed callback never reaches the token endpoint.
  if (!(await store.consumeState(input.state, now()))) throw new OAuthStateError()
  await auth.exchangeCode(input.code)
}
