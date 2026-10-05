// Returns the DSN only when it looks like a real Sentry DSN
// (https://<publicKey>@<host>/<projectId>); otherwise undefined.
//
// Site check B17: the review build shipped a placeholder
// ("<DSN from suzanneravenall-web project>"), and Sentry.init logged
// "Invalid Sentry Dsn" on every page. Passing undefined instead initialises
// the disabled client quietly, the same as an unset DSN (see lib/log.ts).
const DSN_PATTERN = /^https?:\/\/[^@\s/]+@[^\s/]+\/\d+$/

export function resolveSentryDsn(value: string | undefined | null): string | undefined {
  const dsn = value?.trim()
  return dsn && DSN_PATTERN.test(dsn) ? dsn : undefined
}
