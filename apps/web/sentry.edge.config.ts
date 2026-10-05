import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "./lib/sentry-scrub";
import { resolveSentryDsn } from "./lib/sentry-dsn";

Sentry.init({
  // Placeholder or malformed DSN -> disabled client, no "Invalid Sentry Dsn" log
  dsn: resolveSentryDsn(process.env.SENTRY_DSN_WEB),
  environment: process.env.SENTRY_ENVIRONMENT ?? "development",
  tracesSampleRate: 0.1,

  // Strip bearer-token-style query params (e.g. the quiz-invite link's
  // ?token=) from captured URLs before events leave the edge runtime.
  beforeSend: scrubSentryEvent,
  beforeSendTransaction: scrubSentryEvent,
});
