/**
 * Creates the caller's free-tier `member_subscriptions` row if it is missing.
 *
 * Background (KI038): there are two places a membership row can be created.
 * `/portal/callback` handles the email-confirmation flow and re-runs every time
 * the link is followed, so a transient failure there gets a free retry. When
 * GoTrue has `GOTRUE_MAILER_AUTOCONFIRM=true` that route never fires at all,
 * and signup was the only chance to create the row: one network blip and the
 * member permanently had none.
 *
 * So this is called from BOTH signup and password login. The endpoint is
 * idempotent and authorises the caller against their own session, so calling it
 * on every login is cheap and makes each login a recovery point for anyone who
 * slipped through. The portal layout falls back to the free tier when the row is
 * missing, so a failure here degrades display-only, but the row itself matters
 * to anything reading `member_subscriptions` directly.
 *
 * Never throws: callers treat it as best-effort and continue regardless.
 */
export async function ensureMembership(userId: string): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('/api/auth/signup-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (res.ok) return true

      // 4xx means the request itself is wrong (unauthorised, id mismatch,
      // malformed). Retrying sends the identical request, so it cannot help.
      if (res.status < 500) {
        console.error('[ensureMembership] rejected:', res.status)
        return false
      }
    } catch (error) {
      // Network failure. Worth one retry.
      console.error('[ensureMembership] request failed:', error)
    }

    if (attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 400))
    }
  }

  console.error('[ensureMembership] gave up after retry')
  return false
}
