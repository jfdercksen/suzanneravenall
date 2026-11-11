/**
 * Payload media URLs for next/image. Payload builds absolute URLs from
 * PAYLOAD_URL (${SITE_URL}/cms/api/media/file/...); a relative one gets the
 * site origin. next.config.mjs allows that path on the site host.
 */
export function mediaSrc(url: string | null | undefined): string | null {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/+$/, '')
  return url.startsWith('/') && site ? `${site}${url}` : null
}
