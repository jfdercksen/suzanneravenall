import { NextResponse, type NextRequest } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

// Zod schema validates payload before any DB interaction.
// VideoGuid must be a UUID — prevents an empty/malformed value matching
// every row in the .eq() filter and mass-promoting unpublished videos.
// ThumbnailFileName is restricted to safe filename characters to prevent
// path traversal in the stored thumbnail_url.
const BunnyPayloadSchema = z.object({
  VideoGuid: z.string().uuid(),
  VideoLibraryId: z.number().int().positive(),
  Status: z.number().int(),
  event: z.string().optional(),
  Duration: z.number().nonnegative().finite().optional(),
  ThumbnailFileName: z
    .string()
    .max(255)
    .regex(/^[a-zA-Z0-9._-]+$/)
    .optional(),
  VideoTitle: z.string().max(500).optional(),
})

type BunnyWebhookPayload = z.infer<typeof BunnyPayloadSchema>

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.BUNNY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[bunny webhook] BUNNY_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const rawBody = await request.text()

  // Normalise to lowercase — Bunny may send uppercase hex
  const signature = (request.headers.get('BunnyNet-Signature') ?? '').toLowerCase()
  const expectedSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')

  // Length check required before timingSafeEqual to avoid buffer size mismatch
  let signaturesMatch = false
  if (signature.length === expectedSig.length) {
    try {
      signaturesMatch = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSig),
      )
    } catch {
      signaturesMatch = false
    }
  }

  if (!signaturesMatch) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let rawPayload: unknown
  try {
    rawPayload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = BunnyPayloadSchema.safeParse(rawPayload)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const payload: BunnyWebhookPayload = parsed.data

  // Bunny Stream Status 4 = encoding finished successfully
  // Reference: https://docs.bunny.net/docs/stream-getting-started
  const isEncodingSuccess =
    payload.event === 'video.encoding.success' || payload.Status === 4
  if (!isEncodingSuccess) {
    return NextResponse.json({ ok: true, message: 'Event ignored' })
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceRoleKey || !supabaseUrl) {
    console.error('[bunny webhook] Supabase env vars are not set')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME ?? 'iframe.mediadelivery.net'
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID

  const thumbnailUrl =
    payload.ThumbnailFileName && libraryId
      ? `https://${cdnHostname}/${libraryId}/${payload.VideoGuid}/${payload.ThumbnailFileName}`
      : null

  const { error } = await supabase
    .from('video_content')
    .update({
      status: 'ready',
      duration_seconds: payload.Duration ?? null,
      thumbnail_url: thumbnailUrl,
    })
    .eq('bunny_video_id', payload.VideoGuid)

  if (error) {
    console.error('[bunny webhook] Failed to update video_content:', error)
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
