/**
 * Dry-run support. With AUTOMATION_DRY_RUN=true a client logs the payload it
 * would send (emails masked, POPIA) and returns a fake id. It makes no network
 * call at all, so a dry run on the review box can never touch a live system.
 */

export type Logger = Pick<Console, 'info' | 'warn' | 'error'>

export function isDryRun(env: Record<string, string | undefined> = process.env): boolean {
  return (env.AUTOMATION_DRY_RUN ?? '').trim().toLowerCase() === 'true'
}

/** "jane.doe@example.com" -> "j***@example.com". */
export function maskEmail(value: string): string {
  const at = value.indexOf('@')
  if (at < 1) return '***'
  return `${value[0]}***${value.slice(at)}`
}

const EMAIL_RE = /[^\s"'<>@]+@[^\s"'<>@]+\.[^\s"'<>@]+/g

/** Deep copy with every email-looking string masked, for logs. */
export function maskEmails<T>(value: T): T {
  if (typeof value === 'string') {
    return value.replace(EMAIL_RE, (m) => maskEmail(m)) as unknown as T
  }
  if (Array.isArray(value)) return value.map((v) => maskEmails(v)) as unknown as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = maskEmails(v)
    return out as T
  }
  return value
}

let counter = 0

/** A recognisable fake id, for example "dryrun-Contacts-3". */
export function fakeId(kind: string): string {
  counter += 1
  return `dryrun-${kind}-${counter}`
}
