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

export function scrubSentryEvent<T extends { request?: { url?: string }; breadcrumbs?: Array<{ data?: Record<string, unknown> }> }>(
  event: T
): T {
  if (event.request?.url) {
    event.request.url = scrubTokenParam(event.request.url)
  }
  for (const breadcrumb of event.breadcrumbs ?? []) {
    const url = breadcrumb.data?.url
    if (typeof url === 'string') {
      breadcrumb.data!.url = scrubTokenParam(url)
    }
  }
  return event
}
