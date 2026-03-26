import * as Sentry from "@sentry/node";

interface SentryOptions {
  dsn?: string;
  environment?: string;
  tracesSampleRate?: number;
}

export function initSentry(options: SentryOptions = {}): void {
  const dsn = options.dsn ?? process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: options.environment ?? process.env.SENTRY_ENVIRONMENT ?? "development",
    tracesSampleRate: options.tracesSampleRate ?? 0.1,
  });
}

export { Sentry };
