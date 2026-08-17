import * as Sentry from '@sentry/nextjs'

// Central error logger — KI017.
//
// Every payment/webhook/email-critical path used to call console.error only,
// which reaches Docker logs but never Sentry. logError keeps the exact same
// console output (message first, then the error / context, so grep-able log
// lines are unchanged) AND forwards the event to Sentry:
//
//   - real Error instances  -> Sentry.captureException (full stack trace),
//     with the log message and any context attached as extras
//   - everything else       -> Sentry.captureMessage at "error" level,
//     with the thrown value and context as extras
//
// When no DSN is configured (SENTRY_DSN_WEB / NEXT_PUBLIC_SENTRY_DSN unset —
// see KI001), @sentry/nextjs initialises a disabled client whose capture
// calls are silent no-ops, so this helper degrades to plain console.error.
// The Sentry call is additionally wrapped in try/catch so a logging failure
// can never break a checkout, webhook, or email path.
export function logError(
  message: string,
  error?: unknown,
  context?: Record<string, unknown>
): void {
  log('error', message, error, context)
}

// Same contract at warning severity (console.warn + Sentry level "warning").
// Reserved for business-critical warns that must reach Sentry, e.g. a
// PAYMENT.CAPTURE.DENIED webhook event — routine noise should stay plain
// console.warn.
export function logWarn(
  message: string,
  error?: unknown,
  context?: Record<string, unknown>
): void {
  log('warning', message, error, context)
}

function log(
  level: 'error' | 'warning',
  message: string,
  error?: unknown,
  context?: Record<string, unknown>
): void {
  const consoleFn = level === 'error' ? console.error : console.warn

  // Preserve the pre-KI017 console behaviour exactly: message string first,
  // then whatever detail the call site had.
  if (error !== undefined && context !== undefined) {
    consoleFn(message, error, context)
  } else if (error !== undefined) {
    consoleFn(message, error)
  } else if (context !== undefined) {
    consoleFn(message, context)
  } else {
    consoleFn(message)
  }

  try {
    if (error instanceof Error) {
      Sentry.captureException(error, { level, extra: { logMessage: message, ...context } })
    } else if (error !== undefined) {
      Sentry.captureMessage(message, {
        level,
        extra: { thrown: error, ...context },
      })
    } else {
      Sentry.captureMessage(message, { level, extra: { ...context } })
    }
  } catch {
    // Sentry must never take down the calling path. Without a DSN the SDK
    // no-ops anyway; this guards against any other SDK failure mode.
  }
}
