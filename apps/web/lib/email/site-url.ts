/**
 * Public site origin for links inside emails, without a trailing slash.
 *
 * Uses `||` rather than `??`: an env file with `NEXT_PUBLIC_SITE_URL=` (set
 * but empty) must still fall back to the real domain, otherwise every link in
 * the email becomes a relative path that goes nowhere in a mail client.
 * Read at call time so tests can stub the env.
 */
export const DEFAULT_SITE_URL = 'https://suzanneravenall.com'

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL).replace(/\/+$/, '')
}
