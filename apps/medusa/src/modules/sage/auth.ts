/**
 * How a request to Sage proves who it is. SAGE_AUTH picks the implementation:
 *   basic (default)  the sandbox method: Basic header from SAGE_EMAIL / SAGE_PASSWORD
 *                    (the apikey and companyid query params are added by the client).
 *   oauth            OAuth 2.0 authorization code flow for the live company.
 *
 * Endpoints and client details for OAuth come from the environment because
 * Sage has not issued them yet; if any is unset the OAuth path refuses with a
 * clear error. Tokens, codes and secrets are never logged or put in errors.
 */

import { randomBytes } from "node:crypto"
import { SageApiError, SageConfigError } from "./errors"
import type { SageConfig } from "./config"
import type { SageTokenStore, SageTokens } from "./store"

export interface SageAuth {
  headers(): Promise<Record<string, string>>
  /** Called after a 401: OAuth refreshes the token, Basic has nothing to refresh. True when a retry is worth it. */
  refreshAfterUnauthorized(): Promise<boolean>
}

type FetchImpl = (input: string, init?: RequestInit) => Promise<Response>

// ---------------------------------------------------------------------------
// Basic (sandbox)
// ---------------------------------------------------------------------------

export class BasicAuth implements SageAuth {
  constructor(private readonly creds: { email: string; password: string }) {}

  async headers(): Promise<Record<string, string>> {
    if (!this.creds.email || !this.creds.password) throw new SageConfigError("SAGE_EMAIL and SAGE_PASSWORD must be set for SAGE_AUTH=basic")
    const basic = Buffer.from(`${this.creds.email}:${this.creds.password}`).toString("base64")
    return { Authorization: `Basic ${basic}`, "Content-Type": "application/json", Accept: "application/json" }
  }

  async refreshAfterUnauthorized(): Promise<boolean> {
    return false
  }
}

// ---------------------------------------------------------------------------
// OAuth 2.0
// ---------------------------------------------------------------------------

export type OAuthConfig = {
  authorizeUrl: string
  tokenUrl: string
  clientId: string
  clientSecret: string
  redirectUri: string
  scope: string
}

/** The callback address already given to Sage; nginx sends it to the web app. */
export const DEFAULT_SAGE_REDIRECT_URI = "https://suzanneravenall.com/api/sage/oauth/callback"
/** Refresh this long before the token expires. */
export const TOKEN_MARGIN_MS = 60_000
/** A started connect is valid for this long. */
export const STATE_TTL_MS = 10 * 60_000

export function oauthConfigFromEnv(env: Record<string, string | undefined> = process.env): OAuthConfig {
  const need = ["SAGE_OAUTH_AUTHORIZE_URL", "SAGE_OAUTH_TOKEN_URL", "SAGE_OAUTH_CLIENT_ID", "SAGE_OAUTH_CLIENT_SECRET"]
  const missing = need.filter((n) => !(env[n] ?? "").trim())
  if (missing.length > 0) throw new SageConfigError(`Sage OAuth is not configured: ${missing.join(", ")} not set`)
  return {
    authorizeUrl: env.SAGE_OAUTH_AUTHORIZE_URL!.trim(),
    tokenUrl: env.SAGE_OAUTH_TOKEN_URL!.trim(),
    clientId: env.SAGE_OAUTH_CLIENT_ID!.trim(),
    clientSecret: env.SAGE_OAUTH_CLIENT_SECRET!.trim(),
    redirectUri: (env.SAGE_OAUTH_REDIRECT_URI ?? "").trim() || DEFAULT_SAGE_REDIRECT_URI,
    // Shape to be confirmed with the client details Sage issues.
    scope: (env.SAGE_OAUTH_SCOPE ?? "").trim() || "full_access",
  }
}

export function newOAuthState(): string {
  return randomBytes(32).toString("base64url")
}

type TokenAnswer = { access_token?: unknown; refresh_token?: unknown; expires_in?: unknown; scope?: unknown; error?: unknown }

export class OAuth2Auth implements SageAuth {
  private refreshing: Promise<SageTokens> | null = null
  private readonly fetchImpl: FetchImpl
  private readonly now: () => Date

  constructor(
    private readonly config: OAuthConfig,
    private readonly store: SageTokenStore,
    opts: { fetchImpl?: FetchImpl; now?: () => Date } = {},
  ) {
    this.fetchImpl = opts.fetchImpl ?? ((input, init) => fetch(input, init))
    this.now = opts.now ?? (() => new Date())
  }

  buildAuthorizeUrl(state: string): string {
    const url = new URL(this.config.authorizeUrl)
    url.searchParams.set("response_type", "code")
    url.searchParams.set("client_id", this.config.clientId)
    url.searchParams.set("redirect_uri", this.config.redirectUri)
    url.searchParams.set("scope", this.config.scope)
    url.searchParams.set("state", state)
    return url.toString()
  }

  /** Exchanges the one-time code for tokens and stores them (encrypted). */
  async exchangeCode(code: string): Promise<void> {
    const tokens = await this.requestTokens(
      { grant_type: "authorization_code", code, redirect_uri: this.config.redirectUri },
      null,
    )
    await this.store.save(tokens)
  }

  async headers(): Promise<Record<string, string>> {
    const token = await this.validAccessToken()
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" }
  }

  async refreshAfterUnauthorized(): Promise<boolean> {
    const current = await this.store.load()
    if (!current) return false
    await this.refresh(current)
    return true
  }

  private async validAccessToken(): Promise<string> {
    const tokens = await this.store.load()
    if (!tokens) throw new SageConfigError("Sage is not connected yet: run the connect step (POST /admin/sage/connect)")
    if (tokens.expiresAt.getTime() - this.now().getTime() > TOKEN_MARGIN_MS) return tokens.accessToken
    return (await this.refresh(tokens)).accessToken
  }

  private refresh(current: SageTokens): Promise<SageTokens> {
    // One refresh at a time: refresh tokens are often single use.
    this.refreshing ??= this.requestTokens({ grant_type: "refresh_token", refresh_token: current.refreshToken }, current)
      .then(async (fresh) => {
        await this.store.save(fresh)
        return fresh
      })
      .finally(() => {
        this.refreshing = null
      })
    return this.refreshing
  }

  private async requestTokens(form: Record<string, string>, previous: SageTokens | null): Promise<SageTokens> {
    const body = new URLSearchParams({ ...form, client_id: this.config.clientId, client_secret: this.config.clientSecret })
    const res = await this.fetchImpl(this.config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: body.toString(),
    })
    const data = (await res.json().catch(() => ({}))) as TokenAnswer
    if (!res.ok) {
      const reason = typeof data.error === "string" ? data.error.slice(0, 60) : "no reason given"
      if (previous && (res.status === 400 || res.status === 401)) {
        throw new SageConfigError(`Sage refused the token refresh (${reason}); connect Sage again`)
      }
      throw new SageApiError(`Sage token endpoint answered ${res.status} (${reason})`, res.status)
    }
    const expiresIn = Number(data.expires_in)
    if (typeof data.access_token !== "string" || !data.access_token || !Number.isFinite(expiresIn) || expiresIn <= 0) {
      throw new SageApiError("Sage token endpoint answered without an access token or expiry", 502)
    }
    const refreshToken = typeof data.refresh_token === "string" && data.refresh_token ? data.refresh_token : previous?.refreshToken
    if (!refreshToken) throw new SageApiError("Sage token endpoint answered without a refresh token", 502)
    return {
      accessToken: data.access_token,
      refreshToken,
      expiresAt: new Date(this.now().getTime() + expiresIn * 1000),
      scope: typeof data.scope === "string" ? data.scope : (previous?.scope ?? null),
    }
  }
}

export function sageAuthFromConfig(
  config: SageConfig,
  deps: { store: () => SageTokenStore; env?: Record<string, string | undefined>; fetchImpl?: FetchImpl },
): SageAuth {
  if (config.authMode === "basic") return new BasicAuth({ email: config.email, password: config.password })
  return new OAuth2Auth(oauthConfigFromEnv(deps.env), deps.store(), { fetchImpl: deps.fetchImpl })
}
