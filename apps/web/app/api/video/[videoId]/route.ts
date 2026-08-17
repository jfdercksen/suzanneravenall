import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { getMemberTier } from '@/lib/access/check-access'
import { generateSignedUrl } from '@/lib/bunny/get-signed-url'
import { logError } from '@/lib/log'

const paramsSchema = z.object({
  videoId: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid video ID format'),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { videoId } = await params
  const parsed = paramsSchema.safeParse({ videoId })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
  }

  const tier = await getMemberTier(supabase)

  let url: string | null
  try {
    url = generateSignedUrl(parsed.data.videoId, tier)
  } catch (err) {
    logError('[video API] Bunny config error:', err)
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  if (!url) {
    return NextResponse.json(
      { error: 'Your membership tier does not include video access' },
      { status: 403 },
    )
  }

  const n8nWebhookUrl = process.env.N8N_BASE_URL
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET
  if (n8nWebhookUrl && webhookSecret) {
    fetch(`${n8nWebhookUrl}/webhook/video-access-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-webhook-secret': webhookSecret },
      body: JSON.stringify({
        userId: user.id,
        videoId: parsed.data.videoId,
        tier,
        accessedAt: new Date().toISOString(),
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ url })
}
