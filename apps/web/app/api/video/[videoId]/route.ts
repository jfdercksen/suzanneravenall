import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { getMemberTier } from '@/lib/access/check-access'
import { generateSignedUrl } from '@/lib/bunny/get-signed-url'

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
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[video API] Bunny config error:', message)
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  if (!url) {
    return NextResponse.json(
      { error: 'Your membership tier does not include video access' },
      { status: 403 },
    )
  }

  // TODO: insert into video_access_log table once it is created via the
  // add-supabase-table skill. Columns: user_id, video_id, tier, accessed_at.
  // Example:
  //   await supabase.from('video_access_log').insert({
  //     user_id: user.id, video_id: parsed.data.videoId, tier, accessed_at: new Date().toISOString(),
  //   })

  return NextResponse.json({ url })
}
