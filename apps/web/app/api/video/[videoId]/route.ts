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

  // Workflow 9 (bunny-video-access-log) was retired on 16 Oct 2026 (Johan):
  // no video access log is kept.
  return NextResponse.json({ url })
}
