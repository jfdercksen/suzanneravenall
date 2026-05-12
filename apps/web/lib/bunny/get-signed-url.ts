import crypto from 'crypto'
import { hasAccess, type TierSlug } from '@/lib/access/tiers'

const TOKEN_TTL_SECONDS = 4 * 60 * 60 // 4 hours

/**
 * Generate a time-limited signed Bunny Stream embed URL.
 *
 * The signing key is the library-level Token Authentication Key configured in
 * the Bunny.net dashboard (Stream → Library → Security → Token Auth Key).
 * We read it from BUNNY_STREAM_API_KEY. If the library uses a dedicated signing
 * key, override by adding BUNNY_STREAM_SIGNING_KEY to the environment.
 *
 * Token algorithm: SHA256(signingKey + videoId + expiresTimestamp), hex-encoded.
 * Reference: https://docs.bunny.net/docs/stream-getting-started#signed-embed-urls
 */
export function generateSignedUrl(
  videoId: string,
  tier: TierSlug,
): string | null {
  // Require at least silver tier (group sessions) or above (live sessions, practitioner)
  const hasVideoAccess =
    hasAccess(tier, 'group_sessions_recorded') ||
    hasAccess(tier, 'live_session_recordings')
  if (!hasVideoAccess) return null

  const signingKey =
    process.env.BUNNY_STREAM_SIGNING_KEY ?? process.env.BUNNY_STREAM_API_KEY
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME ?? 'iframe.mediadelivery.net'

  if (!signingKey || !libraryId) {
    throw new Error('Bunny Stream environment variables are not configured')
  }

  const expires = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS

  // Bunny Stream token: SHA256(signingKey + videoId + expires)
  // Reference: https://docs.bunny.net/docs/stream-getting-started#signed-embed-urls
  const token = crypto
    .createHash('sha256')
    .update(signingKey + videoId + expires)
    .digest('hex')

  return (
    `https://${cdnHostname}/embed/${libraryId}/${videoId}` +
    `?token=${token}&expires=${expires}`
  )
}
