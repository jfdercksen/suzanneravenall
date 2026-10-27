// Strips the `token` query param (used by the quiz-invite email link, an
// access-token-as-credential — see lib/quiz/subscriber.ts) from any URL
// string before it reaches Sentry, so a captured error/breadcrumb/replay
// never persists a live bearer token outside our own database.
export function scrubTokenParam(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.searchParams.has('token')) {
      parsed.searchParams.set('token', '[redacted]')
    }
    return parsed.toString()
  } catch {
    // Not a parseable absolute URL (e.g. a relative path) — fall back to a
    // regex strip so scrubbing still degrades gracefully.
    return url.replace(/([?&]token=)[^&]+/i, '$1[redacted]')
  }
}

// Pages whose PATH is the secret (same list as lib/analytics.ts).
// Built from a string: the regex literal broke the Sentry-wrapped webpack build.
const TOKEN_PATH = new RegExp('(/(?:intake|book|staff/booking)/)[^/?#]+', 'i')

/** Both: the token query param and a token path segment. */
export function scrubTokenUrl(url: string): string {
  return scrubTokenParam(url).replace(TOKEN_PATH, '$1[redacted]')
}

function scrubStrings(data: Record<string, unknown> | undefined): void {
  if (!data) return
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') data[key] = scrubTokenUrl(value)
  }
}

export function scrubSentryEvent<
  T extends {
    request?: { url?: string }
    transaction?: string
    breadcrumbs?: Array<{ message?: string; data?: Record<string, unknown> }>
    spans?: Array<{ description?: string; data?: Record<string, unknown> }>
  },
>(
  event: T
): T {
  if (event.request?.url) {
    event.request.url = scrubTokenUrl(event.request.url)
  }
  if (event.transaction) event.transaction = scrubTokenUrl(event.transaction)
  // Navigation crumbs carry the URL in data.to / data.from, fetch crumbs in
  // data.url, spans in description and data['url.full']: scrub every string.
  for (const breadcrumb of event.breadcrumbs ?? []) {
    if (breadcrumb.message) breadcrumb.message = scrubTokenUrl(breadcrumb.message)
    scrubStrings(breadcrumb.data)
  }
  for (const span of event.spans ?? []) {
    if (span.description) span.description = scrubTokenUrl(span.description)
    scrubStrings(span.data)
  }
  return event
}
