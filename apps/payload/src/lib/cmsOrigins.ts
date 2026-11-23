/**
 * The origins the CMS accepts its own login cookie from (KI135, 23 Nov 2026).
 *
 * Payload checks a request that carries the payload-token cookie like this
 * (payload/dist/auth/extractJWT.js, 3.83): with an Origin header, the origin
 * must be in `csrf` exactly; without one, Sec-Fetch-Site must say same-origin,
 * same-site or none. Payload adds `serverURL` to `csrf` by itself, but our
 * serverURL carries the /cms path ("http://169.239.180.49/cms"), and a
 * browser's Origin never has a path, so no request with an Origin was ever
 * accepted: login answered 200 and the admin bounced back to the login page.
 *
 * This returns the bare origins (scheme, host, port) of the CMS addresses,
 * so the review box (http://169.239.180.49) and production
 * (https://suzanneravenall.com) each accept their own origin and nothing else.
 * Used for both `csrf` and `cors`.
 *
 * Plain http on an IP has a second gap no list can close: browsers send
 * Sec-Fetch-Site only to secure origins, so a page load there (no Origin)
 * is refused too. The review box nginx supplies the missing Origin for /cms
 * (infra/nginx/conf.d/ip-testing.conf); production over https does not need it.
 */
export function cmsOrigins(env: Record<string, string | undefined>): string[] {
  const origins = new Set<string>()
  for (const key of ['PAYLOAD_URL', 'PAYLOAD_PUBLIC_SERVER_URL'] as const) {
    const raw = env[key]?.trim()
    if (!raw) continue
    try {
      const { origin } = new URL(raw)
      if (origin && origin !== 'null') origins.add(origin)
    } catch {
      // Not a URL: leave it out rather than allow something unintended.
    }
  }
  return [...origins]
}
